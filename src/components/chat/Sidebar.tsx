import { Plus, MessageSquare, Trash2, PanelLeft, Search, X } from "lucide-react";
import type { Conversation } from "./types";
import { useState } from "react";

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
  const filtered = conversations.filter((c) => c.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      {/* mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={onToggle}
          aria-hidden
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 md:relative md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-3 py-3">
          <button
            onClick={onToggle}
            className="rounded-lg p-2 hover:bg-sidebar-accent transition"
            aria-label="Toggle sidebar"
          >
            <PanelLeft size={18} />
          </button>
          <button
            onClick={onNew}
            className="inline-flex items-center gap-2 rounded-xl border border-sidebar-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-sidebar-accent transition"
          >
            <Plus size={16} /> New chat
          </button>
        </div>

        <div className="px-3 pb-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search chats"
              className="w-full rounded-xl border border-sidebar-border bg-background py-2 pl-9 pr-8 text-sm outline-none focus:border-foreground/40"
            />
            {q && (
              <button onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-3">
          {filtered.length === 0 && (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">No conversations</div>
          )}
          <ul className="space-y-0.5">
            {filtered.map((c) => (
              <li key={c.id}>
                <div
                  className={`group flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm transition cursor-pointer ${
                    activeId === c.id ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/60"
                  }`}
                  onClick={() => onSelect(c.id)}
                >
                  <MessageSquare size={14} className="shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{c.title || "New chat"}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(c.id);
                    }}
                    className="rounded-md p-1 opacity-0 transition group-hover:opacity-100 hover:bg-background"
                    aria-label="Delete chat"
                  >
                    <Trash2 size={13} className="text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-sidebar-border px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-foreground text-background text-xs font-semibold">
              H
            </div>
            <div className="text-sm">
              <div className="font-medium leading-tight">HALA GPT</div>
              <div className="text-xs text-muted-foreground leading-tight">Luxe AI assistant</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
