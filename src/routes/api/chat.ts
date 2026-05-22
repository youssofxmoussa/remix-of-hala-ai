import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { halaChat, type HalaMsg } from "@/lib/halagpt.server";

type IncomingMsg = {
  role: "user" | "assistant" | "system";
  content: string;
  links?: string[];
};
type ChatBody = { messages: IncomingMsg[]; deepThink?: boolean };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = (await request.json()) as ChatBody;
          if (!Array.isArray(body.messages) || body.messages.length === 0) {
            return new Response(JSON.stringify({ error: "messages required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }
          const msgs: HalaMsg[] = body.messages.map((m) => ({
            role: m.role,
            content: m.content,
            links: m.links,
          }));
          const content = await halaChat(msgs, { deepThink: !!body.deepThink });
          return new Response(JSON.stringify({ content }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
