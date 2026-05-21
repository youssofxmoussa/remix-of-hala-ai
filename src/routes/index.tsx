import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PanelLeft, MessageSquareDashed } from "lucide-react";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [temporary, setTemporary] = useState(false);

  useEffect(() => {
    const c = loadConversations();
    setConversations(c);
    if (c.length > 0) setActiveId(c[0].id);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  const isEmpty = !active || active.messages.length === 0;

  const newChat = () => {
    setActiveId(null);
    setTemporary(false);
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
      if (!temporary) setConversations((prev) => [convo!, ...prev]);
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

    if (temporary) {
      // local-only ephemeral conversation
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === targetId);
        const next: Conversation = {
          ...convo!,
          messages: [...baseMessages, placeholder],
          title: isFirst ? text.slice(0, 40) || "Temporary" : convo!.title,
          updatedAt: Date.now(),
        };
        return exists ? prev.map((c) => (c.id === targetId ? next : c)) : [next, ...prev];
      });
    } else {
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
    }

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
    const targetId = active.id;
    const msgs = [...active.messages];
    while (msgs.length && msgs[msgs.length - 1].role === "assistant") msgs.pop();
    if (msgs.length === 0 || msgs[msgs.length - 1].role !== "user") return;

    const placeholder: ChatMessage = {
      id: uid(),
      role: "assistant",
      content: "",
      createdAt: Date.now(),
    };
    setConversations((prev) =>
      prev.map((c) =>
        c.id === targetId
          ? { ...c, messages: [...msgs, placeholder], updatedAt: Date.now() }
          : c,
      ),
    );

    setLoading(true);
    try {
      const reply = await callApi(msgs);
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

  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-background text-foreground">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={(id) => {
          setActiveId(id);
          setTemporary(false);
        }}
        onNew={newChat}
        onDelete={deleteChat}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
      />

      <main className="relative flex min-w-0 flex-1 flex-col">
        {/* Floating controls */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full border border-border bg-background/85 text-foreground shadow-[0_6px_20px_-8px_rgba(0,0,0,0.2)] backdrop-blur-xl transition hover:bg-[oklch(0.97_0_0)] active:scale-95"
            aria-label="Open sidebar"
          >
            <PanelLeft size={18} />
          </button>
          <button
            onClick={() => {
              setTemporary((t) => !t);
              setActiveId(null);
            }}
            className={`pointer-events-auto grid h-11 w-11 place-items-center rounded-full border shadow-[0_6px_20px_-8px_rgba(0,0,0,0.2)] backdrop-blur-xl transition active:scale-95 ${
              temporary
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-background/85 text-foreground hover:bg-[oklch(0.97_0_0)]"
            }`}
            aria-label="Temporary chat"
            aria-pressed={temporary}
            title="Temporary chat"
          >
            <MessageSquareDashed size={18} />
          </button>
        </div>

        {/* Empty-state hero (logo only) */}
        <div
          className={`pointer-events-none absolute inset-x-0 z-0 flex flex-col items-center transition-all duration-500 ease-out ${
            isEmpty ? "top-[28vh] opacity-100" : "top-[12vh] opacity-0"
          }`}
        >
          <div className="grid h-14 w-14 place-items-center rounded-2xl border border-border bg-background shadow-sm">
            <img src={logoUrl} alt="HALA GPT" className="h-10 w-10" />
          </div>
          <div className="mt-3 text-[22px] font-semibold tracking-tight">
            {temporary ? "Temporary chat" : "HALA GPT"}
          </div>
        </div>

        {/* Chat scroll area */}
        <div className={`flex-1 overflow-y-auto transition-opacity duration-300 ${isEmpty ? "opacity-0" : "opacity-100"}`}>
          <ChatView
            messages={active?.messages ?? []}
            loading={loading}
            onRegenerate={regenerate}
          />
        </div>

        {/* Composer — centered when empty, slides to bottom when chat starts */}
        <div
          className={`relative z-10 transition-all duration-500 ease-out ${
            isEmpty ? "-translate-y-[28vh]" : "translate-y-0"
          }`}
        >
          <Composer onSend={send} loading={loading} />
        </div>
      </main>
    </div>
  );
}
