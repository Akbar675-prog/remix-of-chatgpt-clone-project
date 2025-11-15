"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/types/chat";
import { User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessagesProps {
  messages: ChatMessage[];
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-[48rem] mx-auto mb-8 space-y-6 px-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex gap-4 ${
            message.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          {message.role === "assistant" && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden">
              <img 
                src="https://files.catbox.moe/zdujlv.png"
                alt="Profile"
                className="h-8 w-8"
              />
            </div>
          )}
          
          <div
            className={`flex flex-col gap-2 ${
              message.role === "user" ? "items-end" : "items-start"
            } max-w-[80%]`}
          >
            <div
              className={`rounded-2xl px-4 py-3 ${
                message.role === "user"
                  ? "bg-[#F4F4F4] text-[#0D0D0D]"
                  : "bg-transparent text-[#0D0D0D]"
              }`}
            >
              <div className="prose prose-sm max-w-none text-[15px] leading-[1.5]">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code: ({ node, inline, className, children, ...props }) => {
                      if (inline) {
                        return (
                          <code
                            className="bg-[#F4F4F4] text-[#0D0D0D] px-1.5 py-0.5 rounded text-[14px] font-mono"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      }
                      return (
                        <pre className="bg-[#0D0D0D] text-[#F4F4F4] p-4 rounded-lg overflow-x-auto my-2">
                          <code className="font-mono text-[14px]" {...props}>
                            {children}
                          </code>
                        </pre>
                      );
                    },
                    p: ({ children }) => (
                      <p className="whitespace-pre-wrap break-words mb-2 last:mb-0">
                        {children}
                      </p>
                    ),
                    em: ({ children }) => (
                      <em className="italic">{children}</em>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold">{children}</strong>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>

          {message.role === "user" && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0D0D0D]">
              <User className="h-5 w-5 text-white" />
            </div>
          )}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}