"use client";

import Image from "next/image";
import { ChevronDown, HelpCircle, SquarePen, User, LogOut, MessageSquare } from "lucide-react";
import { useSession, authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface HeaderProps {
  onNewChat?: () => void;
  onOpenChatHistory?: () => void;
}

const Header = ({ onNewChat, onOpenChatHistory }: HeaderProps) => {
  const { data: session, isPending, refetch } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    const { error } = await authClient.signOut();
    if (error?.code) {
      toast.error(error.code);
    } else {
      localStorage.removeItem("bearer_token");
      refetch();
      router.push("/");
      toast.success("Logged out successfully");
    }
  };

  return (
    <header className="sticky top-0 z-10 w-full max-w-full border-b border-black/5 bg-white shadow-sm">
      {/* Mobile Header */}
      <div className="flex h-14 items-center justify-between px-2 md:hidden w-full">
        <div className="flex items-center justify-center">
          <button
            onClick={onNewChat}
            aria-label="New chat"
            className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
          >
            <SquarePen className="h-5 w-5 text-text-primary" />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <button className="group flex cursor-pointer items-center gap-1 rounded-lg min-h-[40px] px-2.5 text-lg font-normal text-text-primary transition-colors hover:bg-black/5 focus-visible:bg-black/5 focus-visible:outline-none">
            <span>Swampy AI</span>
            <ChevronDown className="h-4 w-4 text-text-tertiary" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-2">
          <button
            onClick={onOpenChatHistory}
            aria-label="Chat history"
            className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
          >
            <MessageSquare className="h-5 w-5 text-text-primary" />
          </button>
          {!isPending && !session?.user ? (
            <>
              <Link href="/login">
                <button className="h-9 rounded-[6px] bg-accent-primary px-4 py-2 text-[13px] font-semibold leading-5 text-primary-foreground transition-colors hover:bg-[#1A1A1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2">
                  Log in
                </button>
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={handleSignOut}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/5"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4 text-text-secondary" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden h-14 items-center justify-between p-2 md:flex w-full max-w-full">
        <div className="flex items-center gap-2">
          <button
            onClick={onNewChat}
            className="group flex h-9 w-9 items-center justify-center rounded-[10px] transition-colors hover:bg-background-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
            aria-label="New chat"
          >
            <SquarePen className="h-5 w-5 text-text-primary" />
          </button>
          <a
            href="/"
            className="group flex h-9 w-9 items-center justify-center rounded-[10px] transition-colors hover:bg-background-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
          >
            <Image
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/5ad7cec6-94fb-4859-9f5f-3aa6b88007d2-chatgpt-com/assets/svgs/favicon-l4nq08hd-1.svg"
              alt="ChatGPT logo"
              width={20}
              height={20}
            />
          </a>
          <button className="group flex min-h-[36px] cursor-pointer items-center gap-1 rounded-lg px-2.5 text-lg font-normal text-text-primary transition-colors hover:bg-black/5 focus-visible:bg-black/5 focus-visible:outline-none">
            <span>Swampy AI</span>
            <ChevronDown className="h-4 w-4 text-text-tertiary" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenChatHistory}
            className="h-9 rounded-[6px] border border-border-default px-4 py-2 text-[13px] font-semibold leading-5 text-text-primary transition-colors hover:bg-background-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 flex items-center gap-2"
            aria-label="Chat history"
          >
            <MessageSquare className="h-4 w-4" />
            Chat History
          </button>
          {!isPending && !session?.user ? (
            <>
              <Link href="/login">
                <button className="h-9 rounded-[6px] bg-accent-primary px-4 py-2 text-[13px] font-semibold leading-5 text-primary-foreground transition-colors hover:bg-[#1A1A1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2">
                  Log in
                </button>
              </Link>
              <Link href="/register">
                <button className="h-9 rounded-[6px] border border-border-default px-4 py-2 text-[13px] font-semibold leading-5 text-text-primary transition-colors hover:bg-background-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2">
                  Sign up for free
                </button>
              </Link>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <span className="text-sm text-text-secondary">
                  {session?.user?.name || session?.user?.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="h-9 rounded-[6px] border border-border-default px-4 py-2 text-[13px] font-semibold leading-5 text-text-primary transition-colors hover:bg-background-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            </>
          )}
          <button
            aria-label="Help"
            className="group ml-2 focus-visible:outline-none"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-background-secondary group-focus-visible:ring-2 group-focus-visible:ring-black">
              <HelpCircle
                className="h-5 w-5 text-text-secondary"
                strokeWidth={1.5}
              />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;