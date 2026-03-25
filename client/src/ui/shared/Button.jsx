import { forwardRef } from "react";
import { cn } from "../shared/utils";

const Button = forwardRef(
  (
    { className, variant = "default", size = "default", children, ...props },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

    const variants = {
      default:
        "bg-gradient-to-r from-violet-700 to-purple-600 text-white hover:from-violet-800 hover:to-purple-700 focus-visible:ring-violet-500 shadow-sm",
      destructive:
        "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500",
      outline:
        "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-400",
      secondary:
        "bg-slate-200 text-slate-900 hover:bg-slate-300 focus-visible:ring-slate-400",
      ghost: "text-slate-700 hover:bg-slate-100",
      link: "text-violet-700 underline-offset-4 hover:underline",
    };

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-8 px-3 text-sm",
      lg: "h-12 px-6",
      icon: "h-10 w-10",
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button };
