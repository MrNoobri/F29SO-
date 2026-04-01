import React, { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { chatbotAPI } from "../../api";
import { useTheme } from "../../context/ThemeContext";

const ChatbotWidget = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm your AI health assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: (message) => chatbotAPI.sendMessage({ message }),
    onSuccess: (response) => {
      const assistantMessage = {
        role: "assistant",
        content: response.data.data.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    },
    onError: (error) => {
      console.error("Chatbot error:", error);
      console.error("Error response:", error.response?.data);

      let errorContent =
        "I'm having trouble connecting right now. Please try again later.";

      // Check if authentication error
      if (error.response?.status === 401) {
        errorContent = "Please log in to use the AI health assistant.";
      } else if (error.response?.data?.message) {
        errorContent = error.response.data.message;
      }

      const errorMessage = {
        role: "assistant",
        content: errorContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    sendMessageMutation.mutate(input);
    setInput("");
  };

  const quickQuestions = [
    "What should my blood pressure be?",
    "Tips for better sleep",
    "How to manage diabetes",
    "Healthy meal ideas",
  ];

  if (!isOpen) return null;

  const headerClassByTheme = {
    medical: "from-primary to-secondary",
    midnight: "from-primary to-secondary",
    emerald: "from-primary to-secondary",
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-card rounded-2xl shadow-2xl flex flex-col z-50 border border-border overflow-hidden">
      {/* Header */}
      <div
        className={`bg-gradient-to-r ${headerClassByTheme[theme] || "from-primary to-secondary"} text-primary-foreground p-4 rounded-t-2xl flex justify-between items-center`}
      >
        <div className="flex items-center">
          <div className="w-10 h-10 bg-background/90 rounded-full flex items-center justify-center mr-3 border border-border/70">
            <span className="text-2xl">🤖</span>
          </div>
          <div>
            <h3 className="font-semibold">AI Health Assistant</h3>
            <p className="text-xs text-primary-foreground/80">
              Always here to help
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-primary-foreground hover:text-primary-foreground/70 text-2xl"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground shadow-md border border-border"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p
                className={`text-xs mt-1 ${
                  message.role === "user"
                    ? "text-primary-foreground/75"
                    : "text-muted-foreground"
                }`}
              >
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
        {sendMessageMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-card text-foreground shadow-md border border-border rounded-2xl px-4 py-2">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-muted-foreground mb-2">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => {
                  setInput(question);
                }}
                className="text-xs bg-secondary/35 text-foreground px-3 py-1 rounded-full border border-border hover:bg-secondary/50 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border bg-card rounded-b-2xl">
        <form onSubmit={handleSend} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about health..."
            className="flex-1 px-4 py-2 border border-input rounded-full bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent text-sm"
            disabled={sendMessageMutation.isPending}
          />
          <button
            type="submit"
            disabled={!input.trim() || sendMessageMutation.isPending}
            className="bg-primary text-primary-foreground p-2 rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
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
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatbotWidget;
