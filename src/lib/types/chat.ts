import { FileAttachment } from "@/lib/utils/file-handler";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  files?: FileAttachment[];
}