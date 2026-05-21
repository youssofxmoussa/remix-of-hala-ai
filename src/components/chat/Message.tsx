import { useEffect, useRef, useState } from "react";
import { Copy, Check, RotateCcw, ThumbsUp, ThumbsDown } from "lucide-react";
import { Markdown } from "./Markdown";
import type { ChatMessage } from "./types";

export function UserMessage({ m }: { m: ChatMessage }) {
  return (
    <div className="flex w-full justify-end animate-rise">
      <div className="max-w-[85%] space-y-2">
        {m.images && m.images.length > 0 && (
          <div className="flex flex-wrap justify-end gap-2">
            {m.images.map((img, i) => (
              <img
                key={i}
                src={img.dataUrl}
                alt={img.name}
                className="max-h-60 rounded-2xl border border-border object-cover"
              />
            ))}
          </div>
        )}
        {m.content && (
          <div className="rounded-3xl rounded-tr-md bg-[oklch(0.96_0_0)] px-4 py-2.5 text-[15px] leading-7 text-foreground whitespace-pre-wrap break-words">
            {m.content}
          </div>
        )}
      </div>
    </div>
  );
}

function useTypewriter(content: string, enabled: boolean, onTick?: () => void) {
  const [shown, setShown] = useState(enabled ? "" : content);
  const idxRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const tickRef = useRef(onTick);
  tickRef.current = onTick;

  useEffect(() => {
    if (!enabled) {
      setShown(content);
      idxRef.current = content.length;
      return;
    }
    if (idxRef.current > content.length) {
      idxRef.current = 0;
      setShown("");
    }

    const step = (t: number) => {
      if (!lastRef.current) lastRef.current = t;
      const dt = t - lastRef.current;
      lastRef.current = t;
      const remaining = content.length - idxRef.current;
      if (remaining <= 0) {
        rafRef.current = null;
        return;
      }
      const baseCps = 90;
      const boost = Math.min(8, 1 + remaining / 80);
      const inc = Math.max(1, Math.round((dt / 1000) * baseCps * boost));
      idxRef.current = Math.min(content.length, idxRef.current + inc);
      setShown(content.slice(0, idxRef.current));
      tickRef.current?.();
      rafRef.current = requestAnimationFrame(step);
    };

    if (rafRef.current == null && idxRef.current < content.length) {
      lastRef.current = 0;
      rafRef.current = requestAnimationFrame(step);
    }
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [content, enabled]);

  return { shown, isTyping: enabled && shown.length < content.length };
}

export function AssistantMessage({
  m,
  streaming,
  onRegenerate,
}: {
  m: ChatMessage;
  streaming?: boolean;
  onRegenerate?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  const scrollToEnd = () => {
    anchorRef.current?.scrollIntoView({ block: "end" });
  };

  const { shown, isTyping } = useTypewriter(m.content, true, scrollToEnd);

  const copy = async () => {
    await navigator.clipboard.writeText(m.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const showThinking = streaming && !m.content;

  return (
    <div className="w-full animate-rise">
      {showThinking ? (
        <div className="py-2">
          <span className="block h-2.5 w-2.5 rounded-full bg-foreground animate-pulse-dot" />
        </div>
      ) : (
        <Markdown content={shown} />
      )}
      <div ref={anchorRef} />
      {!streaming && !isTyping && m.content && (
        <div className="mt-2 flex items-center gap-1 text-muted-foreground">
          <button
            onClick={copy}
            className="inline-flex items-center gap-1 rounded-lg p-1.5 text-xs hover:bg-accent hover:text-foreground transition"
            aria-label="Copy"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="inline-flex items-center gap-1 rounded-lg p-1.5 text-xs hover:bg-accent hover:text-foreground transition"
              aria-label="Regenerate"
            >
              <RotateCcw size={13} />
            </button>
          )}
          <button
            onClick={() => setFeedback((f) => (f === "up" ? null : "up"))}
            className={`inline-flex items-center gap-1 rounded-lg p-1.5 text-xs transition hover:bg-accent hover:text-foreground ${
              feedback === "up" ? "text-foreground" : ""
            }`}
            aria-label="Good response"
            aria-pressed={feedback === "up"}
          >
            <ThumbsUp size={13} fill={feedback === "up" ? "currentColor" : "none"} />
          </button>
          <button
            onClick={() => setFeedback((f) => (f === "down" ? null : "down"))}
            className={`inline-flex items-center gap-1 rounded-lg p-1.5 text-xs transition hover:bg-accent hover:text-foreground ${
              feedback === "down" ? "text-foreground" : ""
            }`}
            aria-label="Bad response"
            aria-pressed={feedback === "down"}
          >
            <ThumbsDown size={13} fill={feedback === "down" ? "currentColor" : "none"} />
          </button>
        </div>
      )}
    </div>
  );
}
