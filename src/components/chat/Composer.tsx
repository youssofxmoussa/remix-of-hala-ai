import { useEffect, useRef, useState } from "react";
import { ArrowUp, Paperclip, Square, X, ImageIcon } from "lucide-react";
import type { ChatImage } from "./types";

type Props = {
  onSend: (text: string, images: ChatImage[]) => void;
  loading: boolean;
  onStop?: () => void;
};

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function Composer({ onSend, loading, onStop }: Props) {
  const [text, setText] = useState("");
  const [images, setImages] = useState<ChatImage[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 240) + "px";
  }, [text]);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const next: ChatImage[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      next.push({ dataUrl: await fileToDataUrl(f), name: f.name });
    }
    setImages((prev) => [...prev, ...next].slice(0, 4));
  };

  const submit = () => {
    const t = text.trim();
    if (!t && images.length === 0) return;
    if (loading) return;
    onSend(t, images);
    setText("");
    setImages([]);
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-4 pt-2">
      <div className="rounded-3xl border border-border bg-background shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] transition focus-within:border-foreground/30 focus-within:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.18)]">
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 border-b border-border p-3">
            {images.map((img, i) => (
              <div key={i} className="group relative h-16 w-16 overflow-hidden rounded-xl border border-border">
                <img src={img.dataUrl} alt={img.name} className="h-full w-full object-cover" />
                <button
                  onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                  className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-foreground/90 text-background opacity-0 transition group-hover:opacity-100"
                  aria-label="Remove image"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder="Ask HALA GPT anything…"
          className="block w-full resize-none bg-transparent px-5 pt-4 pb-2 text-[15px] leading-6 outline-none placeholder:text-muted-foreground"
        />
        <div className="flex items-center justify-between px-3 pb-3 pt-1">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-foreground hover:bg-accent transition"
              aria-label="Attach image"
            >
              <Paperclip size={15} />
              <span className="hidden sm:inline">Attach</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <span className="hidden items-center gap-1 px-2 text-xs text-muted-foreground sm:inline-flex">
              <ImageIcon size={12} /> Image OCR & vision supported
            </span>
          </div>
          {loading ? (
            <button
              onClick={onStop}
              className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-background hover:opacity-90 transition"
              aria-label="Stop"
            >
              <Square size={14} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={!text.trim() && images.length === 0}
              className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Send"
            >
              <ArrowUp size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        HALA GPT can make mistakes. Verify important information.
      </p>
    </div>
  );
}
