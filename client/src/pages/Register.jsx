import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../api";
import Toast from "../components/common/Toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePickerInput } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";

const AUTH_TRANSITION_MS = 620;

const Register = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "patient",
    profile: {
      firstName: "",
      lastName: "",
      phone: "",
      dateOfBirth: "",
      gender: "",
    },
    providerInfo: {
      specialization: "",
    },
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsGooglePasswordSetup, setNeedsGooglePasswordSetup] =
    useState(false);
  const [passwordSetupData, setPasswordSetupData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [oauthRedirectPath, setOauthRedirectPath] = useState("/dashboard");
  const [toast, setToast] = useState(null);
  const [isTransitioningToSignin, setIsTransitioningToSignin] = useState(false);

  const { register, completeOAuthLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const pending = sessionStorage.getItem("googlePasswordSetupPending");
    if (pending === "1") {
      setNeedsGooglePasswordSetup(true);
      setOauthRedirectPath(
        sessionStorage.getItem("googlePasswordSetupRedirect") || "/dashboard",
      );
    }
  }, []);

  useEffect(() => {
    const runOAuthCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const oauthStatus = params.get("oauth");
      if (!oauthStatus) return;

      if (oauthStatus === "role_not_allowed") {
        setError("Google signup is available for patients only.");
        navigate("/register", { replace: true });
        return;
      }

      if (oauthStatus === "error") {
        setError("Google signup failed. Please try again.");
        navigate("/register", { replace: true });
        return;
      }

      if (oauthStatus !== "success" && oauthStatus !== "needs_password") {
        setError("Google signup failed. Please try again.");
        navigate("/register", { replace: true });
        return;
      }

      const accessToken = params.get("accessToken");
      const refreshToken = params.get("refreshToken");
      const redirect = params.get("redirect") || "/dashboard";

      if (!accessToken || !refreshToken) {
        setError("Google signup failed. Missing authentication tokens.");
        navigate("/register", { replace: true });
        return;
      }

      try {
        setLoading(true);
        await completeOAuthLogin({ accessToken, refreshToken });

        if (oauthStatus === "needs_password") {
          sessionStorage.setItem("googlePasswordSetupPending", "1");
          sessionStorage.setItem("googlePasswordSetupRedirect", redirect);
          setNeedsGooglePasswordSetup(true);
          setOauthRedirectPath(redirect);
          navigate("/register", { replace: true });
          return;
        }

        navigate(redirect, { replace: true });
      } catch (oauthError) {
        setError("Google signup failed. Please try again.");
        navigate("/register", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    runOAuthCallback();
  }, [completeOAuthLogin, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("profile.")) {
      const profileField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          [profileField]: value,
        },
      }));
      return;
    }

    if (name.startsWith("providerInfo.")) {
      const providerField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        providerInfo: {
          ...prev.providerInfo,
          [providerField]: value,
        },
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (role) => {
    setError("");
    setFormData((prev) => ({
      ...prev,
      role,
      profile: {
        ...prev.profile,
        dateOfBirth: role === "patient" ? prev.profile.dateOfBirth : "",
      },
    }));
  };

  const handleGoogleSignUp = () => {
    setError("");
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    window.location.href = `${apiBase}/auth/google?role=patient&mode=signup`;
  };

  const handlePasswordSetupChange = (e) => {
    const { name, value } = e.target;
    setPasswordSetupData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGooglePasswordSetup = async (e) => {
    e.preventDefault();
    setError("");

    if (passwordSetupData.password !== passwordSetupData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (passwordSetupData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    try {
      setLoading(true);
      await authAPI.setPassword({ password: passwordSetupData.password });
      sessionStorage.removeItem("googlePasswordSetupPending");
      sessionStorage.removeItem("googlePasswordSetupRedirect");
      setToast({
        message: "Password saved. Redirecting to your dashboard...",
        type: "success",
      });
    } catch (setupError) {
      setError(setupError.response?.data?.message || "Failed to save password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToSignin = (e) => {
    e.preventDefault();
    if (isTransitioningToSignin) return;

    setIsTransitioningToSignin(true);
    setTimeout(() => {
      navigate("/login");
    }, AUTH_TRANSITION_MS);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (formData.role === "patient" && !formData.profile.dateOfBirth) {
      setError("Date of birth is required for patients");
      return;
    }

    if (
      formData.role === "provider" &&
      !formData.providerInfo.specialization.trim()
    ) {
      setError("Specialization is required for doctors");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        role: formData.role,
        profile: {
          firstName: formData.profile.firstName,
          lastName: formData.profile.lastName,
          phone: formData.profile.phone,
          gender: formData.profile.gender || undefined,
          dateOfBirth:
            formData.role === "patient"
              ? formData.profile.dateOfBirth
              : undefined,
        },
        providerInfo:
          formData.role === "provider"
            ? {
                specialization: formData.providerInfo.specialization,
              }
            : undefined,
      };

      const user = await register(payload);

      const dashboardMap = {
        patient: "/dashboard",
        provider: "/provider/dashboard",
        admin: "/admin/dashboard",
      };
      navigate(dashboardMap[user.role] || "/dashboard");
    } catch (submitError) {
      setError(
        submitError.response?.data?.message ||
          "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-rose-950/40 relative">
      <BackgroundPaths className="opacity-20 text-rose-400" />
      <motion.div
        initial={{ opacity: 1 }}
        animate={
          isTransitioningToSignin
            ? { opacity: 0.94, scale: 0.996 }
            : { opacity: 1, scale: 1 }
        }
        transition={{
          duration: AUTH_TRANSITION_MS / 1000,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="min-h-screen grid grid-cols-1 lg:grid-cols-2"
      >
        <motion.section
          initial={{ x: 0, opacity: 1 }}
          animate={
            isTransitioningToSignin
              ? { x: 64, opacity: 0.6 }
              : { x: 0, opacity: 1 }
          }
          transition={{
            duration: AUTH_TRANSITION_MS / 1000,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="flex items-center justify-center px-4 py-10 sm:px-8 lg:order-1"
        >
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="w-full max-w-xl"
          >
            <Card className="bg-stone-900 text-stone-100 border-stone-800 shadow-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl text-stone-100">
                  {needsGooglePasswordSetup
                    ? "Set your password"
                    : "Create your account"}
                </CardTitle>
                <p className="text-sm text-stone-400">
                  {needsGooglePasswordSetup
                    ? "Finish setup so you can sign in with Google or email/password anytime"
                    : "Choose your role to load the matching signup fields"}
                </p>
              </CardHeader>
              <CardContent>
                {needsGooglePasswordSetup ? (
                  <form
                    className="space-y-5"
                    onSubmit={handleGooglePasswordSetup}
                  >
                    {error && (
                      <div className="rounded-lg border border-danger bg-danger-light px-4 py-3 text-danger-dark">
                        {error}
                      </div>
                    )}

                    <div className="rounded-lg border border-rose-800 bg-rose-950/50 px-4 py-3 text-sm text-rose-200">
                      You are signed in with Google. Create a password to also
                      sign in with email and password.
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="google-password">New Password</Label>
                      <Input
                        id="google-password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        className="bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-500"
                        value={passwordSetupData.password}
                        onChange={handlePasswordSetupChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="google-confirm-password">
                        Confirm Password
                      </Label>
                      <Input
                        id="google-confirm-password"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        className="bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-500"
                        value={passwordSetupData.confirmPassword}
                        onChange={handlePasswordSetupChange}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-rose-900 via-red-800 to-rose-700 hover:from-rose-800 hover:via-red-700 hover:to-rose-600 text-white"
                    >
                      {loading
                        ? "Saving password..."
                        : "Save password & continue"}
                    </Button>
                  </form>
                ) : (
                  <>
                    <div className="relative mb-6 grid grid-cols-2 gap-2 rounded-xl bg-stone-800 p-1">
                      <motion.div
                        layout
                        transition={{
                          type: "spring",
                          stiffness: 320,
                          damping: 28,
                        }}
                        className={cn(
                          "absolute top-1 bottom-1 w-[calc(50%-0.25rem)] rounded-lg bg-gradient-to-r from-rose-900 via-red-800 to-rose-700",
                          formData.role === "patient"
                            ? "left-1"
                            : "left-[calc(50%)]",
                        )}
                      />
                      <button
                        type="button"
                        className={cn(
                          "relative z-10 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                          formData.role === "patient"
                            ? "text-white"
                            : "text-stone-400",
                        )}
                        onClick={() => handleRoleChange("patient")}
                      >
                        Patient
                      </button>
                      <button
                        type="button"
                        className={cn(
                          "relative z-10 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                          formData.role === "provider"
                            ? "text-white"
                            : "text-stone-400",
                        )}
                        onClick={() => handleRoleChange("provider")}
                      >
                        Doctor
                      </button>
                    </div>

                    {formData.role === "patient" && (
                      <div className="mb-6">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleGoogleSignUp}
                          className="w-full bg-stone-800 border-stone-700 text-stone-100 hover:bg-stone-700"
                        >
                          <svg
                            className="mr-2 h-4 w-4"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              fill="currentColor"
                              d="M21.35 11.1h-9.17v2.98h5.26c-.23 1.5-1.83 4.4-5.26 4.4-3.17 0-5.75-2.62-5.75-5.86s2.58-5.86 5.75-5.86c1.8 0 3 .77 3.69 1.43l2.52-2.43C16.91 4.47 14.75 3.5 12.18 3.5 7.22 3.5 3.2 7.6 3.2 12.62s4.02 9.12 8.98 9.12c5.18 0 8.61-3.64 8.61-8.77 0-.59-.06-1.04-.14-1.87Z"
                            />
                          </svg>
                          Sign up with Google
                        </Button>

                        <div className="relative mt-4">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-stone-700" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-stone-900 px-2 text-stone-400">
                              Or use email
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <form className="space-y-5" onSubmit={handleSubmit}>
                      {error && (
                        <div className="rounded-lg border border-danger bg-danger-light px-4 py-3 text-danger-dark">
                          {error}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            name="profile.firstName"
                            required
                            className="bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-500"
                            value={formData.profile.firstName}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            name="profile.lastName"
                            required
                            className="bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-500"
                            value={formData.profile.lastName}
                            onChange={handleChange}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          className="bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-500"
                          value={formData.email}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          name="profile.phone"
                          type="tel"
                          className="bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-500"
                          value={formData.profile.phone}
                          onChange={handleChange}
                        />
                      </div>

                      <AnimatePresence mode="wait">
                        {formData.role === "patient" ? (
                          <motion.div
                            key="patient-fields"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                            className="grid grid-cols-2 gap-4"
                          >
                            <div className="space-y-2">
                              <DatePickerInput
                                label="Date of Birth"
                                controlClassName="bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-500"
                                onValueChange={(details) => {
                                  const dateStr =
                                    details.valueAsString[0] || "";
                                  setFormData((prev) => ({
                                    ...prev,
                                    profile: {
                                      ...prev.profile,
                                      dateOfBirth: dateStr,
                                    },
                                  }));
                                }}
                                isDateUnavailable={(date) => {
                                  const today = new Date();
                                  today.setHours(0, 0, 0, 0);
                                  const d = new Date(
                                    date.year,
                                    date.month - 1,
                                    date.day,
                                  );
                                  return d > today;
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="gender">Gender</Label>
                              <select
                                id="gender"
                                name="profile.gender"
                                className="flex h-10 w-full rounded-md border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100"
                                value={formData.profile.gender}
                                onChange={handleChange}
                              >
                                <option value="">Select</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                                <option value="prefer-not-to-say">
                                  Prefer not to say
                                </option>
                              </select>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="provider-fields"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                            className="space-y-2"
                          >
                            <Label htmlFor="specialization">
                              Specialization
                            </Label>
                            <Input
                              id="specialization"
                              name="providerInfo.specialization"
                              placeholder="e.g. Cardiology"
                              required
                              className="bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-500"
                              value={formData.providerInfo.specialization}
                              onChange={handleChange}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          autoComplete="new-password"
                          required
                          className="bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-500"
                          value={formData.password}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">
                          Confirm Password
                        </Label>
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          autoComplete="new-password"
                          required
                          className="bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-500"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-rose-900 via-red-800 to-rose-700 hover:from-rose-800 hover:via-red-700 hover:to-rose-600 text-white"
                      >
                        {loading ? "Creating account..." : "Sign up"}
                      </Button>

                      <p className="text-center text-sm text-stone-400">
                        Already have an account?{" "}
                        <button
                          type="button"
                          onClick={handleGoToSignin}
                          disabled={isTransitioningToSignin}
                          className="font-medium text-rose-400 hover:text-rose-300"
                        >
                          Sign in
                        </button>
                      </p>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.section>

        <motion.section
          initial={{ x: 0, opacity: 1 }}
          animate={
            isTransitioningToSignin
              ? { x: -320, opacity: 0.42 }
              : { x: 0, opacity: 1 }
          }
          transition={{
            duration: AUTH_TRANSITION_MS / 1000,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="hidden lg:flex flex-col justify-between p-14 bg-gradient-to-br from-stone-950 via-rose-950 to-red-900 text-white lg:order-2 items-start"
        >
          <div>
            <p className="inline-block rounded-full border border-white/30 px-4 py-1 text-xs tracking-wide uppercase">
              Create your MEDXI profile
            </p>
            <h1 className="mt-8 text-6xl font-black tracking-tight">MEDXI</h1>
            <p className="mt-6 max-w-md text-lg text-rose-100">
              Choose Patient or Doctor, complete your details, and start using
              your personalized virtual health companion.
            </p>
          </div>
        </motion.section>
      </motion.div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={1400}
          onClose={() => {
            setToast(null);
            navigate(oauthRedirectPath, { replace: true });
          }}
        />
      )}
    </div>
  );
};

export default Register;
