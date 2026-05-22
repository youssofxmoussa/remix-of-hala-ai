import { useEffect, useRef, useState } from "react";
import { Copy, Check, RotateCcw, ThumbsUp, ThumbsDown, FileText, Brain, ChevronDown } from "lucide-react";
import { Markdown } from "./Markdown";
import type { ChatMessage } from "./types";

// Detect Arabic / Hebrew / Persian — return "rtl" if the message is predominantly RTL.
function detectDir(text: string): "ltr" | "rtl" {
  if (!text) return "ltr";
  // Strip code blocks first (those should stay LTR)
  const stripped = text.replace(/```[\s\S]*?```/g, "").replace(/`[^`]+`/g, "");
  const rtlChars = stripped.match(/[\u0590-\u08FF\uFB1D-\uFEFC]/g)?.length ?? 0;
  const latinChars = stripped.match(/[A-Za-z]/g)?.length ?? 0;
  if (rtlChars === 0) return "ltr";
  return rtlChars >= latinChars ? "rtl" : "ltr";
}

// Split content into { thinking, answer } based on <thinking>...</thinking> blocks.
function splitThinking(text: string): { thinking: string | null; answer: string; thinkingOpen: boolean } {
  const openIdx = text.indexOf("<thinking>");
  if (openIdx === -1) return { thinking: null, answer: text, thinkingOpen: false };
  const closeIdx = text.indexOf("</thinking>", openIdx);
  if (closeIdx === -1) {
    // Still streaming the thinking block
    return {
      thinking: text.slice(openIdx + "<thinking>".length),
      answer: "",
      thinkingOpen: true,
    };
  }
  const thinking = text.slice(openIdx + "<thinking>".length, closeIdx).trim();
  const answer = text.slice(closeIdx + "</thinking>".length).trim();
  return { thinking, answer, thinkingOpen: false };
}

export function UserMessage({ m }: { m: ChatMessage }) {
  const dir = detectDir(m.content);
  return (
    <div className="flex w-full justify-end animate-rise">
      <div className="max-w-[85%] space-y-2">
        {m.attachments && m.attachments.length > 0 && (
          <div className="flex flex-wrap justify-end gap-2">
            {m.attachments.map((a, i) =>
              a.mime.startsWith("image/") ? (
                <img
                  key={i}
                  src={a.previewUrl ?? a.url}
                  alt={a.name}
                  className="max-h-60 rounded-2xl border border-border object-cover"
                />
              ) : (
                <a
                  key={i}
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl border border-border bg-[oklch(0.97_0_0)] px-3 py-2 text-xs text-foreground hover:bg-[oklch(0.95_0_0)] transition"
                >
                  <FileText size={14} />
                  <span className="max-w-[200px] truncate">{a.name}</span>
                </a>
              ),
            )}
          </div>
        )}
        {m.images && m.images.length > 0 && !m.attachments?.length && (
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
          <div
            dir={dir}
            className={`rounded-3xl rounded-tr-md bg-[oklch(0.96_0_0)] px-4 py-2.5 text-[15px] leading-7 text-foreground whitespace-pre-wrap break-words ${
              dir === "rtl" ? "text-right" : ""
            }`}
          >
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
      const baseCps = 110;
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

function ThinkingBlock({ text, streaming }: { text: string; streaming: boolean }) {
  const [open, setOpen] = useState(true);
  const dir = detectDir(text);
  return (
    <div className="my-3 rounded-2xl border border-border bg-[oklch(0.985_0_0)] overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-[13px] font-medium text-muted-foreground hover:bg-[oklch(0.97_0_0)] transition"
      >
        <span className="inline-flex items-center gap-2">
          <Brain size={14} className={streaming ? "animate-pulse" : ""} />
          {streaming ? "Thinking…" : "Thought process"}
        </span>
        <ChevronDown size={14} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          dir={dir}
          className={`border-t border-border px-4 py-3 text-[13px] leading-6 text-muted-foreground whitespace-pre-wrap ${
            dir === "rtl" ? "text-right" : ""
          }`}
        >
          {text}
        </div>
      )}
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
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const scrollToEnd = () => anchorRef.current?.scrollIntoView({ block: "end" });

  const initialEmptyRef = useRef(m.content === "");
  const { shown, isTyping } = useTypewriter(m.content, initialEmptyRef.current, scrollToEnd);

  const copy = async () => {
    await navigator.clipboard.writeText(m.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const { thinking, answer, thinkingOpen } = splitThinking(shown);
  const dir = detectDir(answer);
  const showThinking = streaming && !m.content;

  return (
    <div className="w-full animate-rise">
      {showThinking ? (
        <div className="py-2">
          <span className="block h-2.5 w-2.5 rounded-full bg-foreground animate-pulse-dot" />
        </div>
      ) : (
        <>
          {thinking !== null && <ThinkingBlock text={thinking} streaming={thinkingOpen} />}
          {answer && (
            <div dir={dir} className={dir === "rtl" ? "[&_p]:text-right [&_li]:text-right [&_h1]:text-right [&_h2]:text-right [&_h3]:text-right" : ""}>
              <Markdown content={answer} />
            </div>
          )}
        </>
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
