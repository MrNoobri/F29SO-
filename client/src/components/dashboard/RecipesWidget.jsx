import React, { useState } from "react";

const RecipesWidget = ({ className }) => {
  const [selectedCategory, setSelectedCategory] = useState("heart-healthy");

  const recipeCategories = {
    "heart-healthy": [
      {
        title: "Quinoa Salad Bowl",
        calories: 320,
        time: "15 min",
        image: "🥗",
        tags: ["High Protein", "Low Sodium"],
      },
      {
        title: "Grilled Salmon",
        calories: 280,
        time: "20 min",
        image: "🐟",
        tags: ["Omega-3", "Heart Healthy"],
      },
      {
        title: "Avocado Toast",
        calories: 250,
        time: "5 min",
        image: "🥑",
        tags: ["Healthy Fats", "Quick"],
      },
    ],
    diabetic: [
      {
        title: "Chicken & Veggie Stir-Fry",
        calories: 290,
        time: "25 min",
        image: "🍗",
        tags: ["Low Carb", "High Protein"],
      },
      {
        title: "Cauliflower Rice Bowl",
        calories: 180,
        time: "15 min",
        image: "🥦",
        tags: ["Low Carb", "Fiber Rich"],
      },
      {
        title: "Greek Yogurt Parfait",
        calories: 160,
        time: "5 min",
        image: "🥛",
        tags: ["Low Sugar", "Probiotic"],
      },
    ],
    "weight-loss": [
      {
        title: "Zucchini Noodles",
        calories: 120,
        time: "10 min",
        image: "🍝",
        tags: ["Low Calorie", "High Volume"],
      },
      {
        title: "Berry Smoothie",
        calories: 150,
        time: "5 min",
        image: "🍓",
        tags: ["Antioxidants", "Filling"],
      },
      {
        title: "Egg White Omelette",
        calories: 180,
        time: "10 min",
        image: "🍳",
        tags: ["High Protein", "Low Fat"],
      },
    ],
  };

  const categories = [
    { id: "heart-healthy", name: "Heart Healthy", icon: "❤️" },
    { id: "diabetic", name: "Diabetic Friendly", icon: "🩸" },
    { id: "weight-loss", name: "Weight Loss", icon: "⚖️" },
  ];

  return (
    <div className={`card flex flex-col ${className || ""}`}>
      <h3 className="text-xl font-semibold mb-4 flex items-center shrink-0">
        <span className="mr-2">🍽️</span>
        Healthy Recipes
      </h3>

      {/* Category Tabs */}
      <div className="flex space-x-2 mb-4 overflow-x-auto pb-2 shrink-0">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Recipes Grid */}
      <div className="space-y-3 overflow-y-auto flex-1 min-h-0">
        {recipeCategories[selectedCategory].map((recipe, index) => (
          <div
            key={index}
            className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <div className="text-4xl mr-3">{recipe.image}</div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-gray-900 mb-1">
                {recipe.title}
              </h4>
              <div className="flex items-center space-x-3 text-xs text-gray-600 mb-1">
                <span>🔥 {recipe.calories} cal</span>
                <span>⏱️ {recipe.time}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {recipe.tags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <button className="text-primary-600 hover:text-primary-700">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecipesWidget;
