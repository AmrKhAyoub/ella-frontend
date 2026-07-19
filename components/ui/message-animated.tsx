"use client";

import { motion } from "framer-motion";

interface MessageAnimatedProps {
  message: {
    role: string;
    parts: Array<{
      type: string;
      text?: string;
    }>;
  };
}

export function MessageAnimated({ message }: MessageAnimatedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`mb-4 flex ${
        message.role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          message.role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        }`}
      >
        {message.parts.map((part, index) => {
          if (part.type === "text") {
            return <p key={index}>{part.text}</p>;
          }

          return null;
        })}
      </div>
    </motion.div>
  );
}
