# Architecture and data model

## Request flow

```text
Browser pages and components
  → AppProvider loads /api/research?limit=100
  → API route checks Auth.js session with requireOwnerId()
  → Neon queries filter by owner_id

UploadModal → /api/upload → text extraction → Gemini (when available)
                                → research_records → AppProvider refresh
```

This is a Next.js 16 App Router application using React 19. Pages under `src/app` are mostly client components backed by `AppProvider` in `src/lib/context.tsx`. The provider loads up to 100 records from the API, stores them in browser memory, and manages upload modal, theme, and toast state. It does not cache records across sessions. `src/components/AppShell.tsx` and `Sidebar.tsx` provide the shared UI.

## Authentication and isolation

`src/auth.ts` configures Auth.js with Google and JWT sessions. `src/proxy.ts` guards app pages. Data routes call `requireOwnerId()` themselves and return JSON `401` for signed-out requests. The owner ID comes from the session’s user ID, with email as a fallback. Database list, get, search, and delete operations used by the API scope records to `owner_id`.

`/api/compare` can also accept complete `recordA` and `recordB` objects from the caller; in that case it compares those supplied objects directly. Treat its output as user-supplied data, and validate ownership if this route is later used for trusted or shared comparisons.

## Database

`src/lib/db.ts` uses `@neondatabase/serverless`. It reads `DATABASE_URL` or `NEON_DATABASE_URL`. `ensureSchema()` creates the `research_records` table and adds newer columns on database operations; there is no separate migration runner. The table’s primary key is a text `id`, and `owner_id` identifies the workspace. Demo IDs include an owner-derived prefix to avoid collisions across users.

The application record shape is `ResearchRecord` in `src/lib/mock-data.ts`:

| Group | Fields |
| --- | --- |
| Identity | `id`, `ownerId`, `type` (`paper`, `experiment`, `dataset`) |
| Bibliography | `title`, `authors`, `date`, `fileName`, `experimentName` |
| Discovery | `topics`, `keywords`, `variables`, `description`, `extractedText` |
| Findings | `summary` (`objective`, `method`, `keyFindings`, `limitations`), `findings`, `limitations` |
| Processing | `aiProcessed`, `aiStatus`, `aiModel`, `extractionChars`, `extractionPages` |

Arrays and summary are stored as JSONB. `created_at` is assigned by Postgres and drives newest-first listing. The full uploaded file is not persisted. Record `id` is table-wide, while ownership is a separate column; when adding new write paths, keep owner checks and ID generation in mind.

**Known write-path risk:** `POST /api/research` accepts a caller-supplied ID, and `upsertRecord()` updates an existing row on ID conflict without checking its owner. A caller who knows another workspace’s record ID could overwrite that record’s fields. Fix this before treating the record API as safely isolated in a public deployment.

## AI and discovery

`src/lib/gemini.ts` sends extracted text, or an eligible PDF, to Gemini and asks for structured JSON grounded in the source. It returns `indexed`, `needs-text`, or `failed`, alongside whether AI actually ran. Demo records use `demo`. If Gemini is absent or fails, the record gets filename-derived title and available source excerpt with empty inferred fields. Comparison similarly falls back to rules in `src/lib/ai.ts`.

Database search in `src/lib/db.ts` uses case-insensitive substring matching across text and JSON fields. `src/lib/search.ts` computes relevance and related-record scores using field matches. These scores are display heuristics, not statistical confidence.

## Where to make changes

- Change storage fields in `ResearchRecord`, `src/lib/db.ts` schema and mapping, and the relevant API response together.
- Change extraction in `src/app/api/upload/route.ts`; change model prompts and status handling in `src/lib/gemini.ts`.
- Change user-facing search in `src/app/api/search/route.ts`, `src/lib/search.ts`, and the overview page.
- Change auth in `src/auth.ts`, `src/proxy.ts`, and `src/lib/auth-helpers.ts`; keep API routes returning useful JSON errors.
