import { useEffect, useRef } from "react";
import { AssistantMessage, UserMessage } from "./Message";
import type { ChatMessage } from "./types";

type Props = {
  messages: ChatMessage[];
  loading: boolean;
  onRegenerate: () => void;
};

const SUGGESTIONS = [
  "Explain quantum entanglement simply",
  "Draft a luxe brand mission statement",
  "Translate an image of handwritten notes",
  "Write a Python script to dedupe a CSV",
];

export function ChatView({ messages, loading, onRegenerate }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-foreground text-background text-lg font-bold tracking-tight">
            H
          </div>
          <div className="text-left">
            <div className="text-2xl font-semibold tracking-tight">HALA GPT</div>
            <div className="text-sm text-muted-foreground">Luxe intelligence, beautifully simple.</div>
          </div>
        </div>
        <p className="max-w-md text-sm text-muted-foreground">
          Ask anything — paste an image to extract text, request markdown reports,
          math, code, tables. Refined and fast.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
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

export { SUGGESTIONS };
