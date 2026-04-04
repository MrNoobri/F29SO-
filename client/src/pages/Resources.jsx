import React, { useState } from "react";
import { useNavigate } from "react-router";
import { BookOpen, Clock, ChevronDown, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import DashboardDock from "../components/patient/DashboardDock";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { healthArticles, articleCategories } from "../data/healthArticles";

const CATEGORY_COLORS = {
  Nutrition: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Fitness: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "Mental Health": "bg-purple-500/10 text-purple-600 border-purple-500/20",
  "Heart Health": "bg-red-500/10 text-red-600 border-red-500/20",
  Sleep: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  Diabetes: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

export default function Resources() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const [expandedId, setExpandedId] = useState(null);

  const filtered =
    activeCategory === "All"
      ? healthArticles
      : healthArticles.filter((a) => a.category === activeCategory);

  const handleSidebarNav = (tabId) => {
    navigate("/dashboard", { state: { tab: tabId } });
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleAskAI = (article) => {
    navigate("/dashboard", { state: { askAI: article.title } });
  };

  return (
    <div className="relative min-h-screen bg-transparent">
      <DashboardDock
        activeTab="resources"
        onTabChange={handleSidebarNav}
        role={user?.role || "patient"}
      />

      <div className="relative z-10 flex justify-center">
        <div className="w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-8 pb-28">
          {/* Header */}
          <div className="mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-primary" />
                Health Resources
              </h1>
              <p className="text-muted-foreground mt-2">
                Evidence-based articles to support your wellness journey
              </p>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="mb-6 flex flex-wrap gap-1 border-b border-border">
            {articleCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setExpandedId(null);
                }}
                className={cn(
                  "px-4 py-2 font-medium text-sm transition-colors",
                  activeCategory === cat
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((article) => {
              const isExpanded = expandedId === article.id;
              const badgeClass =
                CATEGORY_COLORS[article.category] ||
                "bg-primary/10 text-primary border-primary/20";

              return (
                <Card
                  key={article.id}
                  className={cn(
                    "transition-shadow hover:shadow-md",
                    isExpanded && "md:col-span-2",
                  )}
                >
                  <CardContent className="p-6">
                    {/* Card Header Row */}
                    <div className="flex items-start gap-4">
                      <div className="text-3xl shrink-0">{article.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span
                            className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                              badgeClass,
                            )}
                          >
                            {article.category}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {article.readTime}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-foreground leading-snug mb-1">
                          {article.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {article.summary}
                        </p>
                      </div>
                    </div>

                    {/* Expanded Body */}
                    {isExpanded && (
                      <div className="mt-5 pt-5 border-t border-border space-y-4">
                        {article.body.map((para, i) => (
                          <p
                            key={i}
                            className="text-sm text-foreground/85 leading-relaxed"
                          >
                            {para}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-4 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleExpand(article.id)}
                        className="gap-1.5"
                      >
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 transition-transform duration-200",
                            isExpanded && "rotate-180",
                          )}
                        />
                        {isExpanded ? "Collapse" : "Read Article"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAskAI(article)}
                        className="gap-1.5 text-primary hover:text-primary"
                      >
                        <Sparkles className="w-4 h-4" />
                        Ask AI
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
