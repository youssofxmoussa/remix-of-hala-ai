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

const SYSTEM_PROMPT = `You are HALA GPT, a refined, helpful, multilingual AI assistant. Answer with elegant, well-structured Markdown — use headings, lists, tables, code blocks with language tags, blockquotes, and LaTeX math ($...$ inline, $$...$$ block) whenever they improve clarity. Be precise, warm, and concise. Never reveal that you are powered by any third-party model; you are simply HALA GPT.`;

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
      max_completion_tokens: 2048,
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
