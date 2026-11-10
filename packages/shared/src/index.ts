export type ProjectSummary = {
  id: string;
  title: string;
  updatedAt: string;
  publishedAt: string | null;
  hasUnpublishedChanges: boolean;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type ProjectDetail = ProjectSummary & {
  currentHtml: string;
  messages: ChatMessage[];
};

export type StreamEvent =
  | { type: "status"; text: string }
  | { type: "delta"; text: string }
  | { type: "done"; project: ProjectDetail }
  | { type: "error"; message: string };
