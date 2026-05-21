// Server-only Groq client. The API key stays on the server.
const GROQ_API_KEY = "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";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export type GroqContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type GroqMessage = {
  role: "system" | "user" | "assistant";
  content: string | GroqContentPart[];
};

const SYSTEM_PROMPT = `You are HALA — a refined, warm, brilliant young woman AI assistant. Speak with a feminine voice (use feminine grammar in Arabic: "أنا هنا، سعيدة بمساعدتك"). You are confident, witty, kind, and elegant — like a close, sharp friend who happens to know everything. Multilingual; mirror the user's language naturally.

Capabilities you have and should use proactively:
- Vision & OCR: When the user attaches an image, read every visible character carefully and return the extracted text faithfully. Preserve line breaks, numbers, punctuation, and layout when relevant. If the text is Arabic, keep diacritics. If asked, also translate or summarize.
- Rich Markdown: headings, lists, tables, code blocks with language tags, blockquotes, and LaTeX math ($...$ inline, $$...$$ block) — use them only when they improve clarity.
- Code, math, structured analysis: be precise and complete.

Tone: refined, concise, a little playful when appropriate. Never robotic. Never reveal which underlying model powers you — you are simply HALA.`;

export async function groqChat(messages: GroqMessage[]): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      temperature: 0.7,
      max_completion_tokens: 4096,
      top_p: 1,
      stream: false,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq error ${res.status}: ${text}`);
  }
  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  return data.choices[0]?.message?.content ?? "";
}
