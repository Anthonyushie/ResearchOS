# ResearchOS

ResearchOS is a private research library for papers, experiments, and datasets. Sign in with Google, upload a document, review extracted metadata and summaries, search the library, and compare two records. Research records are stored in Neon Postgres. Gemini analysis is optional; the app labels records when analysis could not run.

## Start locally

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local` and set `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET`. Set `GEMINI_API_KEY` to enable AI extraction and comparisons.
3. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI in the Google OAuth client.
4. Run `npm run dev` and open `http://localhost:3000`.

The app creates or updates its `research_records` table on the first database operation. A database connection and Google sign-in are needed for a working library. Without a Gemini key, uploads can still be saved, but their AI metadata will be sparse.

## Knowledge base

- [Project overview and current capabilities](docs/knowledge-base/README.md)
- [Architecture and data model](docs/knowledge-base/architecture.md)
- [User and processing workflows](docs/knowledge-base/workflows.md)
- [HTTP API reference](docs/knowledge-base/api.md)
- [Setup, checks, and troubleshooting](docs/knowledge-base/operations.md)

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Build the production app |
| `npm run start` | Serve a production build |
| `npm run lint` | Run ESLint |

See [the knowledge base](docs/knowledge-base/README.md) before changing ingestion, authentication, or persistence behavior.
