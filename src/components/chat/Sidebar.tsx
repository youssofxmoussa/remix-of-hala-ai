import { Search, X, Folder, Image as ImageIcon, MoreHorizontal, SquarePen, MessageSquare, Trash2 } from "lucide-react";
import type { Conversation } from "./types";
import { useState } from "react";
import logoUrl from "@/assets/halagpt-logo.png";

type Props = {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  open: boolean;
  onToggle: () => void;
};

export function Sidebar({ conversations, activeId, onSelect, onNew, onDelete, open, onToggle }: Props) {
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const filtered = conversations.filter((c) => c.title.toLowerCase().includes(q.toLowerCase()));
  const [menuFor, setMenuFor] = useState<string | null>(null);

  return (
    <div
      className={`fixed inset-0 z-50 bg-background transition-all duration-300 ${
        open ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      <div className="flex h-full w-full flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-6 pb-2">
          <div className="flex items-center gap-2.5">
            <img src={logoUrl} alt="" className="h-7 w-7" />
            <h1 className="text-2xl font-semibold tracking-tight">HALA GPT</h1>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-[oklch(0.96_0_0)] px-1 py-1">
            <button
              onClick={() => setSearching((s) => !s)}
              className="grid h-9 w-9 place-items-center rounded-full text-foreground transition hover:bg-background"
              aria-label="Search"
            >
              <Search size={18} strokeWidth={2} />
            </button>
            <button
              onClick={onToggle}
              className="grid h-9 w-9 place-items-center rounded-full bg-background text-foreground transition hover:opacity-80"
              aria-label="Close sidebar"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        {searching && (
          <div className="px-5 pt-2">
            <div className="relative">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search chats"
                className="w-full rounded-full border border-border bg-[oklch(0.98_0_0)] py-2.5 pl-11 pr-10 text-[15px] outline-none focus:border-foreground/40"
              />
              {q && (
                <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="mt-4 px-3">
          <QuickItem icon={<Folder size={20} strokeWidth={1.75} />} label="Projects" />
          <QuickItem icon={<ImageIcon size={20} strokeWidth={1.75} />} label="Images" />
          <QuickItem icon={<MoreHorizontal size={20} strokeWidth={1.75} />} label="More" />
        </div>

        {/* Recents */}
        <div className="mt-6 flex-1 overflow-y-auto px-3 pb-32">
          <div className="px-3 pb-2 text-[17px] font-semibold tracking-tight">Recents</div>
          {filtered.length === 0 && (
            <div className="px-3 py-6 text-sm text-muted-foreground">No conversations yet</div>
          )}
          <ul>
            {filtered.map((c) => (
              <li key={c.id} className="group relative">
                <button
                  onClick={() => {
                    onSelect(c.id);
                    onToggle();
                  }}
                  className={`flex w-full items-center rounded-2xl px-3 py-3 text-left text-[15px] transition ${
                    activeId === c.id ? "bg-[oklch(0.96_0_0)]" : "hover:bg-[oklch(0.97_0_0)]"
                  }`}
                >
                  <span className="truncate flex-1">{c.title || "New chat"}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuFor((id) => (id === c.id ? null : c.id));
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted-foreground opacity-0 transition hover:bg-background hover:text-foreground group-hover:opacity-100"
                  aria-label="More"
                >
                  <MoreHorizontal size={16} />
                </button>
                {menuFor === c.id && (
                  <div className="absolute right-3 top-12 z-10 w-44 rounded-2xl border border-border bg-background p-1.5 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.22)]">
                    <button
                      onClick={() => {
                        onDelete(c.id);
                        setMenuFor(null);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[15px] text-foreground transition hover:bg-[oklch(0.96_0_0)]"
                    >
                      <Trash2 size={16} className="text-foreground" />
                      Delete
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Floating "Chat" pill */}
        <button
          onClick={() => {
            onNew();
            onToggle();
          }}
          className="absolute bottom-6 right-5 inline-flex items-center gap-2.5 rounded-full bg-foreground px-5 py-3.5 text-background shadow-[0_12px_40px_-10px_rgba(0,0,0,0.45)] transition hover:opacity-90 active:scale-[0.98]"
        >
          <SquarePen size={18} strokeWidth={2} />
          <span className="text-[15px] font-medium">Chat</span>
        </button>
      </div>
    </div>
  );
}

function QuickItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left text-[17px] transition hover:bg-[oklch(0.97_0_0)]">
      <span className="grid h-7 w-7 place-items-center text-foreground">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
