"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowUpIcon,
  RotateCwIcon,
  MessageCircleDashedIcon,
  CopyIcon,
  CheckIcon,
  Volume2Icon,
  VolumeXIcon,
  MicIcon,
  MicOffIcon,
  SparklesIcon,
  CoffeeIcon,
  BriefcaseIcon,
  PlaneIcon,
  LightbulbIcon,
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

// Module-level cache to prevent re-typing messages we've already animated
const animatedMessageIds = new Set<string>();

// Quick-start scenarios for empty state
const SCENARIO_CARDS = [
  {
    icon: CoffeeIcon,
    title: "Order Coffee",
    description: "Roleplay ordering coffee with a New York barista",
    prompt:
      "Let's roleplay. Act as a friendly barista in New York City. Start by greeting me and asking what I'd like to order today!",
  },
  {
    icon: BriefcaseIcon,
    title: "Job Interview Prep",
    description: "Practice answering tough interview questions",
    prompt:
      "I want to practice for a job interview in English. Ask me one standard interview question, evaluate my answer, and suggest improvements.",
  },
  {
    icon: SparklesIcon,
    title: "Fix My Writing",
    description: "Get instant corrections and vocabulary suggestions",
    prompt:
      "I want to improve my writing. I will share my text with you, and I want you to correct any grammar mistakes and suggest more natural phrasing.",
  },
  {
    icon: PlaneIcon,
    title: "Airport & Travel",
    description: "Learn essential phrases for immigration and flights",
    prompt:
      "Let's roleplay an airport scenario. Act as an immigration officer at London Heathrow, and ask me about my travel plans!",
  },
];

// Contextual action pills for AI responses
const ACTION_PILLS = [
  {
    label: "💡 Explain Grammar",
    prompt: "Could you explain the key grammar rules used in your last response?",
  },
  {
    label: "🎯 Give Examples",
    prompt:
      "Can you give me 2-3 extra example sentences using the main vocabulary or phrasing from your last message?",
  },
  {
    label: "✨ Simplify Language",
    prompt:
      "Could you simplify your response so it's easier for an English learner to understand?",
  },
];

// --- THINKING INDICATOR COMPONENT ---
function ThinkingIndicator() {
  return (
    <div className="w-full flex mb-4 justify-start">
      <div className="flex items-center gap-1.5 p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-muted-foreground w-fit">
        <span className="sr-only">Ella is thinking...</span>
        <div
          className="h-1.5 w-1.5 bg-current rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <div
          className="h-1.5 w-1.5 bg-current rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <div
          className="h-1.5 w-1.5 bg-current rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}

// --- MESSAGE WRAPPER (WITH TYPING, TTS & CONTEXTUAL PILLS) ---
function MessageWrapper({
  message,
  isLatest,
  onSendFollowUp,
}: {
  message: any;
  isLatest: boolean;
  onSendFollowUp: (prompt: string) => void;
}) {
  const [isCopied, setIsCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [time, setTime] = useState("");

  const isUser = message.role === "user";
  const fullText = message.parts?.[0]?.text || message.content || "";

  // Consider it "recent" if created within 2 minutes
  const isRecent = message.createdAt
    ? Date.now() - new Date(message.createdAt).getTime() < 120000
    : true;

  const shouldAnimate =
    isLatest && !isUser && isRecent && !animatedMessageIds.has(message.id);

  const [displayedText, setDisplayedText] = useState(
    shouldAnimate ? "" : fullText
  );
  const indexRef = useRef(shouldAnimate ? 0 : fullText.length);

  // Streaming typing effect
  useEffect(() => {
    if (!shouldAnimate) {
      setDisplayedText(fullText);
      animatedMessageIds.add(message.id);
      return;
    }

    const interval = setInterval(() => {
      if (indexRef.current >= fullText.length) {
        clearInterval(interval);
        setDisplayedText(fullText);
        animatedMessageIds.add(message.id);
        window.dispatchEvent(new Event("chat-scroll-to-bottom"));
        return;
      }

      indexRef.current += 5;
      setDisplayedText(fullText.slice(0, indexRef.current));
      window.dispatchEvent(new Event("chat-scroll-to-bottom"));
    }, 15);

    return () => clearInterval(interval);
  }, [fullText, shouldAnimate, message.id]);

  useEffect(() => {
    const date = message.createdAt ? new Date(message.createdAt) : new Date();
    setTime(
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  }, [message.createdAt]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // --- FEATURE 3: Text-To-Speech (Listen) ---
  const handleSpeak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = "en-US";
    utterance.rate = 0.95; // Slightly relaxed pace for language learners
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const animatedMessage = {
    ...message,
    content: displayedText,
    parts: message.parts ? [{ ...message.parts[0], text: displayedText }] : undefined,
  };

  return (
    <div className="w-full flex flex-col mb-4">
      <MessageAnimated message={animatedMessage} />

      {/* Message Metadata & Action Buttons */}
      <div
        className={`flex items-center gap-2 text-[11px] text-muted-foreground mt-1 px-1 ${
          isUser ? "justify-end" : "justify-start"
        }`}
      >
        <span>{time}</span>

        {/* Listen Button (TTS) */}
        {!isUser && (
          <button
            type="button"
            onClick={handleSpeak}
            className={`p-1 hover:text-foreground transition-colors rounded cursor-pointer ${
              isSpeaking ? "text-blue-600 animate-pulse" : ""
            }`}
            title={isSpeaking ? "Stop listening" : "Listen to pronunciation"}
          >
            {isSpeaking ? (
              <VolumeXIcon className="h-3.5 w-3.5" />
            ) : (
              <Volume2Icon className="h-3.5 w-3.5" />
            )}
          </button>
        )}

        {/* Copy Button */}
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

      {/* FEATURE 4: Contextual Learning Action Pills (AI Messages Only) */}
      {!isUser && isLatest && displayedText === fullText && (
        <div className="flex flex-wrap gap-2 mt-2">
          {ACTION_PILLS.map((pill, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSendFollowUp(pill.prompt)}
              className="text-xs px-2.5 py-1 rounded-full border bg-background hover:bg-muted text-foreground/80 hover:text-foreground transition-all cursor-pointer shadow-xs"
            >
              {pill.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ChatContent() {
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [dictationSending, setDictationSending] = useState(false);
  const [isListening, setIsListening] = useState(false); // FEATURE 2: Mic State

  const searchParams = useSearchParams();
  const router = useRouter();
  const hasAutoFired = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null); // FEATURE 2: Textarea Ref
  const recognitionRef = useRef<any>(null);

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

  const isThinking = status === "submitted" || dictationSending;

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- FEATURE 2: Auto-Resizing Textarea Height ---
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180
      )}px`;
    }
  }, [input]);

  // --- FEATURE 2: Native Web Speech Recognition (Mic Toggle) ---
  const toggleListening = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser. Please try Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");
        setInput(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

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

  const isDictationSession =
    searchParams.get("type") === "dictation" ||
    (currentSessionId
      ? localStorage.getItem(`session_type_${currentSessionId}`) === "dictation"
      : false);

  const prevSessionIdRef = useRef(currentSessionId);
  useEffect(() => {
    if (!prevSessionIdRef.current && currentSessionId) {
      window.dispatchEvent(new Event("refresh-sessions"));

      const typeParam = isDictationSession ? "&type=dictation" : "";
      window.history.replaceState(
        null,
        "",
        `/main/chat?session=${currentSessionId}${typeParam}`
      );
    }
    prevSessionIdRef.current = currentSessionId;
  }, [currentSessionId, isDictationSession]);

  // --- AUTO-SCROLL ---
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
  }, [messages.length, status, isThinking]);

  useEffect(() => {
    const handleCustomScroll = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({
          behavior: "auto",
          block: "end",
        });
      }
    };
    window.addEventListener("chat-scroll-to-bottom", handleCustomScroll);
    return () =>
      window.removeEventListener("chat-scroll-to-bottom", handleCustomScroll);
  }, []);

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

  // Handler for sending messages (via form submission or scenario cards/pills)
  const executeSend = async (userText: string) => {
    if (!userText.trim() || isBusy) return;

    setInput("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

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
            body: JSON.stringify({ content_text: userText }),
          }
        );

        if (!res.ok) {
          throw new Error("Failed to send dictation message");
        }

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
  };

  async function submitMessage(e: React.FormEvent) {
    e.preventDefault();
    await executeSend(input);
  }

  // Handle Enter key for textarea (Shift+Enter creates a new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitMessage(e as any);
    }
  };

  const handleNewChat = () => {
    router.push("/main/chat");
  };

  if (!mounted) {
    return null;
  }

  const uniqueMessages = messages.filter(
    (message: any, index: number, self: any[]) =>
      index === self.findIndex((m: any) => m.id === message.id)
  );

  return (
    <MessageScrollerProvider>
      <Card className="flex h-[90dvh] w-full flex-col border-none shadow-none bg-transparent">
        <CardContent className="flex-1 overflow-y-auto w-full md:max-w-[70%] md:mx-auto md:px-30">
          {uniqueMessages.length === 0 && !isThinking ? (
            /* FEATURE 1: Interactive Quick-Start Scenario Cards */
            <Empty className="h-full py-4 sm:py-6">
  <EmptyHeader className="px-4 sm:px-0">
    {/* Hide the large icon on mobile to save vertical space */}
    <EmptyMedia variant="icon" className="hidden sm:flex">
      <MessageCircleDashedIcon />
    </EmptyMedia>
    
    <EmptyTitle className="text-lg sm:text-xl font-bold mt-2 sm:mt-0">
      Practice English with Ella
    </EmptyTitle>
    
    <EmptyDescription className="text-sm sm:text-base mb-2 sm:mb-0">
      Choose a scenario below or ask anything about grammar, vocabulary, or pronunciation.
    </EmptyDescription>

    {/* 
      Mobile: Horizontal scroll (flex, overflow-x-auto, snap) 
      Desktop: 2x2 Grid (sm:grid, sm:grid-cols-2) 
      Arbitrary classes at the end hide the scrollbar cleanly on all browsers.
    */}
    <div className="flex sm:grid sm:grid-cols-2 gap-3 w-full mt-4 sm:mt-6 max-w-2xl text-left overflow-x-auto sm:overflow-visible snap-x snap-mandatory pb-4 sm:pb-0 px-4 -mx-4 sm:px-0 sm:mx-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {SCENARIO_CARDS.map((card, idx) => {
        const Icon = card.icon;
        return (
          <button
            key={idx}
            type="button"
            onClick={() => executeSend(card.prompt)}
            /* min-w-[260px] ensures they peek off-screen on mobile, hinting to swipe */
            className="flex flex-col gap-1.5 p-3.5 rounded-xl border bg-card hover:bg-muted/60 transition-all text-left group cursor-pointer shadow-sm hover:border-blue-500/50 min-w-[260px] sm:min-w-0 shrink-0 snap-start"
          >
            <div className="flex items-center gap-2 font-medium text-sm text-foreground group-hover:text-blue-600 transition-colors">
              <Icon className="h-4 w-4 text-blue-500" />
              <span>{card.title}</span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {card.description}
            </p>
          </button>
        );
      })}
    </div>
  </EmptyHeader>
</Empty>
          ) : (
            <MessageScroller>
              <MessageScrollerViewport>
                <MessageScrollerContent className="p-4" aria-busy={isBusy}>
                  {uniqueMessages.map((message: any, index: number) => (
                    <MessageWrapper
                      key={message.id}
                      message={message}
                      isLatest={index === uniqueMessages.length - 1}
                      onSendFollowUp={executeSend}
                    />
                  ))}

                  {isThinking && <ThinkingIndicator />}

                  <div ref={messagesEndRef} className="h-1 w-full" />
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          )}
        </CardContent>

        <CardFooter className="shrink-0">
          {/* FEATURE 2: Voice-First Auto-Resizing Textarea Form */}
          <form
            onSubmit={submitMessage}
            className="flex w-full md:w-[60%] md:mx-auto md:mb-[20px] gap-2 items-end bg-background border rounded-2xl p-2 shadow-xs"
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening
                  ? "Listening to you speak..."
                  : isDictationSession
                  ? "Reply to dictation..."
                  : "Ask Ella..."
              }
              className="flex-1 resize-none bg-transparent px-3 py-1.5 text-sm focus:outline-none max-h-[180px] min-h-[36px]"
            />

            {/* Microphone Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleListening}
              title={isListening ? "Stop recording" : "Speak your message"}
              className={`rounded-full shrink-0 ${
                isListening
                  ? "bg-red-100 text-red-600 hover:bg-red-200 animate-pulse"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isListening ? (
                <MicOffIcon className="h-4 w-4" />
              ) : (
                <MicIcon className="h-4 w-4" />
              )}
            </Button>

            {/* Send Button */}
            <Button
              type="submit"
              disabled={isBusy || !input.trim()}
              size="icon"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full shrink-0"
            >
              <ArrowUpIcon className="h-4 w-4" />
            </Button>

            {/* New Session Button */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleNewChat}
              title="Start a new session"
              className="rounded-full shrink-0"
            >
              <RotateCwIcon className="h-4 w-4" />
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