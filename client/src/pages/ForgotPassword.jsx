import React, { useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { authAPI } from "../api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authAPI.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(
        err.response?.data?.message || "Something went wrong. Please try again."
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
              {sent ? (
                <CheckCircle className="h-6 w-6 text-emerald-400" />
              ) : (
                <Mail className="h-6 w-6 text-rose-400" />
              )}
            </div>
            <CardTitle className="text-2xl text-stone-100">
              {sent ? "Check your email" : "Forgot password?"}
            </CardTitle>
            <p className="text-sm text-stone-400 mt-1">
              {sent
                ? "If an account exists for that email, we've sent a reset link."
                : "Enter your email and we'll send you a reset link."}
            </p>
          </CardHeader>
          <CardContent>
            {!sent ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-danger-light border border-danger text-danger-dark px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-rose-900 via-red-800 to-rose-700 hover:from-rose-800 hover:via-red-700 hover:to-rose-600 text-white"
                >
                  {loading ? "Sending..." : "Send reset link"}
                </Button>
              </form>
            ) : (
              <Button
                asChild
                variant="outline"
                className="w-full bg-stone-800 border-stone-700 text-stone-100 hover:bg-stone-700"
              >
                <Link to="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to sign in
                </Link>
              </Button>
            )}

            {!sent && (
              <div className="mt-5 text-center">
                <Link
                  to="/login"
                  className="text-sm text-rose-400 hover:text-rose-300"
                >
                  <ArrowLeft className="inline mr-1 h-3 w-3" />
                  Back to sign in
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
