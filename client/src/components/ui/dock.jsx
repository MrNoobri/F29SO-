import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const DockContext = React.createContext({});

function Dock({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 shadow-lg backdrop-blur",
        className,
      )}
      {...props}
    >
      <DockContext.Provider value={{}}>{children}</DockContext.Provider>
    </div>
  );
}

function DockItem({ children, className, active = false, ...props }) {
  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.04 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "group relative flex h-12 w-12 items-center justify-center rounded-full border transition-colors",
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900",
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}

function DockIcon({ children, className }) {
  return <span className={cn("flex items-center justify-center", className)}>{children}</span>;
}

function DockLabel({ children, className }) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white shadow-md group-hover:block",
        className,
      )}
    >
      {children}
    </span>
  );
}

export { Dock, DockItem, DockIcon, DockLabel, DockContext };
