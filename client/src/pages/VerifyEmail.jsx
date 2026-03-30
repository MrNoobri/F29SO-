import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { motion } from "framer-motion";
import { authAPI } from "../api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await authAPI.verifyEmail(token);
        setMessage(res.data.message || "Email verified successfully!");
        setStatus("success");
      } catch (err) {
        setMessage(
          err.response?.data?.message || "Verification failed. The link may have expired."
        );
        setStatus("error");
      }
    };
    verify();
  }, [token]);

  const icons = {
    loading: <Loader2 className="h-6 w-6 text-rose-400 animate-spin" />,
    success: <CheckCircle className="h-6 w-6 text-emerald-400" />,
    error: <XCircle className="h-6 w-6 text-red-400" />,
  };

  const titles = {
    loading: "Verifying...",
    success: "Email verified!",
    error: "Verification failed",
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
              {icons[status]}
            </div>
            <CardTitle className="text-2xl text-stone-100">
              {titles[status]}
            </CardTitle>
            {message && (
              <p className="text-sm text-stone-400 mt-1">{message}</p>
            )}
          </CardHeader>
          <CardContent>
            {status !== "loading" && (
              <Button
                asChild
                className="w-full bg-gradient-to-r from-rose-900 via-red-800 to-rose-700 hover:from-rose-800 hover:via-red-700 hover:to-rose-600 text-white"
              >
                <Link to="/login">
                  {status === "success" ? "Sign in" : "Back to sign in"}
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
