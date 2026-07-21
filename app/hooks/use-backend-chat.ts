import { useState, useEffect, useCallback } from "react";

export interface MessagePart {
  type: "text";
  text: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  parts: MessagePart[];
  createdAt?: Date;
}

export function useBackendChat() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<
    "ready" | "submitted" | "streaming" | "error"
  >("ready");

  // Dynamically fetches the accessToken from localStorage for every request
  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        // Note: If your Django configuration uses standard TokenAuth instead of JWT,
        // you might need to change "Bearer" to "Token" below.
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return headers;
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch(
        "https://ella-v1.onrender.com/api/chats/sessions/",
        {
          headers: getHeaders(),
        },
      );
      if (!res.ok) throw new Error("Failed to fetch sessions");
      const data = await res.json();
      setSessions(data);
      return data;
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setStatus("error");
    }
  }, [getHeaders]);

  const fetchSessionMessages = useCallback(
    async (sessionId: string) => {
      try {
        setStatus("submitted");
        const res = await fetch(
          `https://ella-v1.onrender.com/api/chats/sessions/${sessionId}/messages/`,
          {
            headers: getHeaders(),
          },
        );
        if (!res.ok) throw new Error("Failed to fetch messages");
        const data = await res.json();

        const mappedMessages: Message[] = data.map((msg: any) => ({
          id: msg.id.toString(),
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.content_text,
          parts: [{ type: "text", text: msg.content_text }],
          createdAt: new Date(msg.timestamp),
        }));

        setMessages(mappedMessages);
        setStatus("ready");
      } catch (err) {
        console.error("Error fetching messages:", err);
        setStatus("error");
      }
    },
    [getHeaders],
  );

  // --- CHANGED: Only fetch the list of sessions on mount ---
  // We no longer auto-load the latest session's messages here.
  // The Chat component handles that based on the URL query parameter.
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const sendMessage = async (options: { text: string }) => {
    const text = options.text;
    if (!text.trim()) return;

    setStatus("submitted");

    const tempUserMsg: Message = {
      id: `temp-user-${Date.now()}`,
      role: "user",
      content: text,
      parts: [{ type: "text", text: text }],
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      let sessionId = currentSessionId;

      // Create a new session if one doesn't exist
      if (!sessionId) {
        const topic = text.length > 30 ? `${text.substring(0, 30)}...` : text;
        const createRes = await fetch(
          "https://ella-v1.onrender.com/api/chats/sessions/",
          {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ topic }),
          },
        );

        if (!createRes.ok) throw new Error("Failed to create session");
        const newSession = await createRes.json();
        sessionId = newSession.id;
        setCurrentSessionId(sessionId);

        // Refresh the sidebar list to include the newly created session
        fetchSessions();
      }

      const sendRes = await fetch(
        `https://ella-v1.onrender.com/api/chats/sessions/${sessionId}/send/`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ content_text: text }),
        },
      );

      if (!sendRes.ok) throw new Error("Failed to send message");
      const data = await sendRes.json();

      const userMsg: Message = {
        id: data.user_message.id.toString(),
        role: "user",
        content: data.user_message.content_text,
        parts: [{ type: "text", text: data.user_message.content_text }],
        createdAt: new Date(data.user_message.timestamp),
      };

      const aiMsg: Message = {
        id: data.ai_message.id.toString(),
        role: "assistant",
        content: data.ai_message.content_text,
        parts: [{ type: "text", text: data.ai_message.content_text }],
        createdAt: new Date(data.ai_message.timestamp),
      };

      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
        return [...filtered, userMsg, aiMsg];
      });

      setStatus("ready");
    } catch (err) {
      console.error("Failed to send message", err);
      setStatus("error");
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    }
  };

  const startNewSession = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setStatus("ready");
  };

  return {
    messages,
    setMessages,
    sendMessage,
    status,
    sessions,
    currentSessionId,
    setCurrentSessionId,
    fetchSessionMessages,
    startNewSession,
  };
}
