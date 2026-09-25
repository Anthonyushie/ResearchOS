# ResearchOS knowledge base

This is the project’s source-grounded reference for contributors. It describes the behavior implemented in the current repository, including gaps between UI text and working features.

## Read by task

| If you need to… | Read |
| --- | --- |
| Understand the app and where code lives | [Architecture and data model](architecture.md) |
| Trace an upload, search, or comparison | [Workflows](workflows.md) |
| Call or change a route | [API reference](api.md) |
| Set up or diagnose a local instance | [Operations](operations.md) |

## What the app does today

- Google sign-in creates a private workspace keyed by the authenticated user ID.
- The library shows papers, experiments, and datasets stored in Neon Postgres. Each record has metadata, extracted text, a summary, and AI processing status.
- Upload accepts a file up to 50 MB. It extracts text from PDF and text-based files (including TXT, Markdown, and CSV); Gemini can analyze the text or an eligible PDF. The user can edit selected metadata after upload.
- The overview searches database records and can fall back to searching records already loaded in the browser. The Research page filters the loaded library by type and selected metadata. Related records are found locally from shared fields.
- Compare shows two records side by side and requests a Gemini comparison, with a local rules-based fallback.
- Insights answers questions using matching owner-scoped records, suggests follow-up experiments from findings and limitations, and maps shared topic tags. Answers and suggestions link to supporting records. Source findings and stated limitations appear when Gemini is unavailable.
- An empty workspace can load six synthetic demo records; they are marked as demo data and can be removed separately.

## Current boundaries

- Neon is the record store. There is no bundled mock library; `src/lib/mock-data.ts` supplies types and empty arrays. An upload without a database URL can return a record but does not persist it.
- The original uploaded file is not stored. The database holds extracted text, filename, metadata, and analysis results. The detail page displays a short source-text excerpt, not a downloadable source file.
- Insight answers and gap ideas are generated on request and are not stored. Ask searches the newest 100 records lexically; the gap generator considers at most 20 records with findings, limitations, or readable extracted text. Its proposals require review against the linked source records.
- Search and relatedness are lexical and rule-based, not embeddings or semantic retrieval. The API first selects up to 20 database matches, then computes display scores.
- AI output and comparisons should be checked against source material. The fallback comparison uses record metadata and can be generic.

## Source map

| Area | Main files |
| --- | --- |
| Pages and navigation | `src/app/{page,research,datasets,compare,insights,login}`; `src/components/Sidebar.tsx` |
| Client state | `src/lib/context.tsx` |
| Authentication | `src/auth.ts`; `src/proxy.ts`; `src/lib/auth-helpers.ts` |
| Persistence | `src/lib/db.ts`; `src/lib/mock-data.ts` (record type) |
| Ingestion and AI | `src/app/api/upload/route.ts`; `src/lib/gemini.ts` |
| Search and relatedness | `src/app/api/search/route.ts`; `src/lib/search.ts` |
| Insight generation and evidence map | `src/app/api/{ask,insights}/route.ts`; `src/lib/research-intelligence.ts`; `src/components/EvidenceMap.tsx` |
| Demo content | `src/lib/demo-data.ts`; `src/app/api/seed/route.ts` |

Update this knowledge base when the corresponding behavior changes. State implemented behavior separately from proposed behavior.
