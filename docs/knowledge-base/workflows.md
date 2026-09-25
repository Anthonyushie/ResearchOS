# User and processing workflows

## Sign in and load the library

1. A visitor signs in with Google on `/login`.
2. Protected pages require an Auth.js session. Data APIs call `requireOwnerId()` to get the workspace owner.
3. `AppProvider` fetches `/api/research?limit=100` after mounting. The library, dataset list, comparison selector, and record detail view read this in-memory list.
4. A missing database URL or database outage causes the list API to return `503`; the provider shows an empty list. There is no populated mock fallback.

## Upload a document

1. `UploadModal` sends multipart form data with a `file` field to `POST /api/upload`. Uploading immediately creates a record; the later “Done” step saves metadata edits by `PATCH /api/research/[id]`.
2. The server rejects files over 50 MB. TXT, Markdown, and files with a `text/*` MIME type are decoded as UTF-8. A CSV with another or missing MIME type goes through a separate preview path that includes the first rows and row count. PDF text and embedded title/author are read with `pdf-parse`. Images and other non-text formats have no extractor. The file picker offers PDF, CSV, TXT, and image extensions; Markdown can be sent through drag-and-drop or the API.
3. General text and PDF extraction keeps at most 20,000 characters. The Gemini prompt includes at most the first 12,000 extracted characters. The separate CSV preview includes at most 31 lines and 12,000 characters. PDFs up to 20 MB may also be sent inline to Gemini, which helps with scanned PDFs.
4. If there is no Gemini key, Gemini fails, or source text is too thin without an eligible PDF, the server saves an honest stub. `aiStatus` distinguishes `failed` from `needs-text`; successful model extraction is `indexed`.
5. The record stores extracted text and metadata. The original file bytes are discarded. With no database URL, the upload response warns that it was not persisted.

The UI’s editable fields after upload are title, topics, keywords, authors, date, experiment name, and variables. The record is already saved before the user confirms those edits.

## Explore records

- Overview `/`: recent records and a search box. Search calls `GET /api/search?q=…`; when that fails, it searches the currently loaded records in the browser.
- Research `/research`: filter the loaded list by record type and title, keywords, topics, authors, or variables. This is client-side filtering over the provider’s loaded records.
- Datasets `/datasets`: show loaded records whose `type` is `dataset`.
- Detail `/research/[id]`: show one loaded record’s description, source excerpt, summary, metadata, and locally computed related records.
- Insights `/insights`: currently shows an empty state because the source `insightRecords` array is empty.

The provider loads 100 records by default, so client-side lists, filters, and relatedness may omit older records once a workspace exceeds that count. The list API itself accepts a limit up to 200.

## Compare two records

The Compare page selects two loaded records and posts their full objects to `/api/compare`. The server asks Gemini for grounded similarities and differences when configured. Otherwise, or on model failure, `mockGenerateComparison()` creates a rules-based comparison from the records. The page also shows objective, method, variables, findings, limitations, and filename side by side. `aiUsed` in the API response identifies whether Gemini produced the narrative.

## Demo library

On an empty workspace, `POST /api/seed` writes six synthetic records for that owner. It returns `409` if any record already exists. `DELETE /api/seed` removes that owner’s records whose IDs start with `demo-`, leaving other records in place. Both operations require the database.
