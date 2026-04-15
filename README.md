# 📚 Shelf Life

AI-powered book recommendations based on your Google Sheets reading log.

![MIT License](https://img.shields.io/badge/license-MIT-green)

## Quick Start

1. **Fork this repo** and clone it locally
2. Copy `.env.example` to `.env` and fill in your Lovable Cloud / Supabase credentials
3. Install dependencies: `npm install`
4. Run locally: `npm run dev`
5. Deploy your edge functions to your Supabase project
6. Publish your sheet (File → Share → Publish to web → CSV)
7. Paste the URL and start chatting!

> **Built with [Lovable](https://lovable.dev)** — the fastest way to vibe-code a full-stack app. If you want to skip the setup and build this from scratch with AI, see the [Vibe Coding Guide](#step-by-step-build-guide) below.

---


## What It Does

1. **Connects to your Google Sheet** — you paste a published-to-web URL and it pulls in your entire reading history
2. **Analyzes your taste** — genres, tropes, authors, ratings
3. **Streams AI recommendations** — a chat interface where you ask for book recs and it responds in real-time, never recommending books you've already read

---

## Prerequisites

### 1. A Google Sheet with your reading data

Your sheet needs these columns (exact header names matter):

| Column | Required? | Example |
|--------|-----------|---------|
| `Title` | ✅ Yes | *The Name of the Wind* |
| `Author` | ✅ Yes | *Patrick Rothfuss* |
| `Rating` | ✅ Yes | *5* (numeric) |
| `Genre` | Recommended | *Fantasy* |
| `Biggest Trope` | Recommended | *Chosen One* |
| `Series/Standalone` | Optional | *Series* |
| `Year Read` | Optional | *2024* |
| `Reread?` | Optional | *Yes* |

**Important:** You must publish the sheet to the web:
- Go to **File → Share → Publish to web**
- Select **Entire Document** → **CSV**
- Click **Publish** and copy the URL

### 2. A Lovable Account

Go to [lovable.dev](https://lovable.dev) and create a free account. You'll need Lovable Cloud enabled (it's automatic for new projects).

---

## Step-by-Step Build Guide

### Step 1: Create the Project

Start a new Lovable project. Use this initial prompt:

```
Create a single-page app called "Shelf Life" with a clean, bookish design.
It should have:
- A header with the app name and tagline "Your personal book concierge"
- A form to paste a Google Sheets URL and connect it
- A reading stats bar showing: total books, average rating, top genre, and reread count
- A chat interface with quick prompt buttons and streaming AI responses

Use a warm, literary color palette with serif display fonts.
The chat should render markdown responses.
Store the sheet URL in localStorage so it reconnects automatically.
```

### Step 2: Create the Google Sheets Fetcher (Edge Function)

Once the project is created, prompt:

```
Create a backend function called "fetch-books" that:
1. Accepts a POST body with { sheetUrl: string }
2. Converts the Google Sheet URL to a CSV export URL
3. Fetches and parses the CSV (handle quoted fields properly)
4. Returns { books: [...] } as JSON

The function should handle three URL formats:
- Direct CSV export URLs (already have output=csv)
- Published-to-web URLs (/d/e/ format)
- Regular Google Sheets URLs (/d/ID/ format)

Set verify_jwt = false so it works without auth.
```

### Step 3: Create the AI Recommendation Engine (Edge Function)

This is the core. Prompt:

```
Create a backend function called "recommend" that powers the book recommendation chat.

It should:
1. Accept { messages: [...], books: [...] } in the POST body
2. Use Lovable AI (openai/gpt-5-mini model) for chat completions with streaming
3. Build a system prompt that includes:
   - ALL book titles as a comma-separated exclusion list (so it never recommends books already read)
   - Top 300 books by rating with full metadata (Title|Author|Rating|Genre|Trope format)
   - Aggregate stats: top 15 genres, top 15 tropes, top 20 authors with counts
4. Stream the response back as SSE (text/event-stream)
5. Handle 429 (rate limit) and 402 (credits) errors gracefully

The AI persona should be "a warm, knowledgeable book recommendation engine — like a best friend who runs an indie bookshop."

Set verify_jwt = false.
```

### Step 4: Wire Up the Frontend

```
Connect the frontend to both backend functions:
1. The sheet connector form should call the fetch-books function
2. The chat should call the recommend function with streaming
3. Parse SSE chunks and update the chat in real-time
4. Pass all book data (Title, Author, Rating, Genre, Biggest Trope, Series/Standalone, Year Read, Reread?) to the recommend function
5. Save the sheet URL to localStorage and auto-reconnect on page load
6. Add a disconnect button that clears the saved URL
```

### Step 5: Polish the UI

```
Polish the design:
- Add fade-in animations for chat messages
- User messages should be right-aligned with primary color background
- AI messages should be left-aligned with card background and border
- Add a loading spinner while the AI is thinking
- Show quick prompt buttons when chat is empty: "What should I read next?", "Something like my highest-rated books", "A cozy standalone novel", "Surprise me with something different"
- Make the chat input disabled with "Connect your sheet first..." placeholder when no sheet is connected
```

---

## Architecture Overview

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│  Google      │     │  Lovable Cloud  │     │  Lovable AI  │
│  Sheets CSV  │◄────│  Edge Functions │────►│  Gateway     │
└──────────────┘     └────────┬────────┘     └──────────────┘
                              │
                     ┌────────┴────────┐
                     │  React Frontend │
                     │  (Vite + shadcn)│
                     └─────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `src/pages/Index.tsx` | Main page layout |
| `src/components/SheetConnector.tsx` | Google Sheet URL input form |
| `src/components/ReadingStats.tsx` | Stats cards (books, rating, genre, rereads) |
| `src/components/ChatInterface.tsx` | Chat UI with streaming + markdown |
| `src/hooks/use-books.ts` | Data fetching + chat logic |
| `src/types/book.ts` | TypeScript interfaces |
| `supabase/functions/fetch-books/index.ts` | CSV fetcher edge function |
| `supabase/functions/recommend/index.ts` | AI recommendation engine |

### The Hybrid Data Strategy

With 800+ books, you can't send full metadata for everything to the AI. The solution:

1. **Full exclusion list** — ALL titles sent as a compact comma string (prevents duplicate recommendations)
2. **Detailed taste sample** — Top 300 books by rating with full metadata (Title, Author, Rating, Genre, Trope)
3. **Aggregate profile** — Genre/trope/author frequency counts from ALL books

This gives the AI deep taste understanding while staying within context limits.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, TypeScript, Tailwind CSS |
| UI Components | shadcn/ui |
| Markdown | react-markdown |
| Backend | Lovable Cloud (Supabase Edge Functions, Deno) |
| AI | Lovable AI Gateway (OpenAI GPT-5-mini) |
| Data Source | Google Sheets (published as CSV) |

---

## Customization Ideas

- **Different data source** — swap Google Sheets for Goodreads CSV export, StoryGraph, or a database table
- **More stats** — add charts for reading trends by year, genre distribution pie chart, rating histogram
- **Book covers** — use the Open Library Covers API to show cover images alongside recommendations
- **Dark mode toggle** — the CSS already has dark mode tokens defined
- **Save conversations** — persist chat history to the database
- **Multiple shelves** — support TBR lists, DNF tracking, etc.
- **Share recommendations** — generate shareable links for rec lists

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Couldn't connect" error | Make sure the sheet is **published to the web** as CSV, not just shared |
| AI recommends books you've read | Check that your `Title` column has consistent naming |
| Streaming stops mid-response | Could be a rate limit — wait a moment and retry |
| No stats showing | Ensure column headers match exactly (case-sensitive): `Rating`, `Genre`, `Reread?` |

---

## License

MIT — do whatever you want with it. Happy reading! 📖
