import React, { useState } from "react";
import { useParams, Link } from "react-router";
import { motion } from "framer-motion";
import { authAPI } from "../api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { KeyRound, CheckCircle } from "lucide-react";

const ResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword(token, { password });
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Reset failed. The link may have expired."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-rose-950/40 relative flex items-center justify-center px-4">
      <BackgroundPaths className="opacity-20 text-rose-400" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md z-10"
      >
        <Card className="bg-stone-900 text-stone-100 border-stone-800 shadow-2xl">
          <CardHeader className="pb-4 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-950/60 border border-rose-800">
              {success ? (
                <CheckCircle className="h-6 w-6 text-emerald-400" />
              ) : (
                <KeyRound className="h-6 w-6 text-rose-400" />
              )}
            </div>
            <CardTitle className="text-2xl text-stone-100">
              {success ? "Password reset!" : "Set new password"}
            </CardTitle>
            <p className="text-sm text-stone-400 mt-1">
              {success
                ? "Your password has been updated. You can now sign in."
                : "Enter your new password below."}
            </p>
          </CardHeader>
          <CardContent>
            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-danger-light border border-danger text-danger-dark px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    placeholder="Min 8 characters"
                    className="bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    placeholder="Re-enter password"
                    className="bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-500"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-rose-900 via-red-800 to-rose-700 hover:from-rose-800 hover:via-red-700 hover:to-rose-600 text-white"
                >
                  {loading ? "Resetting..." : "Reset password"}
                </Button>
              </form>
            ) : (
              <Button
                asChild
                className="w-full bg-gradient-to-r from-rose-900 via-red-800 to-rose-700 hover:from-rose-800 hover:via-red-700 hover:to-rose-600 text-white"
              >
                <Link to="/login">Sign in</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
