import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, X } from "lucide-react";

const TIER_COLORS = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
};

// All possible achievements for showing locked ones
const ALL_ACHIEVEMENTS = [
  { type: "streak_master", title: "Streak Master", icon: "🔥", tiers: ["bronze", "silver", "gold"] },
  { type: "daily_devotee", title: "Daily Devotee", icon: "📋", tiers: ["bronze", "silver", "gold"] },
  { type: "vital_signs_pro", title: "Vital Signs Pro", icon: "📊", tiers: ["bronze", "silver", "gold"] },
  { type: "med_adherent", title: "Med Adherent", icon: "💊", tiers: ["bronze", "silver", "gold"] },
  { type: "journal_keeper", title: "Journal Keeper", icon: "📝", tiers: ["bronze", "silver", "gold"] },
  { type: "conversation_starter", title: "Conversation Starter", icon: "💬", tiers: ["bronze", "silver", "gold"] },
  { type: "appointment_keeper", title: "Appointment Keeper", icon: "📅", tiers: ["bronze", "silver", "gold"] },
  { type: "level_up", title: "Level Up", icon: "⬆️", tiers: ["bronze", "silver", "gold"] },
];

export default function AchievementGrid({ achievements = [] }) {
  const [selected, setSelected] = useState(null);

  // Build a map of unlocked achievements
  const unlockedMap = {};
  achievements.forEach((a) => {
    unlockedMap[`${a.type}_${a.tier}`] = a;
  });

  // Build full list with locked/unlocked status
  const allItems = [];
  ALL_ACHIEVEMENTS.forEach((def) => {
    def.tiers.forEach((tier) => {
      const key = `${def.type}_${tier}`;
      const unlocked = unlockedMap[key];
      allItems.push({
        key,
        type: def.type,
        tier,
        title: def.title,
        icon: def.icon,
        unlocked: !!unlocked,
        description: unlocked?.description || "",
        unlockedAt: unlocked?.unlockedAt,
        progress: unlocked?.progress,
      });
    });
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-6"
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Achievements ({achievements.length}/{allItems.length})
      </h3>

      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {allItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setSelected(item)}
            className={`relative flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all hover:scale-105 ${
              item.unlocked
                ? "border-opacity-100 bg-card"
                : "border-border/30 bg-muted/20 opacity-50 grayscale"
            }`}
            style={{
              borderColor: item.unlocked ? TIER_COLORS[item.tier] : undefined,
            }}
          >
            <span className="text-2xl">{item.icon}</span>
            {!item.unlocked && (
              <Lock className="w-3 h-3 text-muted-foreground absolute top-1 right-1" />
            )}
            <span className="text-xs text-muted-foreground capitalize">
              {item.tier}
            </span>
          </button>
        ))}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{selected.icon}</span>
                  <div>
                    <h4 className="font-semibold text-foreground">
                      {selected.title}
                    </h4>
                    <span
                      className="text-xs font-medium capitalize px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${TIER_COLORS[selected.tier]}20`,
                        color: TIER_COLORS[selected.tier],
                      }}
                    >
                      {selected.tier}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-muted-foreground mb-3">
                {selected.description || `Unlock the ${selected.tier} ${selected.title} achievement`}
              </p>

              {selected.unlocked ? (
                <p className="text-xs text-green-500 font-medium">
                  Unlocked {selected.unlockedAt ? new Date(selected.unlockedAt).toLocaleDateString() : ""}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Not yet unlocked
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
