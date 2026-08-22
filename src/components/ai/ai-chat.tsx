"use client";
// src/components/ai/ai-chat.tsx
// Grok AI Help Assistant — floating chat widget

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Loader2, RefreshCw, MessageSquare } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  error?: boolean;
}

const SUGGESTED_PROMPTS = [
  "How do I check in for attendance?",
  "How do I apply for sick leave?",
  "Where can I view my salary?",
  "How do I update my profile?",
  "What does pending leave mean?",
];

export function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string = input) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const conversationHistory = messages
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          conversationHistory,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: data.error || "Something went wrong. Please try again.",
            error: true,
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: data.response,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Network error. Please check your connection and try again.",
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => setMessages([]);

  return (
    <>
      {/* Floating button */}
      <button
        className="ai-chat-button"
        onClick={() => setIsOpen((p) => !p)}
        aria-label="Open AI Help Assistant"
        id="ai-chat-toggle-btn"
      >
        {isOpen ? <X size={22} /> : <Bot size={22} />}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="ai-chat-window" role="dialog" aria-label="AI Help Assistant">
          {/* Header */}
          <div className="ai-header">
            <div className="ai-header-info">
              <div className="ai-avatar">
                <Bot size={16} />
              </div>
              <div>
                <p className="ai-name">PeopleOS Assistant</p>
                <p className="ai-status">
                  <span className="ai-online-dot" />
                  Powered by Grok AI
                </p>
              </div>
            </div>
            <div className="ai-header-actions">
              {messages.length > 0 && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={clearChat}
                  title="Clear conversation"
                  style={{ padding: "0.25rem" }}
                >
                  <RefreshCw size={14} />
                </button>
              )}
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setIsOpen(false)}
                style={{ padding: "0.25rem" }}
                aria-label="Close chat"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="ai-messages">
            {messages.length === 0 ? (
              <div className="ai-welcome">
                <Bot size={32} opacity={0.3} />
                <p className="ai-welcome-title">How can I help you?</p>
                <p className="ai-welcome-sub">
                  Ask me anything about PeopleOS — attendance, leave, payroll, and more.
                </p>
                <div className="ai-suggestions">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      className="ai-suggestion"
                      onClick={() => sendMessage(prompt)}
                    >
                      <MessageSquare size={12} />
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`ai-message ${msg.role} ${msg.error ? "error" : ""}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="ai-msg-avatar">
                        <Bot size={12} />
                      </div>
                    )}
                    <div className="ai-msg-bubble">
                      <p>{msg.content}</p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="ai-message assistant">
                    <div className="ai-msg-avatar">
                      <Bot size={12} />
                    </div>
                    <div className="ai-msg-bubble ai-typing">
                      <span /><span /><span />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="ai-input-area">
            <input
              ref={inputRef}
              type="text"
              className="ai-input"
              placeholder="Ask anything about PeopleOS..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              maxLength={500}
              id="ai-chat-input"
            />
            <button
              className="btn btn-primary btn-sm ai-send-btn"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .ai-header {
          padding: 1rem;
          border-bottom: 1px solid rgb(var(--border));
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgb(var(--bg-secondary));
        }

        .ai-header-info {
          display: flex;
          align-items: center;
          gap: 0.625rem;
        }

        .ai-avatar {
          width: 32px;
          height: 32px;
          border-radius: 9999px;
          background: rgb(var(--accent));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .ai-name {
          font-size: 0.825rem;
          font-weight: 700;
          color: rgb(var(--text-primary));
          line-height: 1.2;
        }

        .ai-status {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.7rem;
          color: rgb(var(--text-muted));
        }

        .ai-online-dot {
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: rgb(var(--success));
        }

        .ai-header-actions {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .ai-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .ai-welcome {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.625rem;
          padding: 1rem 0;
          text-align: center;
          color: rgb(var(--text-muted));
        }

        .ai-welcome-title {
          font-size: 0.9rem;
          font-weight: 700;
          color: rgb(var(--text-primary));
        }

        .ai-welcome-sub {
          font-size: 0.8rem;
          line-height: 1.5;
          max-width: 260px;
        }

        .ai-suggestions {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          width: 100%;
          margin-top: 0.5rem;
        }

        .ai-suggestion {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: rgb(var(--bg-secondary));
          border: 1px solid rgb(var(--border));
          border-radius: var(--radius-sm);
          font-size: 0.78rem;
          color: rgb(var(--text-secondary));
          cursor: pointer;
          text-align: left;
          transition: border-color 0.15s ease, background 0.15s ease;
        }

        .ai-suggestion:hover {
          border-color: rgb(var(--accent));
          background: rgb(var(--accent-light));
          color: rgb(var(--accent));
        }

        .ai-message {
          display: flex;
          gap: 0.5rem;
          align-items: flex-start;
          animation: fadeIn 0.2s ease forwards;
        }

        .ai-message.user {
          flex-direction: row-reverse;
        }

        .ai-msg-avatar {
          width: 24px;
          height: 24px;
          border-radius: 9999px;
          background: rgb(var(--accent));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
          margin-top: 0.1rem;
        }

        .ai-msg-bubble {
          max-width: 80%;
          padding: 0.625rem 0.875rem;
          border-radius: 0.75rem;
        }

        .ai-message.assistant .ai-msg-bubble {
          background: rgb(var(--bg-secondary));
          border: 1px solid rgb(var(--border));
          border-top-left-radius: 0.25rem;
        }

        .ai-message.user .ai-msg-bubble {
          background: rgb(var(--accent));
          color: white;
          border-top-right-radius: 0.25rem;
        }

        .ai-message.error .ai-msg-bubble {
          background: rgb(var(--danger-light));
          border-color: rgb(var(--danger) / 0.3);
          color: rgb(var(--danger));
        }

        .ai-msg-bubble p {
          font-size: 0.825rem;
          line-height: 1.5;
          white-space: pre-wrap;
        }

        .ai-typing {
          display: flex !important;
          align-items: center;
          gap: 4px;
          padding: 0.75rem 1rem;
        }

        .ai-typing span {
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: rgb(var(--text-muted));
          animation: typing-bounce 1.2s infinite;
        }

        .ai-typing span:nth-child(2) { animation-delay: 0.15s; }
        .ai-typing span:nth-child(3) { animation-delay: 0.3s; }

        @keyframes typing-bounce {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1.1); opacity: 1; }
        }

        .ai-input-area {
          padding: 0.75rem 1rem;
          border-top: 1px solid rgb(var(--border));
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .ai-input {
          flex: 1;
          padding: 0.5rem 0.75rem;
          background: rgb(var(--bg-secondary));
          border: 1px solid rgb(var(--border));
          border-radius: var(--radius-sm);
          color: rgb(var(--text-primary));
          font-size: 0.825rem;
          outline: none;
        }

        .ai-input:focus {
          border-color: rgb(var(--accent));
          box-shadow: 0 0 0 2px rgb(var(--accent) / 0.1);
        }

        .ai-send-btn {
          width: 34px;
          height: 34px;
          border-radius: var(--radius-sm);
          padding: 0;
          flex-shrink: 0;
        }
      `}</style>
    </>
  );
}
