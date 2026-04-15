import { Book } from "@/types/book";
import { Star, BookOpen, RefreshCw } from "lucide-react";

interface ReadingStatsProps {
  books: Book[];
}

export function ReadingStats({ books }: ReadingStatsProps) {
  if (books.length === 0) return null;

  const totalBooks = books.length;
  const rated = books.filter((b) => b.Rating && !isNaN(Number(b.Rating)));
  const avgRating = rated.length > 0
    ? (rated.reduce((s, b) => s + Number(b.Rating), 0) / rated.length).toFixed(1)
    : "—";

  const genres = books.reduce<Record<string, number>>((acc, b) => {
    const g = b.Genre?.trim();
    if (g) acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});
  const topGenre = Object.entries(genres).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  const rereads = books.filter(
    (b) => b["Reread?"]?.toLowerCase() === "yes" || b["Reread?"]?.toLowerCase() === "true"
  ).length;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard icon={<BookOpen className="h-4 w-4" />} label="Books Read" value={String(totalBooks)} />
      <StatCard icon={<Star className="h-4 w-4" />} label="Avg Rating" value={avgRating} />
      <StatCard icon={<BookOpen className="h-4 w-4" />} label="Top Genre" value={topGenre} />
      <StatCard icon={<RefreshCw className="h-4 w-4" />} label="Rereads" value={String(rereads)} />
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-card border border-border p-3 text-center">
      <div className="mb-1 flex items-center justify-center text-primary">{icon}</div>
      <p className="text-lg font-display font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
