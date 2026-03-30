const User = require("../models/User.model");
const crypto = require("crypto");
const { google } = require("googleapis");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} = require("../utils/jwt.util");
const { createAuditLog } = require("../middleware/audit.middleware");
const emailService = require("../services/emailService");

const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_AUTH_CLIENT_ID || process.env.GOOGLE_FIT_CLIENT_ID;
const GOOGLE_CLIENT_SECRET =
  process.env.GOOGLE_AUTH_CLIENT_SECRET || process.env.GOOGLE_FIT_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_AUTH_REDIRECT_URI ||
  "http://localhost:5000/api/auth/google/callback";

const oauthClient = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
);

const GOOGLE_SCOPES = ["openid", "email", "profile"];

const parseName = (fullName = "") => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "Google", lastName: "User" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "User" };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
};

/**
 * Start Google OAuth login
 */
const getGoogleAuthUrl = async (req, res) => {
  try {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Google authentication is not configured",
      });
    }

    const requestedRole =
      req.query.role === "provider" || req.query.role === "patient"
        ? req.query.role
        : "patient";
    const mode = req.query.mode === "signup" ? "signup" : "login";

    if (mode === "signup" && requestedRole !== "patient") {
      return res.status(400).json({
        success: false,
        message: "Google signup is available for patients only",
      });
    }

    const statePayload = Buffer.from(
      JSON.stringify({ role: requestedRole, mode }),
    ).toString("base64url");

    const authUrl = oauthClient.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: GOOGLE_SCOPES,
      state: statePayload,
    });

    res.redirect(authUrl);
  } catch (error) {
    console.error("Google auth URL error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to initialize Google authentication",
    });
  }
};

/**
 * Google OAuth callback
 */
const handleGoogleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    if (!code) {
      return res.redirect(`${clientUrl}/login?oauth=error`);
    }

    const decodedState = state
      ? JSON.parse(Buffer.from(state, "base64url").toString("utf8"))
      : {};
    const requestedRole =
      decodedState?.role === "provider" || decodedState?.role === "patient"
        ? decodedState.role
        : "patient";
    const mode = decodedState?.mode === "signup" ? "signup" : "login";

    if (mode === "signup" && requestedRole !== "patient") {
      return res.redirect(`${clientUrl}/register?oauth=role_not_allowed`);
    }

    const { tokens } = await oauthClient.getToken(code);
    oauthClient.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauthClient });
    const me = await oauth2.userinfo.get();

    const email = me?.data?.email;
    if (!email) {
      return res.redirect(`${clientUrl}/login?oauth=error`);
    }

    let user = await User.findOne({ email }).select("+password +refreshToken");
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const { firstName, lastName } = parseName(me?.data?.name);
      const role = mode === "signup" ? "patient" : requestedRole;

      const userData = {
        email,
        password: `oauth-${Math.random().toString(36).slice(-12)}A1!`,
        role,
        profile: {
          firstName,
          lastName,
          dateOfBirth: role === "patient" ? new Date("1990-01-01") : undefined,
          avatar: me?.data?.picture || null,
        },
      };

      if (role === "provider") {
        userData.providerInfo = {
          specialization: "General Practice",
        };
      }

      user = await User.create(userData);
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    await createAuditLog(user._id, user.role, "login-google", {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    const redirectMap = {
      patient: "/dashboard",
      provider: "/provider/dashboard",
      admin: "/admin/dashboard",
    };
    const redirectPath = redirectMap[user.role] || "/dashboard";

    const oauthTarget = mode === "signup" ? "/register" : "/login";
    const oauthStatus =
      mode === "signup" && isNewUser ? "needs_password" : "success";

    return res.redirect(
      `${clientUrl}${oauthTarget}?oauth=${oauthStatus}&accessToken=${encodeURIComponent(accessToken)}&refreshToken=${encodeURIComponent(refreshToken)}&redirect=${encodeURIComponent(redirectPath)}`,
    );
  } catch (error) {
    console.error("Google callback error:", error);
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    return res.redirect(`${clientUrl}/login?oauth=error`);
  }
};

/**
 * Set password for authenticated user (used after OAuth signup)
 */
const setPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least one uppercase letter",
      });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least one number",
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.password = password;
    await user.save();

    await createAuditLog(user._id, user.role, "password-set", {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.json({
      success: true,
      message: "Password saved successfully",
    });
  } catch (error) {
    console.error("Set password error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save password",
    });
  }
};

/**
 * Update authenticated user's UI preferences
 */
const updatePreferences = async (req, res) => {
  try {
    const allowedThemes = ["crimson", "medical", "midnight", "emerald"];
    const allowedModes = ["light", "dark"];

    const incomingTheme = req.body?.theme;
    const incomingMode = req.body?.mode;

    if (
      (incomingTheme && !allowedThemes.includes(incomingTheme)) ||
      (incomingMode && !allowedModes.includes(incomingMode))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid theme or mode",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.uiPreferences = {
      theme: incomingTheme || user.uiPreferences?.theme || "midnight",
      mode: incomingMode || user.uiPreferences?.mode || "light",
    };

    await user.save();

    await createAuditLog(user._id, user.role, "settings-changed", {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      metadata: {
        section: "ui-preferences",
        theme: user.uiPreferences.theme,
        mode: user.uiPreferences.mode,
      },
    });

    return res.json({
      success: true,
      message: "Preferences updated",
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update preferences",
    });
  }
};

/**
 * Register new user
 */
const register = async (req, res) => {
  try {
    const { email, password, role, profile, providerInfo, patientInfo } =
      req.body;

    // Validate email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Password policy: min 8 chars, at least 1 uppercase, 1 number
    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least one uppercase letter",
      });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least one number",
      });
    }

    // Validate role
    if (role && !["patient", "provider"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Create user
    const userData = {
      email,
      password,
      role: role || "patient",
      profile,
    };

    if (role === "provider" && providerInfo) {
      userData.providerInfo = providerInfo;
    }

    if (role === "patient" && patientInfo) {
      userData.patientInfo = patientInfo;
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    userData.emailVerificationToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");
    userData.emailVerificationExpires = Date.now() + 60 * 60 * 1000; // 1 hour

    const user = await User.create(userData);

    // Send verification email (non-blocking, don't fail registration)
    try {
      const verificationUrl = `${
        process.env.CLIENT_URL || "http://localhost:5173"
      }/verify-email/${verificationToken}`;
      await emailService.sendVerificationEmail(user.email, {
        name: user.profile?.firstName || "User",
        verificationUrl,
      });
    } catch (emailErr) {
      console.error("Verification email failed:", emailErr.message);
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Log registration
    await createAuditLog(user._id, user.role, "register", {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully. Please verify your email.",
      data: {
        user: user.toJSON(),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user with password
    const user = await User.findOne({ email }).select("+password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Update user
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    // Log login
    await createAuditLog(user._id, user.role, "login", {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    const message = user.isEmailVerified
      ? "Login successful"
      : "Login successful. Please verify your email for full access.";

    res.json({
      success: true,
      message,
      data: {
        user: user.toJSON(),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

/**
 * Refresh access token
 */
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token required",
      });
    }

    const decoded = verifyToken(refreshToken, true);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const user = await User.findById(decoded.userId).select("+refreshToken");

    if (!user || !user.isActive || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user._id, user.role);

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({
      success: false,
      message: "Token refresh failed",
    });
  }
};

/**
 * Logout user
 */
const logout = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.refreshToken = null;
      await user.save();

      await createAuditLog(user._id, user.role, "logout", {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });
    }

    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

/**
 * Get current user
 */
const getCurrentUser = async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user data",
    });
  }
};

/**
 * Get all providers (healthcare professionals)
 */
const getProviders = async (req, res) => {
  try {
    const providers = await User.find({
      role: "provider",
      isActive: true,
    }).select("profile providerInfo");

    res.json({
      success: true,
      data: providers,
    });
  } catch (error) {
    console.error("Get providers error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get providers",
    });
  }
};

/**
 * Verify email with token
 */
const verifyEmail = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    }).select("+emailVerificationToken +emailVerificationExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verify email error:", error);
    res.status(500).json({
      success: false,
      message: "Email verification failed",
    });
  }
};

/**
 * Forgot password – send reset email
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: "If that email exists, a reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    try {
      const resetUrl = `${
        process.env.CLIENT_URL || "http://localhost:5173"
      }/reset-password/${resetToken}`;
      const emailResult = await emailService.sendPasswordResetEmail(user.email, {
        name: user.profile?.firstName || "User",
        resetUrl,
      });

      // Check if email was actually sent (handle skipped/failed responses)
      if (!emailResult.success && !emailResult.skipped) {
        throw new Error(emailResult.error || "Failed to send email");
      }
    } catch (emailErr) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      console.error("Reset email failed:", emailErr.message);
      return res.status(500).json({
        success: false,
        message: "Failed to send reset email. Please try again.",
      });
    }

    res.json({
      success: true,
      message: "If that email exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

/**
 * Reset password with token
 */
const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least one uppercase letter",
      });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least one number",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successful. You can now log in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Password reset failed",
    });
  }
};

module.exports = {
  register,
  login,
  getGoogleAuthUrl,
  handleGoogleCallback,
  setPassword,
  updatePreferences,
  refreshAccessToken,
  logout,
  getCurrentUser,
  getProviders,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
