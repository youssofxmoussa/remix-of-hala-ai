export type ChatImage = { dataUrl: string; name: string };

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  images?: ChatImage[];
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
  emoji: string;
  color: string;
  createdAt: number;
};
