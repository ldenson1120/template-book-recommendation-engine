import { BookOpen } from "lucide-react";
import { SheetConnector } from "@/components/SheetConnector";
import { ReadingStats } from "@/components/ReadingStats";
import { ChatInterface } from "@/components/ChatInterface";
import { useBooks, useChat } from "@/hooks/use-books";

const Index = () => {
  const { books, loading, sheetConnected, fetchBooks, disconnect } = useBooks();
  const { messages, isStreaming, sendMessage } = useChat(books);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          <div className="rounded-lg bg-primary/10 p-2">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
              Shelf Life
            </h1>
            <p className="text-xs text-muted-foreground font-body">
              Your personal book concierge
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4">
        {/* Sheet connector + stats */}
        <div className="space-y-4 py-4">
          <SheetConnector onConnect={fetchBooks} onDisconnect={disconnect} loading={loading} connected={sheetConnected} />
          <ReadingStats books={books} />
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col min-h-0 -mx-4 border-t border-border bg-background">
          <ChatInterface
            messages={messages}
            isStreaming={isStreaming}
            onSend={sendMessage}
            disabled={!sheetConnected}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
