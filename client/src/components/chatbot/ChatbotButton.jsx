import React from "react";

const ChatbotButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-full shadow-2xl border border-border/60 hover:scale-110 transition-transform duration-200 flex items-center justify-center z-40 group"
      aria-label="Open AI Assistant"
    >
      <span className="text-xl font-black tracking-tighter group-hover:scale-110 transition-transform">
        XI
      </span>
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full border-2 border-card animate-pulse"></span>
    </button>
  );
};

export default ChatbotButton;
