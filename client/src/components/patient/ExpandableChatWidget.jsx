import React, { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { chatbotAPI } from "../../api";
import { Button } from "@/components/ui/button";
import {
  ExpandableChat,
  ExpandableChatHeader,
  ExpandableChatBody,
  ExpandableChatFooter,
} from "@/components/ui/expandable-chat";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat-bubble";
import { ChatInput } from "@/components/ui/chat-input";
import { ChatMessageList } from "@/components/ui/chat-message-list";
import { CornerDownLeft, Sparkles } from "lucide-react";

/** Renders a subset of markdown as React elements for AI messages. */
const MarkdownMessage = ({ content }) => {
  const parseInline = (text, keyPrefix) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      const k = `${keyPrefix}-${i}`;
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={k}>{part.slice(2, -2)}</strong>;
      if (part.startsWith("*") && part.endsWith("*"))
        return <em key={k}>{part.slice(1, -1)}</em>;
      if (part.startsWith("`") && part.endsWith("`"))
        return (
          <code key={k} className="bg-muted-foreground/10 rounded px-1 text-xs font-mono">
            {part.slice(1, -1)}
          </code>
        );
      return part;
    });
  };

  const lines = content.split("\n");
  const elements = [];
  let listItems = [];
  let listType = null;
  let key = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    const Tag = listType === "ol" ? "ol" : "ul";
    elements.push(
      <Tag
        key={key++}
        className={`my-1 pl-4 space-y-0.5 ${listType === "ol" ? "list-decimal" : "list-disc"}`}
      >
        {listItems}
      </Tag>
    );
    listItems = [];
    listType = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^#{1,3} /.test(line)) {
      flushList();
      const level = line.match(/^(#+)/)[1].length;
      const text = line.replace(/^#+\s/, "");
      const cls = level === 1 ? "font-bold mt-2 mb-0.5" : "font-semibold mt-1.5 mb-0.5";
      elements.push(<p key={key++} className={cls}>{parseInline(text, key)}</p>);
    } else if (/^[-*] /.test(line)) {
      if (listType !== "ul") { flushList(); listType = "ul"; }
      listItems.push(<li key={key++}>{parseInline(line.slice(2), key)}</li>);
    } else if (/^\d+\. /.test(line)) {
      if (listType !== "ol") { flushList(); listType = "ol"; }
      listItems.push(<li key={key++}>{parseInline(line.replace(/^\d+\.\s/, ""), key)}</li>);
    } else if (line.trim() === "") {
      flushList();
      if (elements.length > 0) elements.push(<div key={key++} className="h-1" />);
    } else {
      flushList();
      elements.push(<p key={key++} className="leading-relaxed">{parseInline(line, key)}</p>);
    }
  }
  flushList();

  return <div className="space-y-0.5 text-sm">{elements}</div>;
};

const SAMPLE_QUESTIONS = [
  "What should my blood pressure be?",
  "Tips for better sleep",
  "How to manage diabetes",
  "Healthy meal ideas",
  "What does my heart rate mean?",
  "How much water should I drink?",
];

const ExpandableChatWidget = () => {
  const { user } = useAuth();
  const messageIdRef = useRef(2);
  const userInitials = user?.profile
    ? `${user.profile.firstName?.[0] ?? ""}${user.profile.lastName?.[0] ?? ""}`.toUpperCase() ||
      "ME"
    : "ME";
  const [messages, setMessages] = useState([
    {
      id: 1,
      content:
        "Hello! I'm your MEDXI AI health assistant. How can I help you today?",
      sender: "ai",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (text) => {
    if (!text.trim() || isLoading) return;
    const userMsgId = messageIdRef.current++;
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, content: text, sender: "user" },
    ]);
    setInput("");
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.content,
      }));
      const response = await chatbotAPI.sendMessage({
        message: text,
        conversationHistory: history,
      });
      const reply =
        response.data?.data?.reply ||
        response.data?.data?.response ||
        response.data?.reply ||
        "I'm not sure how to respond to that.";
      const aiMsgId = messageIdRef.current++;
      setMessages((prev) => [
        ...prev,
        { id: aiMsgId, content: reply, sender: "ai" },
      ]);
    } catch (err) {
      const errMsgId = messageIdRef.current++;
      setMessages((prev) => [
        ...prev,
        {
          id: errMsgId,
          content:
            "Sorry, I'm having trouble connecting right now. Please try again.",
          sender: "ai",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend(input);
  };

  const showSamples = messages.length <= 1 && !isLoading;

  return (
    <ExpandableChat size="lg" position="bottom-right">
      <ExpandableChatHeader className="flex-col text-center justify-center bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-t-2xl">
        <h1 className="text-xl font-semibold">MEDXI AI Assistant</h1>
        <p className="text-sm opacity-80">Ask me anything about your health</p>
      </ExpandableChatHeader>

      <ExpandableChatBody>
        <ChatMessageList>
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              variant={message.sender === "user" ? "sent" : "received"}
            >
              <ChatBubbleAvatar
                className="h-8 w-8 shrink-0"
                fallback={message.sender === "user" ? userInitials : "XI"}
                variant={message.sender === "user" ? undefined : "ai"}
              />
              <ChatBubbleMessage
                variant={message.sender === "user" ? "sent" : "received"}
              >
                {message.sender === "ai" ? (
                  <MarkdownMessage content={message.content} />
                ) : (
                  message.content
                )}
              </ChatBubbleMessage>
            </ChatBubble>
          ))}

          {isLoading && (
            <ChatBubble variant="received">
              <ChatBubbleAvatar
                className="h-8 w-8 shrink-0"
                fallback="XI"
                variant="ai"
              />
              <ChatBubbleMessage isLoading />
            </ChatBubble>
          )}

          {showSamples && (
            <div className="px-1 pt-2">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Try asking
              </p>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </ChatMessageList>
      </ExpandableChatBody>

      <ExpandableChatFooter>
        <form
          onSubmit={handleSubmit}
          className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring p-1"
        >
          <ChatInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your health..."
            className="min-h-12 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0"
          />
          <div className="flex items-center p-3 pt-0 justify-end">
            <Button
              type="submit"
              size="sm"
              className="gap-1.5"
              disabled={isLoading}
              aria-busy={isLoading}
            >
              Send
              <CornerDownLeft className="size-3.5" />
            </Button>
          </div>
        </form>
      </ExpandableChatFooter>
    </ExpandableChat>
  );
};

export default ExpandableChatWidget;
