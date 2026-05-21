import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PanelLeft, SquarePen, ChevronDown, Share } from "lucide-react";
import logoUrl from "@/assets/halagpt-logo.png";
import { Sidebar } from "@/components/chat/Sidebar";
import { Composer } from "@/components/chat/Composer";
import { ChatView } from "@/components/chat/ChatView";
import type { ChatImage, ChatMessage, Conversation } from "@/components/chat/types";

export const Route = createFileRoute("/")({
  component: HalaGPT,
  head: () => ({
    meta: [
      { title: "HALA GPT — Luxe AI Assistant" },
      {
        name: "description",
        content:
          "HALA GPT is a refined AI assistant for conversation, vision and image OCR, code, math, and rich markdown — minimal monochrome design.",
      },
      { property: "og:title", content: "HALA GPT — Luxe AI Assistant" },
      {
        property: "og:description",
        content: "Refined AI chat with image OCR, code, math and elegant markdown.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

const STORAGE_KEY = "halagpt:conversations:v1";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Conversation[];
  } catch {
    return [];
  }
}

function HalaGPT() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const c = loadConversations();
    setConversations(c);
    if (c.length > 0) setActiveId(c[0].id);
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  const updateActive = (updater: (c: Conversation) => Conversation) => {
    setConversations((prev) => prev.map((c) => (c.id === activeId ? updater(c) : c)));
  };

  const newChat = () => {
    const c: Conversation = {
      id: uid(),
      title: "New chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations((prev) => [c, ...prev]);
    setActiveId(c.id);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const deleteChat = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const callApi = async (msgs: ChatMessage[]): Promise<string> => {
    const payload = {
      messages: msgs.map((m) => {
        if (m.role === "user" && m.images && m.images.length > 0) {
          return {
            role: "user" as const,
            content: [
              ...(m.content ? [{ type: "text" as const, text: m.content }] : []),
              ...m.images.map((img) => ({
                type: "image_url" as const,
                image_url: { url: img.dataUrl },
              })),
            ],
          };
        }
        return { role: m.role, content: m.content };
      }),
    };
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { content?: string; error?: string };
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data.content ?? "";
  };

  const send = async (text: string, images: ChatImage[]) => {
    let convo = active;
    if (!convo) {
      convo = {
        id: uid(),
        title: text.slice(0, 40) || "New chat",
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setConversations((prev) => [convo!, ...prev]);
      setActiveId(convo.id);
    }

    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: text,
      images: images.length > 0 ? images : undefined,
      createdAt: Date.now(),
    };
    const placeholder: ChatMessage = {
      id: uid(),
      role: "assistant",
      content: "",
      createdAt: Date.now(),
    };

    const baseMessages = [...convo.messages, userMsg];
    const isFirst = convo.messages.length === 0;
    const targetId = convo.id;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === targetId
          ? {
              ...c,
              messages: [...baseMessages, placeholder],
              title: isFirst ? text.slice(0, 40) || "New chat" : c.title,
              updatedAt: Date.now(),
            }
          : c,
      ),
    );

    setLoading(true);
    try {
      const reply = await callApi(baseMessages);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === placeholder.id ? { ...m, content: reply } : m,
                ),
                updatedAt: Date.now(),
              }
            : c,
        ),
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === placeholder.id ? { ...m, content: `⚠️ ${msg}` } : m,
                ),
              }
            : c,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const regenerate = async () => {
    if (!active || loading) return;
    const msgs = [...active.messages];
    // drop trailing assistant
    while (msgs.length && msgs[msgs.length - 1].role === "assistant") msgs.pop();
    if (msgs.length === 0) return;
    const last = msgs[msgs.length - 1];
    if (last.role !== "user") return;
    updateActive((c) => ({ ...c, messages: msgs }));
    await send(last.content, last.images ?? []);
  };

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background text-foreground">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={(id) => {
          setActiveId(id);
          if (window.innerWidth < 768) setSidebarOpen(false);
        }}
        onNew={newChat}
        onDelete={deleteChat}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-border/60 bg-background/80 px-3 py-2.5 backdrop-blur-xl">
          <div className="flex items-center gap-1">
            {!sidebarOpen && (
              <>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="rounded-xl p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition"
                  aria-label="Open sidebar"
                >
                  <PanelLeft size={18} />
                </button>
                <button
                  onClick={newChat}
                  className="rounded-xl p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition"
                  aria-label="New chat"
                >
                  <SquarePen size={18} />
                </button>
              </>
            )}
            <button
              className="group ml-1 inline-flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-[15px] font-semibold tracking-tight hover:bg-accent transition"
              aria-label="Model selector"
            >
              <img src={logoUrl} alt="HALA GPT" className="h-5 w-5" />
              <span>HALA GPT</span>
              <ChevronDown size={15} className="mt-0.5 text-muted-foreground transition group-hover:text-foreground" />
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-sm font-medium text-foreground hover:bg-accent transition shadow-sm"
              aria-label="Share"
            >
              <Share size={14} strokeWidth={2.25} />
              <span className="hidden sm:inline">Share</span>
            </button>
            <div className="ml-1 grid h-8 w-8 place-items-center rounded-full bg-foreground text-background text-xs font-semibold">
              H
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <ChatView
            messages={active?.messages ?? []}
            loading={loading}
            onRegenerate={regenerate}
          />
        </div>

        <Composer onSend={send} loading={loading} />
      </main>
    </div>
  );
}
