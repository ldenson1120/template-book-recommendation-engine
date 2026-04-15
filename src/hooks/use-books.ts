import { useState, useCallback, useEffect } from "react";
import type { Book, ChatMessage } from "@/types/book";

const RECOMMEND_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/recommend`;
const FETCH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-books`;

const SHEET_URL_KEY = "shelf-soul-sheet-url";

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [sheetConnected, setSheetConnected] = useState(false);

  const fetchBooks = useCallback(async (sheetUrl: string) => {
    setLoading(true);
    try {
      const resp = await fetch(FETCH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ sheetUrl }),
      });
      if (!resp.ok) throw new Error("Failed to fetch books");
      const data = await resp.json();
      setBooks(data.books || []);
      setSheetConnected(true);
      localStorage.setItem(SHEET_URL_KEY, sheetUrl);
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-reconnect from saved URL
  useEffect(() => {
    const saved = localStorage.getItem(SHEET_URL_KEY);
    if (saved) fetchBooks(saved);
  }, [fetchBooks]);

  const disconnect = useCallback(() => {
    localStorage.removeItem(SHEET_URL_KEY);
    setBooks([]);
    setSheetConnected(false);
  }, []);

  return { books, loading, sheetConnected, fetchBooks, disconnect };
}

export function useChat(books: Book[]) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = useCallback(
    async (input: string) => {
      const userMsg: ChatMessage = { role: "user", content: input };
      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);

      let assistantSoFar = "";
      const allMessages = [...messages, userMsg];

      try {
        const resp = await fetch(RECOMMEND_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
            books: books.map((b) => ({
              Title: b.Title,
              Author: b.Author,
              Rating: b.Rating,
              Genre: b.Genre,
              "Biggest Trope": b["Biggest Trope"],
              "Series/Standalone": b["Series/Standalone"],
              "Year Read": b["Year Read"],
              "Reread?": b["Reread?"],
            })),
          }),
        });

        if (!resp.ok || !resp.body) {
          const errData = await resp.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to get recommendations");
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                assistantSoFar += content;
                setMessages((prev) => {
                  const last = prev[prev.length - 1];
                  if (last?.role === "assistant") {
                    return prev.map((m, i) =>
                      i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
                    );
                  }
                  return [...prev, { role: "assistant", content: assistantSoFar }];
                });
              }
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }
      } catch (e) {
        console.error(e);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Sorry, I ran into an issue: ${e instanceof Error ? e.message : "Unknown error"}. Please try again!`,
          },
        ]);
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, books]
  );

  return { messages, isStreaming, sendMessage };
}
