import React from "react";
import { motion } from "framer-motion";

// Stable random durations computed once at module load — never changes on re-render
const DURATIONS = Array.from({ length: 36 }, () => 20 + Math.random() * 10);

function FloatingPaths({ position }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.5 + i * 0.03,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="w-full h-full" viewBox="0 0 696 316" fill="none">
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.1 + path.id * 0.03}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={{
              pathLength: 1,
              opacity: [0.3, 0.6, 0.3],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: DURATIONS[path.id],
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </svg>
    </div>
  );
}

/**
 * Animated floating SVG paths background.
 * Uses `text-secondary` colour from theme via currentColor.
 *
 * @param {object}  props
 * @param {string}  [props.className]  Extra wrapper classes
 * @param {boolean} [props.overlay]    If true, renders as a fixed full-screen overlay
 */
export function BackgroundPaths({ className = "", overlay = false }) {
  return (
    <div
      className={`${
        overlay ? "fixed inset-0 z-0" : "absolute inset-0"
      } pointer-events-none overflow-hidden text-secondary ${className}`}
    >
      <FloatingPaths position={1} />
      <FloatingPaths position={-1} />
    </div>
  );
}

export default BackgroundPaths;
