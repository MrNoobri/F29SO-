import React, { useState, useEffect } from "react";
import { Search, Clock, Flame, Users, X, ChefHat } from "lucide-react";
import axios from "../../api/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const CATEGORY_META = {
  "high-protein": { icon: "💪", label: "High Protein", color: "#ef4444" },
  "high-carb":    { icon: "🍚", label: "High Carb",    color: "#f97316" },
  "high-fat":     { icon: "🥑", label: "Healthy Fats", color: "#22c55e" },
};

const MacroBadge = ({ label, value, unit, color }) => (
  <span
    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
    style={{ background: `color-mix(in srgb, ${color} 18%, var(--surface))`, color }}
  >
    {value}{unit} {label}
  </span>
);

/* ── Recipe Detail Modal ── */
const RecipeModal = ({ recipe, onClose }) => {
  if (!recipe) return null;
  const meta = CATEGORY_META[recipe.category] || CATEGORY_META["high-protein"];
  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal — wide landscape layout */}
      <div
        className="relative z-10 w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-border shrink-0">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{ background: `color-mix(in srgb, ${meta.color} 15%, var(--surface))` }}
          >
            {meta.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground leading-tight truncate">{recipe.title}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: `color-mix(in srgb, ${meta.color} 15%, var(--surface))`, color: meta.color }}
              >
                {meta.label}
              </span>
              {/* Inline stats */}
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Flame className="h-3 w-3 text-orange-400" />{recipe.calories} kcal
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 text-blue-400" />{totalTime} min
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3 text-purple-400" />{recipe.servings} servings
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body — two columns, each scrollable independently */}
        <div className="flex flex-1 min-h-0 divide-x divide-border">

          {/* Left column: ingredients + macros */}
          <div className="w-2/5 flex flex-col gap-4 p-5 overflow-y-auto">
            {recipe.description && (
              <p className="text-xs text-muted-foreground leading-relaxed">{recipe.description}</p>
            )}

            {/* Macros */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Nutrition / serving</h3>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: "Protein", value: recipe.nutrition?.protein ?? 0, color: "#ef4444" },
                  { label: "Carbs",   value: recipe.nutrition?.carbs   ?? 0, color: "#f97316" },
                  { label: "Fat",     value: recipe.nutrition?.fat     ?? 0, color: "#22c55e" },
                  { label: "Fiber",   value: recipe.nutrition?.fiber   ?? 0, color: "#8b5cf6" },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs"
                    style={{ background: `color-mix(in srgb, ${color} 12%, var(--surface))` }}
                  >
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold" style={{ color }}>{value}g</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ingredients */}
            {recipe.ingredients?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Ingredients</h3>
                <ul className="space-y-1.5">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 text-xs">
                      <span className="flex items-center gap-1.5 text-foreground min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        <span className="truncate">{ing.name}</span>
                      </span>
                      <span className="text-muted-foreground shrink-0">{ing.amount} {ing.unit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tags */}
            {recipe.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {recipe.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right column: instructions */}
          <div className="flex-1 flex flex-col gap-3 p-5 overflow-y-auto">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Instructions</h3>
            {recipe.instructions?.length > 0 ? (
              <ol className="space-y-3">
                {recipe.instructions
                  .sort((a, b) => a.step - b.step)
                  .map((inst) => (
                    <li key={inst.step} className="flex gap-3 text-sm">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                        style={{ background: `color-mix(in srgb, ${meta.color} 20%, var(--surface))`, color: meta.color }}
                      >
                        {inst.step}
                      </span>
                      <span className="text-muted-foreground leading-relaxed">{inst.description}</span>
                    </li>
                  ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">No instructions available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Recipe Card ── */
const RecipeCard = ({ recipe, onClick }) => {
  const meta = CATEGORY_META[recipe.category] || CATEGORY_META["high-protein"];
  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-border bg-card/60 hover:bg-card hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
    >
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
        style={{ background: `color-mix(in srgb, ${meta.color} 15%, var(--surface))` }}
      >
        {meta.icon}
      </div>

      {/* Title */}
      <h4 className="flex-1 min-w-0 font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
        {recipe.title}
      </h4>

      {/* Stats — right-aligned */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
        <span className="flex items-center gap-1">
          <Flame className="h-3 w-3 text-orange-400" />
          {recipe.calories}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-blue-400" />
          {totalTime}m
        </span>
        <span
          className="font-semibold text-xs px-1.5 py-0.5 rounded-full"
          style={{ background: `color-mix(in srgb, ${meta.color} 15%, var(--surface))`, color: meta.color }}
        >
          {recipe.nutrition?.protein ?? 0}g P
        </span>
      </div>

      {/* Arrow */}
      <div className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
};

/* ── Main Widget ── */
const RecipesWidget = ({ className }) => {
  const [selectedCategory, setSelectedCategory] = useState("high-protein");
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  useEffect(() => {
    fetchRecipes();
  }, [selectedCategory, search]);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/recipes", {
        params: {
          category: selectedCategory,
          search: search || undefined,
          limit: 10,
        },
      });
      setRecipes(res.data.data || []);
    } catch {
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = Object.entries(CATEGORY_META).map(([id, meta]) => ({ id, ...meta }));

  return (
    <>
      <Card className={cn("flex flex-col overflow-hidden", className)}>
        <CardHeader className="pb-3 shrink-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <ChefHat className="h-5 w-5 text-primary" />
            Healthy Recipes
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-3 flex-1 min-h-0 overflow-hidden pb-4">
          {/* Search */}
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search recipes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 shrink-0 overflow-x-auto pb-0.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border",
                  selectedCategory === cat.id
                    ? "bg-primary/15 text-primary border-primary/25 shadow-sm"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40",
                )}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Recipe list */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-0.5">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : recipes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground">
                <ChefHat className="h-8 w-8 opacity-30" />
                <p className="text-sm">No recipes found</p>
              </div>
            ) : (
              recipes.map((recipe) => (
                <RecipeCard
                  key={recipe._id}
                  recipe={recipe}
                  onClick={() => setSelectedRecipe(recipe)}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recipe detail modal */}
      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </>
  );
};

export default RecipesWidget;
