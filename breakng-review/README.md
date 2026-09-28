# BreakNG Tables — Production Review

Timestamped video review for the podcast production team. Next.js 16 + Postgres (Drizzle) + Tailwind, built for Vercel.

## Features
- Individual users (pick your name, no password)
- Videos grouped by type: Episode / BTS / Trailer, each with its own YouTube review page
- Timestamped notes (single point or in→out range), tags, status, assignee, @mentions, 👍 reactions, threaded replies
- Click a note's timestamp to jump the video to that moment
- Documents: build a note document, include/exclude by teammate, video, tag or status; copy, download .md, or print to PDF
- Activity feed + "For you" (mentions, assignments, replies) with unread badge
- Cross-video search

## Deploy to Vercel
1. Push this folder to a GitHub repo.
2. On vercel.com: **Add New → Project**, import the repo.
3. In the project's **Storage** tab, create a **Postgres (Neon)** database and connect it. This sets `DATABASE_URL`.
4. Create the tables once (from your machine):
   ```bash
   npm install
   export DATABASE_URL="<your connection string from Vercel>"
   npm run db:migrate
   ```
5. Redeploy (or push a commit). Open the site, type your name under "New here?", and add your first video.

## Run locally
```bash
cp .env.example .env.local   # set DATABASE_URL
npm install
npm run db:migrate
npm run dev
```

## Notes
- **Login has no passwords.** Anyone with the URL can pick any name. Fine for a small trusted team; if the link could leak, add Vercel password protection or real auth.
- After changing `db/schema.js`, run `npm run db:generate` then `npm run db:migrate`.
- @mentions match `@Name` against exact teammate names (case-insensitive).
