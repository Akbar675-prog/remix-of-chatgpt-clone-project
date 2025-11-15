"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";

interface Conversation {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (conversationId: number) => void;
  onNewChat: () => void;
  currentConversationId?: number;
  refreshTrigger?: number;
}

export function ChatHistorySidebar({
  isOpen,
  onClose,
  onSelectConversation,
  onNewChat,
  currentConversationId,
  refreshTrigger,
}: ChatHistorySidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (isOpen && session?.user) {
      loadConversations();
    } else if (isOpen && !isPending) {
      setIsLoading(false);
    }
  }, [isOpen, session, isPending]);

  // Auto-refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0 && session?.user) {
      loadConversations();
    }
  }, [refreshTrigger, session]);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/conversations", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        
        // Remove duplicates by id (keep the most recent one based on updatedAt)
        const uniqueConversations = data.reduce((acc: Conversation[], current: Conversation) => {
          const existing = acc.find(item => item.id === current.id);
          if (!existing) {
            acc.push(current);
          } else if (new Date(current.updatedAt) > new Date(existing.updatedAt)) {
            // Replace with more recent version
            const index = acc.indexOf(existing);
            acc[index] = current;
          }
          return acc;
        }, []);
        
        setConversations(uniqueConversations);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (currentConversationId === id) {
          onNewChat();
        }
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-80 transform bg-white shadow-xl transition-transform duration-300 lg:sticky lg:top-0 lg:z-0 lg:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-lg font-semibold">Chat History</h2>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onNewChat}
                title="New chat"
              >
                <Plus className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="lg:hidden"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-2">
            {isPending || isLoading ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                Loading...
              </div>
            ) : !session?.user ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MessageSquare className="mb-2 h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  You need to log in for new chat.
                </p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MessageSquare className="mb-2 h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No conversations yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Start chatting to create history
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={cn(
                      "group relative flex cursor-pointer items-center justify-between rounded-lg p-3 transition-colors hover:bg-secondary",
                      currentConversationId === conversation.id && "bg-secondary"
                    )}
                    onClick={() => onSelectConversation(conversation.id)}
                  >
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm font-medium">
                        {conversation.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(conversation.updatedAt)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => deleteConversation(conversation.id, e)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}