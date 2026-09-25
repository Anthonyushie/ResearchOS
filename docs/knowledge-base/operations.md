# Setup, checks, and troubleshooting

## Local setup

1. Install dependencies: `npm ci`.
2. Copy `.env.example` to `.env.local` and fill in the values below. Keep `.env.local` out of Git.
3. Configure the Google OAuth web client with `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI.
4. Start with `npm run dev`, then sign in at `http://localhost:3000`.
5. Load demo data from the empty workspace or upload a TXT, Markdown, CSV, or PDF file to exercise ingestion.

| Variable | Required for | Meaning |
| --- | --- | --- |
| `DATABASE_URL` | Persistent library | Neon Postgres connection string. `NEON_DATABASE_URL` is also read by code. |
| `AUTH_SECRET` | Auth.js sessions | Secret for authentication. |
| `AUTH_GOOGLE_ID` | Google sign-in | OAuth client ID. |
| `AUTH_GOOGLE_SECRET` | Google sign-in | OAuth client secret. |
| `GEMINI_API_KEY` | AI extraction/comparison | Optional. Without it, ingestion saves sparse metadata and comparison uses a local fallback. |
| `AUTH_URL` | Some deployed auth setups | Optional canonical URL; `.env.example` gives an example. |

The table is created and adjusted by `ensureSchema()` during database calls. The health endpoint checks database connectivity but does not create the schema.

## Routine checks

- `npm run lint` checks code style and framework rules.
- `npm run build` verifies that the production app compiles.
- Visit `/api/health` to see whether the database is configured and connected, and whether a Gemini key is present. This endpoint does not prove that Gemini can answer a request.
- Verify an upload by finding it in Research after a refresh. The returned `source` is `db` when persisted; `mock` means the upload response was temporary.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Google login shows a configuration error | Confirm OAuth ID, secret, `AUTH_SECRET`, and exact authorized redirect URI. |
| Empty library or `503` from research API | Confirm `DATABASE_URL`/`NEON_DATABASE_URL` and DB reachability. No bundled records fill the gap. |
| Upload says “Text unreadable — AI skipped” | Text extraction yielded under 200 characters and no usable inline PDF was supplied. Try a text-based PDF or TXT/Markdown source. |
| Upload says “AI unavailable” | Check `GEMINI_API_KEY` and server logs for model errors. Saved text and metadata can still be reviewed. |
| Search misses an older record | The overview API searches DB candidates, but the Research page and relatedness use only the 100 records loaded by `AppProvider`. Also check whether the query matches stored text or metadata. |
| Insights stays empty | Cross-record insight generation is not implemented; `insightRecords` is empty. |

## Current operational limits

- Uploads store extracted content, not original file bytes. Keep source files elsewhere if they must be retained or cited.
- CSV ingestion uses either a 20,000-character text excerpt (the usual `text/csv` browser MIME type) or a short row-count preview. It does not load the full table for analysis. Image files have no text extractor.
- Schema changes are performed on request rather than through versioned migrations. Plan a migration path before making destructive schema changes.
- `POST /api/research` currently accepts caller-supplied IDs and can update a row belonging to another owner on ID collision. See [the data model](architecture.md#database) before exposing that write path to untrusted clients.
- `/api/health` has no session check and the proxy excludes API routes. Its database error field may be visible to anonymous callers, so review that response before a public deployment.
