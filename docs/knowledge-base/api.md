# HTTP API reference

Routes live under `src/app/api`. Except for Auth.js handlers and the health check, app data routes require a signed-in session and use the caller’s workspace ID. Unauthenticated data requests return JSON `401`. Examples below assume a browser session with its cookies; they are not anonymous public endpoints.

| Method and path | Input | Success response | Notes |
| --- | --- | --- | --- |
| `GET /api/research?limit=100` | Optional `limit` (capped at 200) | `{ records, source: "db", dbConfigured: true }` | Newest first; owner-scoped. `503` without DB. |
| `POST /api/research` | JSON record, at least `title` | `{ record, source: "db" }` (`201`) | Defaults missing fields; owner ID comes from session. |
| `GET /api/research/[id]` | Record ID in path | `{ record, source: "db" }` | `404` when not found for caller. |
| `PATCH /api/research/[id]` | JSON fields to update | `{ record, source: "db" }` | Loads caller-owned record, merges fields, then upserts. |
| `DELETE /api/research/[id]` | Record ID in path | `{ ok: true }` | Deletes only caller-owned record. |
| `POST /api/upload` | Multipart `file`; optional JSON string `metadata` | `{ record, aiUsed, aiStatus, extraction, source, … }` (`201`) | Max 50 MB. `source: "mock"` means returned but not persisted when DB is absent. |
| `GET /api/search?q=term` | Query string `q` | `{ results, query, source: "db" }` | Empty query returns an empty result set. Nonempty search needs DB. |
| `POST /api/compare` | JSON `{ idA, idB }` or `{ recordA, recordB }` | `{ similarities, differences, aiUsed }` | Requires two distinct records. Full objects are accepted directly; IDs resolve through owner-scoped DB lookups. |
| `POST /api/seed` | None | `{ seeded, source: "db" }` (`201`) | Only when caller’s library is empty; otherwise `409`. |
| `DELETE /api/seed` | None | `{ removed, source: "db" }` | Removes caller’s `demo-*` records. |
| `GET /api/health` | None | `{ ok, db, gemini, timestamp }` | No session check in handler. DB connectivity decides `200` vs `503`; reports Gemini configuration, not a live model call. |
| `/api/auth/[...nextauth]` | Auth.js flow | Auth.js response | Google OAuth sign-in and session endpoints. |

## Shapes used by the UI

`ResearchRecord` is defined in `src/lib/mock-data.ts` and mapped to Postgres by `src/lib/db.ts`. Search results contain `{ record, relevance, matchReason, matchingTopics, excerpt }`. Relevance is a heuristic percentage for display. Upload `aiStatus` is `indexed`, `needs-text`, or `failed`; demo records use `demo`.

## Common errors

| Status | Typical cause |
| --- | --- |
| `400` | Missing required file or title; comparison has fewer than two distinct records |
| `401` | Signed out or missing owner ID |
| `404` | Record not found in caller’s workspace |
| `409` | Demo seed requested for a nonempty workspace |
| `413` | File exceeds 50 MB |
| `500` | Route processing failed |
| `503` | Database URL missing or database unavailable for a DB-backed route |

For exact optional fields and route-specific responses, consult the route file before changing an API client.
