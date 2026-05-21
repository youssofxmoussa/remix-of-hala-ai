import { useState } from "react";
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
  const copy = async () => {
    await navigator.clipboard.writeText(m.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="w-full animate-rise">
      <div className={streaming ? "cursor-blink" : ""}>
        {m.content ? (
          <Markdown content={m.content} />
        ) : (
          <div className="flex gap-1.5 py-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-foreground/60" style={{ animationDelay: "0ms" }} />
            <span className="h-2 w-2 animate-pulse rounded-full bg-foreground/60" style={{ animationDelay: "150ms" }} />
            <span className="h-2 w-2 animate-pulse rounded-full bg-foreground/60" style={{ animationDelay: "300ms" }} />
          </div>
        )}
      </div>
      {!streaming && m.content && (
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
