import { useEffect, useRef, useState } from "react";
import { ArrowUp, Plus, Square, X, FileImage } from "lucide-react";
import type { ChatImage } from "./types";

type Props = {
  onSend: (text: string, images: ChatImage[]) => void;
  loading: boolean;
  onStop?: () => void;
  luxe?: boolean;
};

const MAX_IMAGES = 5;

async function fileToCompressedDataUrl(file: File, maxDim = 1280, quality = 0.82): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unsupported");
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function Composer({ onSend, loading, onStop, luxe = false }: Props) {
  const [text, setText] = useState("");
  const [images, setImages] = useState<ChatImage[]>([]);
  const [dragOver, setDragOver] = useState(false);
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
      try {
        next.push({ dataUrl: await fileToCompressedDataUrl(f), name: f.name });
      } catch {
        // skip unreadable image
      }
    }
    setImages((prev) => [...prev, ...next].slice(0, MAX_IMAGES));
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
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`relative rounded-[28px] border transition ${
          luxe
            ? "border-white/20 bg-white/[0.04] text-white shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl focus-within:border-white/40"
            : "border-border bg-background text-foreground shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] focus-within:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.2)] focus-within:border-foreground/30"
        } ${dragOver ? (luxe ? "ring-4 ring-white/15" : "border-foreground/60 ring-4 ring-foreground/5") : ""}`}
      >
        {dragOver && (
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-[28px] bg-background/85 backdrop-blur-sm">
            <div className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background">
              <FileImage size={15} /> Drop images to attach
            </div>
          </div>
        )}

        {images.length > 0 && (
          <div className="flex flex-wrap gap-2.5 p-3 pb-1">
            {images.map((img, i) => (
              <div
                key={i}
                className="group relative h-20 w-20 overflow-hidden rounded-2xl border border-border bg-[oklch(0.97_0_0)] shadow-sm transition hover:shadow-md"
              >
                <img src={img.dataUrl} alt={img.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/55 to-transparent" />
                <span className="pointer-events-none absolute bottom-1 left-1.5 right-7 truncate text-[10px] font-medium text-white">
                  {img.name}
                </span>
                <button
                  onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                  className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition hover:bg-foreground hover:text-background"
                  aria-label="Remove image"
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <button
                onClick={() => fileRef.current?.click()}
                className="grid h-20 w-20 place-items-center rounded-2xl border border-dashed border-border bg-[oklch(0.98_0_0)] text-muted-foreground transition hover:border-foreground/40 hover:bg-[oklch(0.96_0_0)] hover:text-foreground"
                aria-label="Add image"
              >
                <Plus size={20} />
              </button>
            )}
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
          placeholder={luxe ? "Temporary HALA" : "Ask HALA anything…"}
          className={`block w-full resize-none bg-transparent px-5 pt-4 pb-2 text-[15px] leading-6 outline-none ${
            luxe ? "placeholder:text-white/40" : "placeholder:text-muted-foreground"
          }`}
        />

        <div className="flex items-center justify-between px-3 pb-3 pt-1">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={images.length >= MAX_IMAGES}
              className={`group grid h-9 w-9 place-items-center rounded-full border transition disabled:opacity-40 disabled:cursor-not-allowed ${
                luxe
                  ? "border-white/20 bg-white/10 text-white hover:bg-white hover:text-[oklch(0.15_0.02_270)]"
                  : "border-border bg-background text-foreground hover:bg-foreground hover:text-background hover:border-foreground"
              }`}
              aria-label="Attach image"
              title={`Attach image (${images.length}/${MAX_IMAGES})`}
            >
              <Plus size={17} strokeWidth={2.25} className="transition group-hover:rotate-90 duration-300" />
            </button>
            {images.length > 0 && (
              <span className={`text-[11px] font-medium ${luxe ? "text-white/60" : "text-muted-foreground"}`}>
                {images.length}/{MAX_IMAGES}
              </span>
            )}
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
          </div>
          {loading ? (
            <button
              onClick={onStop}
              className={`grid h-9 w-9 place-items-center rounded-full transition hover:opacity-90 ${
                luxe ? "bg-white text-[oklch(0.15_0.02_270)]" : "bg-foreground text-background"
              }`}
              aria-label="Stop"
            >
              <Square size={14} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={!text.trim() && images.length === 0}
              className={`grid h-9 w-9 place-items-center rounded-full transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-25 ${
                luxe ? "bg-white text-[oklch(0.15_0.02_270)]" : "bg-foreground text-background"
              }`}
              aria-label="Send"
            >
              <ArrowUp size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
      <p className={`mt-2 text-center text-[11px] ${luxe ? "text-white/45" : "text-muted-foreground"}`}>
        HALA can make mistakes. Verify important information.
      </p>
    </div>
  );
}
