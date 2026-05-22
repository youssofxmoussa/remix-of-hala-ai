import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Plus,
  Square,
  X,
  FileImage,
  Brain,
  Globe,
  Image as ImageIcon,
  Paperclip,
  FileText,
  Check,
} from "lucide-react";
import type { ChatAttachment } from "./types";

type Props = {
  onSend: (text: string, attachments: ChatAttachment[], opts: { deepThink: boolean; search: boolean }) => void;
  loading: boolean;
  onStop?: () => void;
  luxe?: boolean;
  onUpload: (file: File) => Promise<ChatAttachment>; // upload to server, return public URL
  onImageRequest?: () => void; // hook for "Create image" action
};

const MAX_ATTACHMENTS = 5;
const ACCEPT = "image/*,application/pdf";

export function Composer({ onSend, loading, onStop, luxe = false, onUpload, onImageRequest }: Props) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deepThink, setDeepThink] = useState(false);
  const [search, setSearch] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 240) + "px";
  }, [text]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  // Auto-RTL the textarea based on first strong character.
  const dir: "ltr" | "rtl" = (() => {
    const stripped = text.replace(/```[\s\S]*?```/g, "");
    const m = stripped.match(/[A-Za-z\u0590-\u08FF\uFB1D-\uFEFC]/);
    if (!m) return "ltr";
    return /[\u0590-\u08FF\uFB1D-\uFEFC]/.test(m[0]) ? "rtl" : "ltr";
  })();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const slots = MAX_ATTACHMENTS - attachments.length;
      const list = Array.from(files).slice(0, slots);
      const uploaded: ChatAttachment[] = [];
      for (const f of list) {
        if (!f.type.startsWith("image/") && f.type !== "application/pdf") continue;
        try {
          const a = await onUpload(f);
          uploaded.push(a);
        } catch (e) {
          console.error("upload failed", e);
        }
      }
      setAttachments((prev) => [...prev, ...uploaded].slice(0, MAX_ATTACHMENTS));
    } finally {
      setUploading(false);
    }
  };

  const submit = () => {
    const t = text.trim();
    if (!t && attachments.length === 0) return;
    if (loading || uploading) return;
    onSend(t, attachments, { deepThink, search });
    setText("");
    setAttachments([]);
    setSearch(false);
    // keep deepThink sticky — feels like ChatGPT's toggle
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
              <FileImage size={15} /> Drop files to attach
            </div>
          </div>
        )}

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2.5 p-3 pb-1">
            {attachments.map((a, i) => (
              <div
                key={i}
                className={`group relative h-20 ${a.mime.startsWith("image/") ? "w-20" : "w-44"} overflow-hidden rounded-2xl border border-border bg-[oklch(0.97_0_0)] shadow-sm transition hover:shadow-md`}
              >
                {a.mime.startsWith("image/") ? (
                  <img src={a.previewUrl ?? a.url} alt={a.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center gap-2 px-3">
                    <FileText size={20} className="shrink-0 text-foreground/70" />
                    <span className="truncate text-xs font-medium text-foreground">{a.name}</span>
                  </div>
                )}
                <button
                  onClick={() => setAttachments((p) => p.filter((_, j) => j !== i))}
                  className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition hover:bg-foreground hover:text-background"
                  aria-label="Remove"
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        )}

        <textarea
          ref={taRef}
          value={text}
          dir={dir}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder={luxe ? "Temporary" : "Ask HalaGPT anything…"}
          className={`block w-full resize-none bg-transparent px-5 pt-4 pb-2 text-[15px] leading-6 outline-none ${
            luxe ? "placeholder:text-white/40" : "placeholder:text-muted-foreground"
          } ${dir === "rtl" ? "text-right" : ""}`}
        />

        <div className="flex items-center justify-between gap-2 px-3 pb-3 pt-1">
          <div className="flex items-center gap-1.5 relative" ref={menuRef}>
            {/* + menu */}
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className={`group grid h-9 w-9 place-items-center rounded-full border transition ${
                luxe
                  ? "border-white/25 bg-transparent text-white hover:bg-white hover:text-black"
                  : "border-border bg-background text-foreground hover:bg-foreground hover:text-background hover:border-foreground"
              }`}
              aria-label="More actions"
              aria-expanded={menuOpen}
            >
              <Plus size={17} strokeWidth={2.25} className={`transition duration-300 ${menuOpen ? "rotate-45" : "group-hover:rotate-90"}`} />
            </button>

            {menuOpen && (
              <div
                className={`absolute bottom-12 left-0 z-40 w-64 overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl animate-rise ${
                  luxe ? "border-white/15 bg-[oklch(0.18_0_0)]/95 text-white" : "border-border bg-background text-foreground"
                }`}
              >
                <MenuItem
                  icon={<Paperclip size={16} />}
                  label="Attach files"
                  hint="Image, PDF"
                  onClick={() => {
                    setMenuOpen(false);
                    fileRef.current?.click();
                  }}
                />
                <MenuItem
                  icon={<ImageIcon size={16} />}
                  label="Create image"
                  hint="Beta — coming soon"
                  onClick={() => {
                    setMenuOpen(false);
                    onImageRequest?.();
                  }}
                />
                <MenuItem
                  icon={<Globe size={16} />}
                  label="Search the web"
                  hint={search ? "On" : "Off"}
                  active={search}
                  onClick={() => {
                    setSearch((s) => !s);
                    setMenuOpen(false);
                  }}
                />
                <MenuItem
                  icon={<Brain size={16} />}
                  label="Deep Think"
                  hint={deepThink ? "On" : "Off"}
                  active={deepThink}
                  onClick={() => {
                    setDeepThink((d) => !d);
                    setMenuOpen(false);
                  }}
                />
              </div>
            )}

            {/* Sticky pill indicators */}
            {(deepThink || search) && (
              <div className="ml-1 flex items-center gap-1.5">
                {deepThink && <ModePill icon={<Brain size={12} />} label="Deep Think" onClear={() => setDeepThink(false)} luxe={luxe} />}
                {search && <ModePill icon={<Globe size={12} />} label="Search" onClear={() => setSearch(false)} luxe={luxe} />}
              </div>
            )}

            {uploading && (
              <span className={`text-[11px] font-medium ${luxe ? "text-white/60" : "text-muted-foreground"}`}>uploading…</span>
            )}

            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT}
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
                luxe ? "bg-white text-[#000]" : "bg-foreground text-background"
              }`}
              aria-label="Stop"
            >
              <Square size={14} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={(!text.trim() && attachments.length === 0) || uploading}
              className={`grid h-9 w-9 place-items-center rounded-full transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-25 ${
                luxe ? "bg-white text-[#000]" : "bg-foreground text-background"
              }`}
              aria-label="Send"
            >
              <ArrowUp size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
      <p className={`mt-2 text-center text-[11px] ${luxe ? "text-white/45" : "text-muted-foreground"}`}>
        HalaGPT can make mistakes. Verify important information.
      </p>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  hint,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition hover:bg-accent/40"
    >
      <span className="inline-flex items-center gap-3">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-foreground/5">{icon}</span>
        <span className="font-medium">{label}</span>
      </span>
      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
        {active && <Check size={12} />}
        {hint}
      </span>
    </button>
  );
}

function ModePill({
  icon,
  label,
  onClear,
  luxe,
}: {
  icon: React.ReactNode;
  label: string;
  onClear: () => void;
  luxe: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
        luxe ? "border-white/30 bg-white/10 text-white" : "border-foreground/15 bg-foreground/5 text-foreground"
      }`}
    >
      {icon} {label}
      <button onClick={onClear} className="-mr-1 ml-1 rounded-full p-0.5 hover:bg-foreground/10" aria-label={`Disable ${label}`}>
        <X size={10} />
      </button>
    </span>
  );
}
