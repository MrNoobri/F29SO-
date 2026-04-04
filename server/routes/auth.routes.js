const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const authController = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");

// Auth-specific rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: "Too many login attempts, please try again after 15 minutes" },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 5 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many registration attempts, please try again later" },
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 5 : 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many password reset attempts, please try again later" },
});

// Public routes
router.post("/register", registerLimiter, authController.register);
router.post("/login", loginLimiter, authController.login);
router.get("/google", authController.getGoogleAuthUrl);
router.get("/google/callback", authController.handleGoogleCallback);
router.post("/refresh", authController.refreshAccessToken);
router.get("/verify-email/:token", authController.verifyEmail);
router.post("/forgot-password", passwordResetLimiter, authController.forgotPassword);
router.post("/reset-password/:token", passwordResetLimiter, authController.resetPassword);

// Protected routes
router.post("/logout", authenticate, authController.logout);
router.post("/set-password", authenticate, authController.setPassword);
router.patch("/preferences", authenticate, authController.updatePreferences);
router.patch("/profile", authenticate, authController.updateProfile);
router.patch("/change-password", authenticate, authController.changePassword);
router.delete("/account", authenticate, authController.deleteAccount);
router.get("/me", authenticate, authController.getCurrentUser);
router.get("/providers", authenticate, authController.getProviders);

module.exports = router;
