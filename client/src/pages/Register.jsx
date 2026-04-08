import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
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

// ── Password strength scoring ──
// Returns { score: 0-4, label, color, hint }
const evaluatePasswordStrength = (password) => {
  if (!password) {
    return { score: 0, label: "", color: "bg-stone-700", hint: "" };
  }
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  // Cap at 4
  score = Math.min(score, 4);

  const tiers = [
    { label: "Too weak", color: "bg-red-600", hint: "At least 8 characters" },
    { label: "Weak", color: "bg-red-500", hint: "Add upper/lowercase letters" },
    { label: "Fair", color: "bg-amber-500", hint: "Add numbers or symbols" },
    { label: "Strong", color: "bg-emerald-500", hint: "Looking good" },
    { label: "Very strong", color: "bg-emerald-400", hint: "Excellent password" },
  ];
  return { score, ...tiers[score] };
};

// Small visual marker for required vs optional fields
const RequiredMark = () => (
  <span className="ml-1 text-rose-400" aria-label="required">*</span>
);
const OptionalMark = () => (
  <span className="ml-1 text-xs font-normal text-stone-500">(optional)</span>
);

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
    healthInfo: {
      heightCm: "",
      weightKg: "",
      medicalHistory: "",
      insuranceProvider: "",
      insurancePolicyNumber: "",
      stepsGoal: "",
      caloriesGoal: "",
      sleepGoal: "",
    },
  });
  const [patientStep, setPatientStep] = useState(1); // 1 = essentials, 2 = health profile
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

      const redirect = params.get("redirect") || "/dashboard";

      try {
        setLoading(true);
        await completeOAuthLogin();

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

    if (name.startsWith("healthInfo.")) {
      const healthField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        healthInfo: {
          ...prev.healthInfo,
          [healthField]: value,
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
        healthInfo:
          formData.role === "patient"
            ? {
                heightCm: formData.healthInfo.heightCm
                  ? Number(formData.healthInfo.heightCm)
                  : undefined,
                weightKg: formData.healthInfo.weightKg
                  ? Number(formData.healthInfo.weightKg)
                  : undefined,
                medicalHistory:
                  formData.healthInfo.medicalHistory || undefined,
                insuranceProvider:
                  formData.healthInfo.insuranceProvider || undefined,
                insurancePolicyNumber:
                  formData.healthInfo.insurancePolicyNumber || undefined,
                goals: {
                  steps: formData.healthInfo.stepsGoal
                    ? Number(formData.healthInfo.stepsGoal)
                    : undefined,
                  calories: formData.healthInfo.caloriesGoal
                    ? Number(formData.healthInfo.caloriesGoal)
                    : undefined,
                  sleep: formData.healthInfo.sleepGoal
                    ? Number(formData.healthInfo.sleepGoal)
                    : undefined,
                },
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
      const msg =
        submitError.response?.data?.message ||
        "Registration failed. Please try again.";
      setError(msg);
      // If the error is about email or password, go back to step 1 so it's visible
      const step1Keywords = ["email", "password", "uppercase", "number", "character"];
      if (
        formData.role === "patient" &&
        patientStep === 2 &&
        step1Keywords.some((kw) => msg.toLowerCase().includes(kw))
      ) {
        setPatientStep(1);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-rose-950/40 relative">
      <BackgroundPaths className="opacity-20 text-rose-400" />
      <Link
        to="/"
        className="fixed top-5 left-5 z-50 lg:hidden text-2xl font-black tracking-tighter text-white/80 hover:text-white transition-colors duration-200"
      >
        <span className="text-rose-500">MED</span>XI
      </Link>
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

                    {/* Step indicator (patient only) */}
                    {formData.role === "patient" && (
                      <div className="mb-5 flex items-center gap-3">
                        <div className="flex flex-1 items-center gap-2">
                          <div
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                              patientStep >= 1
                                ? "bg-rose-700 text-white"
                                : "bg-stone-800 text-stone-400",
                            )}
                          >
                            1
                          </div>
                          <span className="text-xs font-medium text-stone-300">
                            Account
                          </span>
                        </div>
                        <div
                          className={cn(
                            "h-px flex-1 transition-colors",
                            patientStep >= 2 ? "bg-rose-700" : "bg-stone-700",
                          )}
                        />
                        <div className="flex flex-1 items-center justify-end gap-2">
                          <span className="text-xs font-medium text-stone-300">
                            Health profile
                          </span>
                          <div
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                              patientStep >= 2
                                ? "bg-rose-700 text-white"
                                : "bg-stone-800 text-stone-400",
                            )}
                          >
                            2
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

                      {/* ─── STEP 1: Account essentials ─── */}
                      {(formData.role !== "patient" || patientStep === 1) && (
                        <>
                      <p className="text-xs text-stone-500">
                        Fields marked <span className="text-rose-400">*</span>{" "}
                        are required.
                      </p>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">
                            First Name
                            <RequiredMark />
                          </Label>
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
                          <Label htmlFor="lastName">
                            Last Name
                            <RequiredMark />
                          </Label>
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
                        <Label htmlFor="email">
                          Email address
                          <RequiredMark />
                        </Label>
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
                        <Label htmlFor="phone">
                          Phone Number
                          <OptionalMark />
                        </Label>
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
                                label={
                                  <>
                                    Date of Birth
                                    <RequiredMark />
                                  </>
                                }
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
                              <Label htmlFor="gender">
                                Gender
                                <OptionalMark />
                              </Label>
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
                              <RequiredMark />
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
                        <Label htmlFor="password">
                          Password
                          <RequiredMark />
                        </Label>
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
                        {/* Password strength meter */}
                        {formData.password && (() => {
                          const s = evaluatePasswordStrength(formData.password);
                          const p = formData.password;
                          const reqs = [
                            { label: "8+ characters", met: p.length >= 8 },
                            { label: "Uppercase letter", met: /[A-Z]/.test(p) },
                            { label: "Number", met: /[0-9]/.test(p) },
                          ];
                          return (
                            <div className="space-y-1.5 pt-1">
                              <div className="flex gap-1">
                                {[0, 1, 2, 3].map((i) => (
                                  <div
                                    key={i}
                                    className={cn(
                                      "h-1.5 flex-1 rounded-full transition-colors",
                                      i < s.score ? s.color : "bg-stone-700",
                                    )}
                                  />
                                ))}
                              </div>
                              <p className="flex justify-between text-xs">
                                <span
                                  className={cn(
                                    "font-medium",
                                    s.score <= 1
                                      ? "text-red-400"
                                      : s.score === 2
                                      ? "text-amber-400"
                                      : "text-emerald-400",
                                  )}
                                >
                                  {s.label}
                                </span>
                              </p>
                              <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                                {reqs.map((r) => (
                                  <span
                                    key={r.label}
                                    className={cn(
                                      "text-xs",
                                      r.met ? "text-emerald-400" : "text-stone-500",
                                    )}
                                  >
                                    {r.met ? "✓" : "✗"} {r.label}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">
                          Confirm Password
                          <RequiredMark />
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
                        {formData.confirmPassword &&
                          formData.password !== formData.confirmPassword && (
                            <p className="text-xs text-red-400">
                              Passwords do not match
                            </p>
                          )}
                      </div>
                        </>
                      )}

                      {/* ─── STEP 2: Health profile (patient only, all optional) ─── */}
                      {formData.role === "patient" && patientStep === 2 && (
                        <motion.div
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                          className="space-y-5"
                        >
                          <div className="rounded-lg border border-rose-900/40 bg-rose-950/20 px-4 py-3 text-xs text-rose-200">
                            All fields below are <strong>optional</strong>. They help
                            personalize your dashboard, alerts, and goals — you can
                            update them anytime from your profile.
                          </div>

                          {/* Body metrics */}
                          <div>
                            <h3 className="mb-3 text-sm font-semibold text-stone-200">
                              Body metrics
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="heightCm">
                                  Height (cm)
                                  <OptionalMark />
                                </Label>
                                <Input
                                  id="heightCm"
                                  name="healthInfo.heightCm"
                                  type="number"
                                  min="0"
                                  placeholder="e.g. 175"
                                  className="bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-500"
                                  value={formData.healthInfo.heightCm}
                                  onChange={handleChange}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="weightKg">
                                  Weight (kg)
                                  <OptionalMark />
                                </Label>
                                <Input
                                  id="weightKg"
                                  name="healthInfo.weightKg"
                                  type="number"
                                  min="0"
                                  placeholder="e.g. 70"
                                  className="bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-500"
                                  value={formData.healthInfo.weightKg}
                                  onChange={handleChange}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Medical & insurance */}
                          <div>
                            <h3 className="mb-3 text-sm font-semibold text-stone-200">
                              Medical & insurance
                            </h3>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="medicalHistory">
                                  Medical history
                                  <OptionalMark />
                                </Label>
                                <textarea
                                  id="medicalHistory"
                                  name="healthInfo.medicalHistory"
                                  rows={3}
                                  placeholder="Conditions, allergies, medications…"
                                  className="flex w-full rounded-md border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-rose-700"
                                  value={formData.healthInfo.medicalHistory}
                                  onChange={handleChange}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="insuranceProvider">
                                    Insurance provider
                                    <OptionalMark />
                                  </Label>
                                  <Input
                                    id="insuranceProvider"
                                    name="healthInfo.insuranceProvider"
                                    placeholder="e.g. Aetna"
                                    className="bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-500"
                                    value={formData.healthInfo.insuranceProvider}
                                    onChange={handleChange}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="insurancePolicyNumber">
                                    Policy number
                                    <OptionalMark />
                                  </Label>
                                  <Input
                                    id="insurancePolicyNumber"
                                    name="healthInfo.insurancePolicyNumber"
                                    placeholder="e.g. ABC123456"
                                    className="bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-500"
                                    value={
                                      formData.healthInfo.insurancePolicyNumber
                                    }
                                    onChange={handleChange}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Daily goals */}
                          <div>
                            <h3 className="mb-3 text-sm font-semibold text-stone-200">
                              Daily health goals
                            </h3>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="stepsGoal">
                                  Steps
                                  <OptionalMark />
                                </Label>
                                <Input
                                  id="stepsGoal"
                                  name="healthInfo.stepsGoal"
                                  type="number"
                                  min="0"
                                  placeholder="10000"
                                  className="bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-500"
                                  value={formData.healthInfo.stepsGoal}
                                  onChange={handleChange}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="caloriesGoal">
                                  Calories
                                  <OptionalMark />
                                </Label>
                                <Input
                                  id="caloriesGoal"
                                  name="healthInfo.caloriesGoal"
                                  type="number"
                                  min="0"
                                  placeholder="2000"
                                  className="bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-500"
                                  value={formData.healthInfo.caloriesGoal}
                                  onChange={handleChange}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="sleepGoal">
                                  Sleep (hrs)
                                  <OptionalMark />
                                </Label>
                                <Input
                                  id="sleepGoal"
                                  name="healthInfo.sleepGoal"
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  placeholder="8"
                                  className="bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-500"
                                  value={formData.healthInfo.sleepGoal}
                                  onChange={handleChange}
                                />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* ─── Action buttons ─── */}
                      {formData.role === "patient" ? (
                        patientStep === 1 ? (
                          <Button
                            type="button"
                            onClick={() => {
                              setError("");
                              // Lightweight validation before advancing
                              if (
                                !formData.profile.firstName ||
                                !formData.profile.lastName ||
                                !formData.email ||
                                !formData.profile.dateOfBirth
                              ) {
                                setError(
                                  "Please fill in all required fields before continuing.",
                                );
                                return;
                              }
                              if (formData.password.length < 8) {
                                setError(
                                  "Password must be at least 8 characters.",
                                );
                                return;
                              }
                              if (!/[A-Z]/.test(formData.password)) {
                                setError(
                                  "Password must contain at least one uppercase letter.",
                                );
                                return;
                              }
                              if (!/[0-9]/.test(formData.password)) {
                                setError(
                                  "Password must contain at least one number.",
                                );
                                return;
                              }
                              if (
                                formData.password !== formData.confirmPassword
                              ) {
                                setError("Passwords do not match.");
                                return;
                              }
                              setPatientStep(2);
                            }}
                            className="w-full bg-gradient-to-r from-rose-900 via-red-800 to-rose-700 hover:from-rose-800 hover:via-red-700 hover:to-rose-600 text-white"
                          >
                            Continue to health profile →
                          </Button>
                        ) : (
                          <div className="flex gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setError("");
                                setPatientStep(1);
                              }}
                              className="flex-1 bg-stone-800 border-stone-700 text-stone-100 hover:bg-stone-700"
                            >
                              ← Back
                            </Button>
                            <Button
                              type="submit"
                              disabled={loading}
                              className="flex-[2] bg-gradient-to-r from-rose-900 via-red-800 to-rose-700 hover:from-rose-800 hover:via-red-700 hover:to-rose-600 text-white"
                            >
                              {loading ? "Creating account..." : "Sign up"}
                            </Button>
                          </div>
                        )
                      ) : (
                        <Button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-rose-900 via-red-800 to-rose-700 hover:from-rose-800 hover:via-red-700 hover:to-rose-600 text-white"
                        >
                          {loading ? "Creating account..." : "Sign up"}
                        </Button>
                      )}

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
            <h1 className="mt-8 block text-6xl font-black tracking-tight">MEDXI</h1>
            <p className="mt-6 max-w-md text-lg text-rose-100">
              Choose Patient or Doctor, complete your details, and start using
              your personalized virtual health companion.
            </p>
            <Link
              to="/"
              className="group mt-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/5 px-4 py-2 text-sm font-medium text-rose-100 backdrop-blur-sm transition-all hover:border-white/60 hover:bg-white/10 hover:text-white"
            >
              <span aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5">←</span>
              Back to home
            </Link>
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
