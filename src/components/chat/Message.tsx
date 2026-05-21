import { useEffect, useRef, useState } from "react";
import { Copy, Check, RotateCcw } from "lucide-react";
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

// Smoothly reveal content. While `streaming` is true (waiting on API), we just
// hold the empty content. Once content arrives, we ease it in char by char.
function useTypewriter(content: string, enabled: boolean) {
  const [shown, setShown] = useState(enabled ? "" : content);
  const idxRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setShown(content);
      idxRef.current = content.length;
      return;
    }
    // If content shrank (regenerate), reset.
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
      // Adaptive speed: faster when far behind, smooth when close.
      const baseCps = 90; // chars per second
      const boost = Math.min(8, 1 + remaining / 80);
      const inc = Math.max(1, Math.round((dt / 1000) * baseCps * boost));
      idxRef.current = Math.min(content.length, idxRef.current + inc);
      setShown(content.slice(0, idxRef.current));
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
  const { shown, isTyping } = useTypewriter(m.content, true);
  const copy = async () => {
    await navigator.clipboard.writeText(m.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const showThinking = streaming && !m.content;

  return (
    <div className="w-full animate-rise">
      <div className={isTyping || streaming ? "cursor-blink" : ""}>
        {showThinking ? (
          <div className="flex gap-1.5 py-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-foreground/60" style={{ animationDelay: "0ms" }} />
            <span className="h-2 w-2 animate-pulse rounded-full bg-foreground/60" style={{ animationDelay: "150ms" }} />
            <span className="h-2 w-2 animate-pulse rounded-full bg-foreground/60" style={{ animationDelay: "300ms" }} />
          </div>
        ) : (
          <Markdown content={shown} />
        )}
      </div>
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
        </div>
      )}
    </div>
  );
}
