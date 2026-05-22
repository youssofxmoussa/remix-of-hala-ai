export type ChatImage = { dataUrl: string; name: string };

export type ChatAttachment = {
  url: string;        // public URL the AI can fetch
  name: string;
  mime: string;       // e.g. image/png, application/pdf
  previewUrl?: string; // optional local preview (data URL) for instant render
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  images?: ChatImage[];       // legacy / preview-only (deprecated)
  attachments?: ChatAttachment[];
  createdAt: number;
};

export type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  archived?: boolean;
  projectId?: string | null;
};

export type Project = {
  id: string;
  name: string;
  emoji?: string;
  icon?: string;
  color: string;
  createdAt: number;
};
