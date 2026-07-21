"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowUpIcon,
  RotateCwIcon,
  MessageCircleDashedIcon,
  CopyIcon,
  CheckIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerViewport,
  MessageScrollerButton,
  MessageScrollerProvider,
} from "@/components/ui/message-scroller";
import { MessageAnimated } from "@/components/ui/message-animated";

import { useBackendChat } from "@/app/hooks/use-backend-chat";

const API_BASE_URL = "https://ella-v1.onrender.com";

// --- INVISIBLE WRAPPER ---
function MessageWrapper({ message }: { message: any }) {
  const [isCopied, setIsCopied] = useState(false);
  const [time, setTime] = useState(""); // <-- Hydration Fix: Start empty

  const isUser = message.role === "user";

  // <-- Hydration Fix: Generate time ONLY on the client after mount
  useEffect(() => {
    const date = message.createdAt ? new Date(message.createdAt) : new Date();
    setTime(
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    );
  }, [message.createdAt]);

  const handleCopy = () => {
    const textToCopy = message.parts?.[0]?.text || message.content || "";
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="w-full flex flex-col mb-4">
      <MessageAnimated message={message} />
      <div
        className={`flex items-center gap-2 text-[11px] text-muted-foreground mt-1 px-1 ${
          isUser ? "justify-end" : "justify-start"
        }`}
      >
        <span>{time}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="p-1 hover:text-foreground transition-colors rounded cursor-pointer"
          title="Copy message"
        >
          {isCopied ? (
            <CheckIcon className="h-3 w-3 text-green-500" />
          ) : (
            <CopyIcon className="h-3 w-3" />
          )}
        </button>
      </div>
    </div>
  );
}

function ChatContent() {
  const [mounted, setMounted] = useState(false); // <-- Hydration Fix
  const [input, setInput] = useState("");
  const [dictationSending, setDictationSending] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasAutoFired = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    sendMessage,
    status,
    startNewSession,
    fetchSessionMessages,
    setCurrentSessionId,
    currentSessionId,
  } = useBackendChat();

  const isBusy =
    status === "submitted" || status === "streaming" || dictationSending;

  // <-- Hydration Fix: Tell component it's safe to render client-specific logic
  useEffect(() => {
    setMounted(true);
  }, []);

  // --- URL to SESSION SYNC ---
  useEffect(() => {
    const sessionIdFromUrl = searchParams.get("session");
    const sessionTypeFromUrl = searchParams.get("type");

    if (sessionIdFromUrl) {
      if (sessionIdFromUrl !== currentSessionId) {
        setCurrentSessionId(sessionIdFromUrl);
        fetchSessionMessages(sessionIdFromUrl);
      }
      if (sessionTypeFromUrl === "dictation") {
        localStorage.setItem(`session_type_${sessionIdFromUrl}`, "dictation");
      }
    } else {
      if (currentSessionId !== null || messages.length > 0) {
        startNewSession();
      }
    }
  }, [
    searchParams,
    currentSessionId,
    fetchSessionMessages,
    setCurrentSessionId,
    startNewSession,
    messages.length,
  ]);

  // --- Determine if current session is a dictation session ---
  const isDictationSession =
    searchParams.get("type") === "dictation" ||
    (currentSessionId
      ? localStorage.getItem(`session_type_${currentSessionId}`) === "dictation"
      : false);

  // --- Track when a new session is created, notify sidebar, and sync URL lag-free ---
  const prevSessionIdRef = useRef(currentSessionId);
  useEffect(() => {
    if (!prevSessionIdRef.current && currentSessionId) {
      // 1. Notify sidebar to refresh its sessions list instantly
      window.dispatchEvent(new Event("refresh-sessions"));

      // 2. Use window.history.replaceState to avoid Next.js router lag/freeze
      const typeParam = isDictationSession ? "&type=dictation" : "";
      window.history.replaceState(
        null,
        "",
        `/main/chat?session=${currentSessionId}${typeParam}`,
      );
    }
    prevSessionIdRef.current = currentSessionId;
  }, [currentSessionId, isDictationSession]);

  // Auto-scroll logic
  useEffect(() => {
    const timer = setTimeout(() => {
      if (messagesEndRef.current) {
        const scrollBehavior = status === "streaming" ? "auto" : "smooth";
        messagesEndRef.current.scrollIntoView({
          behavior: scrollBehavior,
          block: "end",
        });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, status]);

  // Handle vocabCheck task
  useEffect(() => {
    if (hasAutoFired.current) return;

    const task = searchParams.get("task");
    const text = searchParams.get("text");

    if (task === "vocabCheck" && text) {
      hasAutoFired.current = true;
      const enrichedPrompt = `As a language tutor, help me get the correct meaning of the vocabularies in this text. I will explain the vocabularies given, and you tell me if I am right or wrong. Here is the text:\n\n"${text}"`;

      sendMessage({ text: enrichedPrompt });

      const currentSession = searchParams.get("session");
      const redirectUrl = currentSession
        ? `/main/chat?session=${currentSession}`
        : `/main/chat`;
      router.replace(redirectUrl, { scroll: false });
    }
  }, [searchParams, router, sendMessage]);

  async function submitMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isBusy) return;

    const userText = input;
    setInput("");

    if (isDictationSession && currentSessionId) {
      setDictationSending(true);
      const token = localStorage.getItem("accessToken");
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/chats/sessions/${currentSessionId}/dictation/send/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: token ? `Bearer ${token}` : "",
            },
            body: JSON.stringify({ content_text: userText }), // Updated payload key
          },
        );

        if (!res.ok) {
          throw new Error("Failed to send dictation message");
        }

        // Fetch updated messages for this dictation session
        await fetchSessionMessages(currentSessionId);
      } catch (error) {
        console.error("Dictation chat error:", error);
        alert("Failed to send message. Please try again.");
      } finally {
        setDictationSending(false);
      }
    } else {
      await sendMessage({ text: userText });
    }
  }

  const handleNewChat = () => {
    router.push("/main/chat");
  };

  // Prevent full render until mounted to avoid SSR mismatch on the UI
  if (!mounted) {
    return null; // Or a subtle skeleton loader if you prefer
  }

  // --- DEDUPLICATE MESSAGES to prevent duplicate key crashes ---
  const uniqueMessages = messages.filter(
    (message: any, index: number, self: any[]) =>
      index === self.findIndex((m: any) => m.id === message.id),
  );

  return (
    <MessageScrollerProvider>
      <Card className="flex h-[90dvh] w-full flex-col border-none shadow-none bg-transparent">
        <CardContent className="flex-1 overflow-y-auto w-full md:max-w-[70%] md:mx-auto md:px-30">
          {uniqueMessages.length === 0 ? (
            <Empty className="h-full">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MessageCircleDashedIcon />
                </EmptyMedia>
                <EmptyTitle>Start chatting</EmptyTitle>
                <EmptyDescription>
                  Hi! I'm Ella, your AI English assistant. Ask me anything about
                  English — grammar, vocabulary, pronunciation, or conversation
                  practice.
                </EmptyDescription>
                <br />
                <p className="text-xs text-muted-foreground">
                  Ella AI can make mistakes. Always review important information
                  and use your own judgment.
                </p>
              </EmptyHeader>
            </Empty>
          ) : (
            <MessageScroller>
              <MessageScrollerViewport>
                <MessageScrollerContent className="p-4" aria-busy={isBusy}>
                  {uniqueMessages.map((message: any) => (
                    <MessageWrapper key={message.id} message={message} />
                  ))}
                  <div ref={messagesEndRef} className="h-1 w-full" />
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          )}
        </CardContent>

        <CardFooter className="shrink-0">
          <form
            onSubmit={submitMessage}
            className="flex w-full md:w-[60%] md:mx-auto md:mb-[20px] gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isDictationSession ? "Reply to dictation..." : "Ask Ella..."
              }
              className="flex-1 rounded-md border px-3 py-2 bg-background"
            />
            <Button
              type="submit"
              disabled={isBusy || !input.trim()}
              size="icon"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ArrowUpIcon />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleNewChat}
              title="Start a new session"
            >
              <RotateCwIcon />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </MessageScrollerProvider>
  );
}

export function Chat() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[90dvh] w-full items-center justify-center text-sm text-muted-foreground animate-pulse">
          Loading chat environment...
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
