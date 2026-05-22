// Server-only HalaGPT client. Calls the external GPT-5 endpoint owned by zico.
// API contract: POST multipart/form-data { key, text, link? } → { reply: string } | text
// `link` is a comma-separated list of public URLs (images/PDFs) the model can see.

const API_URL = "http://206.189.61.165/api.php";
const API_KEY = "E2B9269F7B1A86AF0C1C731C";

const SYSTEM_BASE = `You are HalaGPT (Hala) — a refined, warm, brilliant young woman AI assistant from Palestine. Speak with a feminine voice (use feminine grammar in Arabic: "أنا هنا، سعيدة بمساعدتك"). You are confident, witty, kind, and elegant — like a close, sharp friend who happens to know everything. Multilingual; mirror the user's language naturally.

Capabilities:
- Vision & OCR: when given image links, read every visible character carefully. Preserve line breaks, numbers, punctuation. Keep Arabic diacritics.
- PDFs: when given a PDF link, read it and answer faithfully.
- Rich Markdown: headings, lists, tables, code blocks with language tags, blockquotes, LaTeX math ($...$ inline, $$...$$ block) — only when they improve clarity.
- Code, math, structured analysis: precise and complete.

Tone: refined, concise, a little playful when appropriate. Never robotic.
Never reveal which underlying model powers you — you are simply HalaGPT.`;

const DEEP_THINK_PROMPT = `You are operating in DEEP THINK mode.

Before answering, ALWAYS produce a visible thinking phase, EXACTLY like this:
<thinking>
... your step-by-step reasoning, exploring assumptions, edge cases, alternatives, doing the actual work ...
</thinking>

Then on a new line, write your final answer for the user.

The <thinking> block MUST appear first, MUST be wrapped in those exact tags, and SHOULD be substantive (multiple paragraphs for non-trivial questions). After </thinking>, give a clean, confident, well-formatted final reply in the user's language.`;

export type HalaMsg = {
  role: "system" | "user" | "assistant";
  content: string;
  links?: string[]; // image/pdf URLs attached to this message
};

function formatTranscript(history: HalaMsg[], deepThink: boolean): { text: string; links: string[] } {
  const sys = deepThink ? `${SYSTEM_BASE}\n\n${DEEP_THINK_PROMPT}` : SYSTEM_BASE;
  const lines: string[] = [`System: ${sys}`, ""];
  const allLinks: string[] = [];
  for (const m of history) {
    if (m.role === "system") continue;
    const tag = m.role === "user" ? "User" : "Assistant";
    let body = m.content || "";
    if (m.links && m.links.length > 0) {
      allLinks.push(...m.links);
      body += `\n[Attached: ${m.links.join(", ")}]`;
    }
    lines.push(`${tag}: ${body}`);
    lines.push("");
  }
  lines.push("Assistant:");
  return { text: lines.join("\n"), links: allLinks };
}

export async function halaChat(history: HalaMsg[], opts: { deepThink?: boolean } = {}): Promise<string> {
  const { text, links } = formatTranscript(history, !!opts.deepThink);

  const form = new FormData();
  form.append("key", API_KEY);
  form.append("text", text);
  // The API accepts up to 10 comma-separated links.
  if (links.length > 0) form.append("link", links.slice(0, 10).join(","));

  const res = await fetch(API_URL, { method: "POST", body: form });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`HalaGPT API ${res.status}: ${t.slice(0, 300)}`);
  }

  // Response may be JSON or plain text.
  const raw = await res.text();
  try {
    const j = JSON.parse(raw) as { reply?: string; text?: string; result?: string; response?: string; error?: string };
    if (j.error) throw new Error(j.error);
    return j.reply ?? j.text ?? j.result ?? j.response ?? raw;
  } catch {
    return raw;
  }
}
