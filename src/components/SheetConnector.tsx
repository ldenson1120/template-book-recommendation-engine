import { useState } from "react";
import { BookOpen, Link, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SheetConnectorProps {
  onConnect: (url: string) => Promise<void>;
  onDisconnect?: () => void;
  loading: boolean;
  connected: boolean;
}

export function SheetConnector({ onConnect, onDisconnect, loading, connected }: SheetConnectorProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setError("");
    try {
      await onConnect(url.trim());
    } catch {
      setError("Couldn't connect. Make sure the sheet is published to the web (File → Share → Publish to web).");
    }
  };

  if (connected) {
    return (
      <div className="flex items-center justify-between rounded-lg bg-sage/10 px-4 py-2.5 text-sm text-sage">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          <span className="font-medium">Sheet connected — your reading data is loaded</span>
        </div>
        {onDisconnect && (
          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={onDisconnect}>
            Disconnect
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link className="h-4 w-4" />
        <span>Paste your Google Sheet URL to get started</span>
      </div>
      <div className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://docs.google.com/spreadsheets/d/..."
          className="flex-1 bg-card border-border"
        />
        <Button type="submit" disabled={loading || !url.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Connect"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-dust">
        Your sheet must be published to the web. Go to File → Share → Publish to web → Publish as CSV.
      </p>
    </form>
  );
}
