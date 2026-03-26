import React, { useRef, useState } from "react";
import { X, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const chatConfig = {
  dimensions: {
    sm: "sm:max-w-sm sm:max-h-[500px]",
    md: "sm:max-w-md sm:max-h-[600px]",
    lg: "sm:max-w-lg sm:max-h-[700px]",
    xl: "sm:max-w-xl sm:max-h-[800px]",
    full: "sm:w-full sm:h-full",
  },
  // On mobile, push button above the bottom tab bar; on desktop, sit at the corner
  positions: {
    "bottom-right": "bottom-[72px] right-4 xl:bottom-6 xl:right-6",
    "bottom-left": "bottom-[72px] left-4 xl:bottom-6 xl:left-6",
  },
  chatPositions: {
    "bottom-right": "sm:bottom-[calc(100%+10px)] sm:right-0",
    "bottom-left": "sm:bottom-[calc(100%+10px)] sm:left-0",
  },
};

const ExpandableChat = ({
  className,
  position = "bottom-right",
  size = "md",
  children,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const chatRef = useRef(null);

  const toggleChat = () => setIsOpen((prev) => !prev);

  return (
    <div className="contents">
      {/* Backdrop blur overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-background/40 backdrop-blur-sm"
            onClick={toggleChat}
          />
        )}
      </AnimatePresence>

      <div
        className={cn(
          `fixed ${chatConfig.positions[position]} z-50`,
          className,
        )}
        {...props}
      >
        {/* Chat panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={chatRef}
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className={cn(
                "flex flex-col bg-background/95 backdrop-blur-xl sm:rounded-2xl shadow-2xl overflow-hidden sm:absolute sm:w-[90vw] sm:h-[80vh] fixed inset-0 w-full h-full sm:inset-auto",
                chatConfig.chatPositions[position],
                chatConfig.dimensions[size],
              )}
            >
              {children}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 sm:hidden"
                onClick={toggleChat}
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <ExpandableChatToggle isOpen={isOpen} toggleChat={toggleChat} />
      </div>
    </div>
  );
};

ExpandableChat.displayName = "ExpandableChat";

const ExpandableChatHeader = ({ className, ...props }) => (
  <div
    className={cn("flex items-center justify-between p-4", className)}
    {...props}
  />
);

ExpandableChatHeader.displayName = "ExpandableChatHeader";

const ExpandableChatBody = ({ className, ...props }) => (
  <div className={cn("flex-grow overflow-y-auto", className)} {...props} />
);

ExpandableChatBody.displayName = "ExpandableChatBody";

const ExpandableChatFooter = ({ className, ...props }) => (
  <div className={cn("p-4", className)} {...props} />
);

ExpandableChatFooter.displayName = "ExpandableChatFooter";

const ExpandableChatToggle = ({ className, isOpen, toggleChat, ...props }) => (
  <motion.button
    onClick={toggleChat}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
    className={cn(
      "relative w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center",
      "bg-gradient-to-br from-primary to-primary/80",
      "text-primary-foreground",
      "ring-2 ring-primary/20 hover:ring-primary/40 transition-all",
      "cursor-pointer select-none",
      className,
    )}
    aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
    {...props}
  >
    {/* Pulsating ring — only when closed */}
    {!isOpen && (
      <span
        className="absolute inset-0 rounded-2xl animate-ping bg-primary/20 pointer-events-none"
        style={{ animationDuration: "2.5s" }}
      />
    )}

    <AnimatePresence mode="wait" initial={false}>
      {isOpen ? (
        <motion.span
          key="close"
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <X className="h-6 w-6" />
        </motion.span>
      ) : (
        <motion.span
          key="xi"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="relative text-lg font-black tracking-tighter leading-none"
        >
          <span className="opacity-80">X</span>I
        </motion.span>
      )}
    </AnimatePresence>
  </motion.button>
);

ExpandableChatToggle.displayName = "ExpandableChatToggle";

export {
  ExpandableChat,
  ExpandableChatHeader,
  ExpandableChatBody,
  ExpandableChatFooter,
};
