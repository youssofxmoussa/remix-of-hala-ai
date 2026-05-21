import { useEffect, useRef } from "react";
import { AssistantMessage, UserMessage } from "./Message";
import type { ChatMessage } from "./types";

type Props = {
  messages: ChatMessage[];
  loading: boolean;
  onRegenerate: () => void;
};

export function ChatView({ messages, loading, onRegenerate }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-20 pb-8">
      <div className="space-y-8">
        {messages.map((m, i) => {
          const isLast = i === messages.length - 1;
          return m.role === "user" ? (
            <UserMessage key={m.id} m={m} />
          ) : (
            <AssistantMessage
              key={m.id}
              m={m}
              streaming={loading && isLast}
              onRegenerate={isLast ? onRegenerate : undefined}
            />
          );
        })}
        <div ref={endRef} />
      </div>
    </div>
  );
}
