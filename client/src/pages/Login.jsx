import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { cn } from "@/lib/utils";

const ROLE_TILES = {
  patient: {
    title: "Patient Login",
    subtitle: "Track health, appointments, and alerts",
  },
  provider: {
    title: "Doctor Login",
    subtitle: "Review patient metrics and messages",
  },
};

const AUTH_TRANSITION_MS = 620;

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isTransitioningToSignup, setIsTransitioningToSignup] = useState(false);

  const { login, completeOAuthLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const runOAuthCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const oauthStatus = params.get("oauth");

      if (!oauthStatus) return;

      if (oauthStatus === "exists") {
        setError("Account already exists. Please sign in with your password.");
        navigate("/login", { replace: true });
        return;
      }

      if (oauthStatus === "needs_password") {
        navigate(`/register?${params.toString()}`, { replace: true });
        return;
      }

      if (oauthStatus === "error") {
        setError("Google sign-in failed. Please try again.");
        navigate("/login", { replace: true });
        return;
      }

      if (oauthStatus !== "success") {
        setError("Google sign-in failed. Please try again.");
        navigate("/login", { replace: true });
        return;
      }

      const accessToken = params.get("accessToken");
      const refreshToken = params.get("refreshToken");
      const redirect = params.get("redirect");

      if (!accessToken || !refreshToken) {
        setError("Google sign-in failed. Missing authentication tokens.");
        navigate("/login", { replace: true });
        return;
      }

      try {
        setLoading(true);
        const user = await completeOAuthLogin({ accessToken, refreshToken });

        const dashboardMap = {
          patient: "/dashboard",
          provider: "/provider/dashboard",
          admin: "/admin/dashboard",
        };

        navigate(redirect || dashboardMap[user.role] || "/dashboard", {
          replace: true,
        });
      } catch (oauthError) {
        setError("Google sign-in failed. Please try again.");
        navigate("/login", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    runOAuthCallback();
  }, [completeOAuthLogin, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(formData);

      // Navigate based on role
      const dashboardMap = {
        patient: "/dashboard",
        provider: "/provider/dashboard",
        admin: "/admin/dashboard",
      };
      navigate(dashboardMap[user.role] || "/dashboard");
    } catch (error) {
      setError(
        error.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const selectRole = (role) => {
    setSelectedRole(role);
    setError("");
  };

  const handleGoogleSignIn = () => {
    setError("");
    const role = selectedRole || "patient";
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    window.location.href = `${apiBase}/auth/google?role=${encodeURIComponent(role)}`;
  };

  const handleGoToSignup = (e) => {
    e.preventDefault();
    if (isTransitioningToSignup) return;

    setIsTransitioningToSignup(true);
    setTimeout(() => {
      navigate("/register");
    }, AUTH_TRANSITION_MS);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-rose-950/40 relative">
      <BackgroundPaths className="opacity-20 text-rose-400" />
      <motion.div
        initial={{ opacity: 1 }}
        animate={
          isTransitioningToSignup
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
            isTransitioningToSignup
              ? { x: 320, opacity: 0.42 }
              : { x: 0, opacity: 1 }
          }
          transition={{
            duration: AUTH_TRANSITION_MS / 1000,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="hidden lg:flex flex-col justify-between p-14 bg-gradient-to-br from-stone-950 via-rose-950 to-red-900 text-white"
        >
          <div>
            <p className="inline-block rounded-full border border-white/30 px-4 py-1 text-xs tracking-wide uppercase">
              Virtual Care Platform
            </p>
            <h1 className="mt-8 text-6xl font-black tracking-tight">MEDXI</h1>
            <p className="mt-6 max-w-md text-lg text-rose-100">
              Smarter care for patients and providers. Monitor health insights,
              appointments, and communication in one place.
            </p>
          </div>
          <p className="text-sm text-rose-200/90">
            Secure healthcare companion for modern care teams.
          </p>
        </motion.section>

        <motion.section
          initial={{ x: 0, opacity: 1 }}
          animate={
            isTransitioningToSignup
              ? { x: -64, opacity: 0.6 }
              : { x: 0, opacity: 1 }
          }
          transition={{
            duration: AUTH_TRANSITION_MS / 1000,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="flex items-center justify-center px-4 py-10 sm:px-8"
        >
          <Card className="w-full max-w-xl bg-stone-900 text-stone-100 border-stone-800 shadow-2xl">
            <CardHeader className="pb-4">
              <h2 className="text-center text-3xl font-extrabold text-stone-100 lg:hidden">
                MEDXI
              </h2>
              <CardTitle className="text-center text-2xl text-stone-100">
                Sign in to your account
              </CardTitle>
              <p className="text-center text-sm text-stone-400">
                Select your role to use the right login
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {Object.entries(ROLE_TILES).map(([role, config]) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => selectRole(role)}
                    className={cn(
                      "rounded-xl border p-4 text-left transition-all",
                      selectedRole === role
                        ? "border-rose-700 bg-rose-950/60 shadow-sm"
                        : "border-stone-700 hover:border-rose-600 hover:bg-stone-800/70",
                    )}
                  >
                    <p className="font-semibold text-stone-100">
                      {config.title}
                    </p>
                    <p className="mt-1 text-xs text-stone-400">
                      {config.subtitle}
                    </p>
                  </button>
                ))}
              </div>

              <div className="mb-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
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
                  Continue with Google
                </Button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-stone-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-stone-900 px-2 text-stone-400">
                    Or continue with email
                  </span>
                </div>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-danger-light border border-danger text-danger-dark px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="Enter your email"
                      className="bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-500"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      placeholder="Enter your password"
                      className="bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-500"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <div className="text-right">
                      <Link
                        to="/forgot-password"
                        className="text-xs text-rose-400 hover:text-rose-300"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  </div>
                </div>

                <div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full text-base bg-gradient-to-r from-rose-900 via-red-800 to-rose-700 hover:from-rose-800 hover:via-red-700 hover:to-rose-600 text-white"
                  >
                    {loading ? "Signing in..." : "Sign in"}
                  </Button>
                </div>

                <div className="text-center">
                  <p className="text-sm text-stone-400">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={handleGoToSignup}
                      disabled={isTransitioningToSignup}
                      className="font-medium text-rose-400 hover:text-rose-300"
                    >
                      Sign up
                    </button>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.section>
      </motion.div>
    </div>
  );
};

export default Login;
