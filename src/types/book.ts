export interface Book {
  Title?: string;
  Author?: string;
  Rating?: string;
  Genre?: string;
  "Biggest Trope"?: string;
  "Series/Standalone"?: string;
  "If series, Sequel?"?: string;
  "Reread?"?: string;
  "Year Read"?: string;
  [key: string]: string | undefined;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
