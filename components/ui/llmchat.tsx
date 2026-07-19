"use client";

import {
  ArrowUpIcon,
  RotateCwIcon,
  MessageCircleDashedIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import logo from "@/public/logo.png";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

import { useState } from "react";
import { useBackendChat } from "@/app/hooks/use-backend-chat";

export function Chat() {
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, startNewSession } = useBackendChat();
  const isBusy = status === "submitted" || status === "streaming";

  async function submitMessage(e: React.FormEvent) {
    e.preventDefault();

    if (!input.trim() || isBusy) return;

    const userText = input;
    setInput("");

    // Fixed: Passing the object shape required by the hook
    await sendMessage({ text: userText });
  }

  return (
    <MessageScrollerProvider>
      <Card
        className="
        flex
        h-[90dvh]
        w-full
        flex-col
        "
      >
        <CardHeader className="border-b shrink-0">
          <CardTitle className="flex items-center gap-2">
            <Image 
              src={logo} 
              alt="Logo" 
              width={50} 
              height={50} 
              style={{ width: 'auto', height: 'auto' }} 
              priority 
            />{" "}
            <p>Ella AI assistant</p>
          </CardTitle>
        </CardHeader>

        <CardContent
          className="
          flex-1
          overflow-y-auto 
          md:px-30
          "
        >
          {messages.length === 0 ? (
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
                  {messages.map((message) => (
                    <MessageAnimated key={message.id} message={message} />
                  ))}
                </MessageScrollerContent>
              </MessageScrollerViewport>

              <MessageScrollerButton />
            </MessageScroller>
          )}
        </CardContent>

        <CardFooter className="shrink-0">
          <form
            onSubmit={submitMessage}
            className="
            flex
            w-full
             md:w-[60%]
             md:mx-auto
             md:mb-[20px]
            gap-2
            "
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Ella..."
              className="
            flex-1
            rounded-md
            border
            px-3
            py-2
            "
            />

            <Button
              type="submit"
              disabled={isBusy}
              size="icon"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ArrowUpIcon />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={startNewSession} 
            >
              <RotateCwIcon />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </MessageScrollerProvider>
  );
}