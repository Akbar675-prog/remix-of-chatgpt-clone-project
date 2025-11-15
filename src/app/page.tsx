"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Header from "@/components/sections/header";
import HeroSection from "@/components/sections/hero-section";
import ComposerSection from "@/components/sections/composer-section";
import FooterDisclaimer from "@/components/sections/footer-disclaimer";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatHistorySidebar } from "@/components/chat/chat-history-sidebar";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import type { ChatMessage } from "@/lib/types/chat";
import type { FileAttachment } from "@/lib/utils/file-handler";
import { Menu } from "lucide-react";

// Generate random alphanumeric ID
function generateChatId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [enableSearch, setEnableSearch] = useState(false);
  const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const savedMessageIdsRef = useRef<Set<string>>(new Set());
  const isSavingRef = useRef(false);
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const refreshSidebar = useCallback(() => {
    setSidebarRefreshTrigger(prev => prev + 1);
  }, []);

  const saveConversation = async () => {
    if (isSavingRef.current) return;
    
    try {
      isSavingRef.current = true;
      
      if (messages.length === 0) return;

      if (!currentConversationId) {
        const firstUserMessage = messages.find((m) => m.role === "user");
        const title = firstUserMessage?.content.substring(0, 50) || "New Chat";

        const response = await fetch("/api/conversations", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("bearer_token")}`
          },
          body: JSON.stringify({ title }),
        });

        if (response.ok) {
          const conversation = await response.json();
          setCurrentConversationId(conversation.id);

          for (const msg of messages) {
            if (!savedMessageIdsRef.current.has(msg.id)) {
              await fetch(`/api/conversations/${conversation.id}/messages`, {
                method: "POST",
                headers: { 
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${localStorage.getItem("bearer_token")}`
                },
                body: JSON.stringify({
                  role: msg.role,
                  content: msg.content,
                  timestamp: msg.timestamp,
                }),
              });
              savedMessageIdsRef.current.add(msg.id);
            }
          }
          
          refreshSidebar();
        }
      } else {
        for (const msg of messages) {
          if (!savedMessageIdsRef.current.has(msg.id) && msg.content.trim()) {
            await fetch(`/api/conversations/${currentConversationId}/messages`, {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("bearer_token")}`
              },
              body: JSON.stringify({
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp,
              }),
            });
            savedMessageIdsRef.current.add(msg.id);
          }
        }
        
        refreshSidebar();
      }
    } catch (error) {
      console.error("Failed to save conversation:", error);
    } finally {
      isSavingRef.current = false;
    }
  };

  const loadConversation = async (conversationId: number) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("bearer_token")}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const loadedMessages: ChatMessage[] = data.messages.map((msg: any) => ({
          id: msg.id.toString(),
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
        }));
        setMessages(loadedMessages);
        setCurrentConversationId(conversationId);
        setIsSidebarOpen(false);
        
        savedMessageIdsRef.current.clear();
        loadedMessages.forEach(msg => savedMessageIdsRef.current.add(msg.id));
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setIsSidebarOpen(false);
    savedMessageIdsRef.current.clear();
  };

  const streamMessage = useCallback(
    async (userMessage: string, files?: FileAttachment[]) => {
      // Check authentication before sending message
      if (!session?.user) {
        router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      setIsLoading(true);

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: userMessage,
        timestamp: Date.now(),
        files: files,
      };
      
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);

      // If this is first message, redirect to new chat route
      if (messages.length === 0) {
        const chatId = generateChatId();
        router.push(`/chat/${chatId}`);
        return;
      }

      let messageContent = userMessage;
      if (files && files.length > 0) {
        const fileContext = files.map(f => {
          if (f.content.startsWith('data:')) {
            return `[File: ${f.name} (${f.type}, ${f.size} bytes) - binary content]`;
          }
          return `[File: ${f.name}]\n${f.content.substring(0, 10000)}\n[End of ${f.name}]`;
        }).join('\n\n');
        messageContent = `${userMessage}\n\n${fileContext}`;
      }

      const apiMessages = updatedMessages.map((msg) => ({
        role: msg.role,
        content: msg.role === 'user' && msg === userMsg ? messageContent : msg.content,
      }));

      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("bearer_token")}`
          },
          body: JSON.stringify({ 
            messages: apiMessages,
            enableSearch: enableSearch,
            files: files || []
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || `HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let assistantMessage = "";

        const assistantId = (Date.now() + 1).toString();
        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: "assistant",
            content: "",
            timestamp: Date.now(),
          },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter(Boolean);

          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              assistantMessage += data.token;

              setMessages((prev) => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg?.role === "assistant") {
                  lastMsg.content = assistantMessage;
                }
                return newMessages;
              });
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
        
        await saveConversation();
        
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Stream error:", error);
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "assistant",
              content: `Error: ${error.message}. Please make sure your Google API key is configured.`,
              timestamp: Date.now(),
            },
          ]);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [messages, enableSearch, session, router]
  );

  return (
    <div className="flex min-h-screen w-full bg-white">
      <ChatHistorySidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSelectConversation={loadConversation}
        onNewChat={startNewChat}
        currentConversationId={currentConversationId ?? undefined}
        refreshTrigger={sidebarRefreshTrigger}
      />

      <div className="flex flex-1 flex-col w-full max-w-full">
        <Header 
          onNewChat={startNewChat}
          onOpenChatHistory={() => setIsSidebarOpen(true)}
        />
        
        <div className="lg:hidden px-4 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-4 w-4 mr-2" />
            Chat History
          </Button>
        </div>
        
        <main className="flex flex-1 flex-col items-center w-full px-4 pb-4 pt-2 md:px-8 md:pb-6 overflow-hidden">
          <div className="flex w-full max-w-[48rem] flex-1 flex-col items-center mx-auto min-h-0">
            {messages.length === 0 ? (
              <>
                <div className="flex-1 flex items-end justify-center w-full pb-4 md:pb-6">
                  <HeroSection />
                </div>
                <div className="w-full shrink-0">
                  <ComposerSection 
                    onSendMessage={streamMessage} 
                    isLoading={isLoading}
                    enableSearch={enableSearch}
                    onToggleSearch={setEnableSearch}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="w-full flex-1 overflow-y-auto pt-4 md:pt-8 min-h-0">
                  <ChatMessages messages={messages} />
                </div>
                <div className="w-full pt-4 shrink-0">
                  <ComposerSection 
                    onSendMessage={streamMessage} 
                    isLoading={isLoading}
                    enableSearch={enableSearch}
                    onToggleSearch={setEnableSearch}
                  />
                </div>
              </>
            )}
          </div>
        </main>
        
        <FooterDisclaimer />
      </div>
    </div>
  );
}