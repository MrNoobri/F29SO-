import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  HelpCircle,
  ChevronDown,
  Star,
  Send,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { feedbackAPI } from "../api";
import DashboardDock from "../components/patient/DashboardDock";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { faqItems, faqCategories } from "../data/faqData";

const FEEDBACK_CATEGORIES = [
  "Bug Report",
  "Feature Request",
  "General Feedback",
  "Compliment",
];

export default function Help() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // FAQ state
  const [faqCategory, setFaqCategory] = useState("All");
  const [openFaqId, setOpenFaqId] = useState(null);

  // Feedback form state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");

  const filteredFaqs =
    faqCategory === "All"
      ? faqItems
      : faqItems.filter((f) => f.category === faqCategory);

  const handleSidebarNav = (tabId) => {
    navigate("/dashboard", { state: { tab: tabId } });
  };

  const submitMutation = useMutation({
    mutationFn: () =>
      feedbackAPI.submit({ rating, category, message }),
    onSuccess: () => {
      toast.success("Thank you for your feedback!");
      setRating(0);
      setCategory("");
      setMessage("");
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message || "Failed to submit feedback. Please try again.",
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.warning("Please select a star rating.");
      return;
    }
    if (!category) {
      toast.warning("Please select a feedback category.");
      return;
    }
    if (message.trim().length < 10) {
      toast.warning("Message must be at least 10 characters.");
      return;
    }
    submitMutation.mutate();
  };

  return (
    <div className="relative min-h-screen bg-transparent">
      <DashboardDock
        activeTab="help"
        onTabChange={handleSidebarNav}
        role={user?.role || "patient"}
      />

      <div className="relative z-10 flex justify-center">
        <div className="w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-8 pb-28">
          {/* Header */}
          <div className="mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <HelpCircle className="w-8 h-8 text-primary" />
                Help Center
              </h1>
              <p className="text-muted-foreground mt-2">
                Find answers to common questions and share your feedback
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* FAQ Section — takes 2 cols on lg */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                Frequently Asked Questions
              </h2>

              {/* FAQ Category Filter */}
              <div className="flex flex-wrap gap-1 border-b border-border mb-4">
                {faqCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setFaqCategory(cat);
                      setOpenFaqId(null);
                    }}
                    className={cn(
                      "px-4 py-2 font-medium text-sm transition-colors",
                      faqCategory === cat
                        ? "text-primary border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* FAQ Accordion */}
              <div className="space-y-2">
                {filteredFaqs.map((faq) => {
                  const isOpen = openFaqId === faq.id;
                  return (
                    <Card
                      key={faq.id}
                      className="overflow-hidden transition-shadow hover:shadow-sm"
                    >
                      <button
                        className="w-full text-left"
                        onClick={() =>
                          setOpenFaqId(isOpen ? null : faq.id)
                        }
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium text-foreground text-sm leading-snug">
                              {faq.question}
                            </span>
                            <ChevronDown
                              className={cn(
                                "w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200",
                                isOpen && "rotate-180",
                              )}
                            />
                          </div>
                          {isOpen && (
                            <p className="mt-3 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
                              {faq.answer}
                            </p>
                          )}
                        </CardContent>
                      </button>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Feedback Form — takes 1 col on lg */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Share Feedback</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Help us improve MEDXI with your thoughts
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Star Rating */}
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">
                        Overall Rating
                      </label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={cn(
                                "w-7 h-7 transition-colors",
                                (hoverRating || rating) >= star
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-muted-foreground/40",
                              )}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Category */}
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="">Select a category…</option>
                        {FEEDBACK_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">
                        Message
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell us what's on your mind…"
                        rows={5}
                        maxLength={2000}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <p className="text-xs text-muted-foreground mt-1 text-right">
                        {message.length}/2000
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full gap-2"
                      disabled={submitMutation.isPending}
                    >
                      {submitMutation.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {submitMutation.isPending ? "Submitting…" : "Submit Feedback"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
