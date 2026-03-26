import * as React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageLoading } from "@/components/ui/message-loading";

export function ChatBubble({ variant = "received", className, children }) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 mb-4",
        variant === "sent" && "flex-row-reverse",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ChatBubbleMessage({
  variant = "received",
  isLoading,
  className,
  children,
}) {
  return (
    <div
      className={cn(
        "rounded-lg p-3",
        variant === "sent" ? "bg-primary text-primary-foreground" : "bg-muted",
        className,
      )}
    >
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <MessageLoading />
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export function ChatBubbleAvatar({ src, fallback = "AI", className, variant }) {
  return (
    <Avatar className={cn("h-8 w-8", className)}>
      {src && <AvatarImage src={src} />}
      <AvatarFallback
        className={cn(
          variant === "ai" &&
            "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold text-xs",
        )}
      >
        {fallback}
      </AvatarFallback>
    </Avatar>
  );
}

