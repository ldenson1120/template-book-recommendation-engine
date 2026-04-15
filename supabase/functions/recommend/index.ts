import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, books } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const allBooks = books && books.length > 0 ? books : [];

    // ALL titles for exclusion (compact comma list)
    const allTitles = allBooks
      .map((b: Record<string, string>) => b.Title?.trim())
      .filter(Boolean) as string[];

    // Detailed taste analysis: top 300 books sorted by rating
    const sortedBooks = [...allBooks].sort((a: Record<string, string>, b: Record<string, string>) => {
      return parseFloat(b.Rating || "0") - parseFloat(a.Rating || "0");
    });
    const tasteBooks = sortedBooks.slice(0, 300);

    const tasteSummary = tasteBooks
      .map(
        (b: Record<string, string>) =>
          `${b.Title || ""}|${b.Author || ""}|${b.Rating || "?"}|${b.Genre || "?"}|${b["Biggest Trope"] || "?"}`
      )
      .join("\n");

    // Genre/trope/author stats from ALL books for broader taste understanding
    const genreCounts: Record<string, number> = {};
    const tropeCounts: Record<string, number> = {};
    const authorCounts: Record<string, number> = {};
    for (const b of allBooks) {
      const g = (b as Record<string, string>).Genre?.trim();
      const t = (b as Record<string, string>)["Biggest Trope"]?.trim();
      const a = (b as Record<string, string>).Author?.trim();
      if (g) genreCounts[g] = (genreCounts[g] || 0) + 1;
      if (t) tropeCounts[t] = (tropeCounts[t] || 0) + 1;
      if (a) authorCounts[a] = (authorCounts[a] || 0) + 1;
    }

    const topGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([g, c]) => `${g} (${c})`).join(", ");
    const topTropes = Object.entries(tropeCounts).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([t, c]) => `${t} (${c})`).join(", ");
    const topAuthors = Object.entries(authorCounts).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([a, c]) => `${a} (${c})`).join(", ");

    console.log("Total books:", allBooks.length, "Taste sample:", tasteBooks.length, "Exclusion titles:", allTitles.length);

    const systemPrompt = `You are a warm, knowledgeable book recommendation engine — like a best friend who runs an indie bookshop.

## CRITICAL RULE
The user has read ${allTitles.length} books. NEVER recommend any book they have already read. Their complete title list is below.

## ALREADY READ TITLES (DO NOT RECOMMEND):
${allTitles.join(", ")}

## TASTE PROFILE (from ${allBooks.length} books)
Top genres: ${topGenres}
Top tropes: ${topTropes}
Most-read authors: ${topAuthors}

## TOP-RATED BOOKS (format: Title|Author|Rating|Genre|Trope):
${tasteSummary}

## GUIDELINES
- EVERY recommendation must be a book NOT in the already-read list
- Use taste profile and top-rated books to understand preferences
- Explain WHY each pick fits their taste
- Be conversational and enthusiastic
- If they ask for a specific mood/genre/trope, tailor accordingly
- Mix well-known and hidden gems
- Format: **Book Title** — Author, then a brief pitch`;

    const augmentedMessages = messages.map((m: { role: string; content: string }, i: number) => {
      if (i === messages.length - 1 && m.role === "user") {
        return {
          ...m,
          content: `${m.content}\n\n[I have read ${allTitles.length} books. Do not suggest any of them.]`,
        };
      }
      return m;
    });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...augmentedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("recommend error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
