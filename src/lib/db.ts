import { neon, neonConfig } from '@neondatabase/serverless';
import type { ResearchRecord } from './mock-data';

// Required for Neon serverless fetch connection on Node / Edge
neonConfig.fetchConnectionCache = true;

function getDatabaseUrl(): string | null {
  return process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL ?? null;
}

export function isDbConfigured(): boolean {
  return Boolean(getDatabaseUrl());
}

export function getSql() {
  const url = getDatabaseUrl();
  if (!url) throw new Error('DATABASE_URL is not configured');
  return neon(url);
}

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS research_records (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('paper', 'experiment', 'dataset')),
  authors JSONB NOT NULL DEFAULT '[]',
  date TEXT NOT NULL DEFAULT '',
  topics JSONB NOT NULL DEFAULT '[]',
  keywords JSONB NOT NULL DEFAULT '[]',
  variables JSONB NOT NULL DEFAULT '[]',
  experiment_name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  extracted_text TEXT NOT NULL DEFAULT '',
  summary JSONB NOT NULL DEFAULT '{"objective":"","method":"","keyFindings":[],"limitations":[]}',
  findings JSONB NOT NULL DEFAULT '[]',
  limitations JSONB NOT NULL DEFAULT '[]',
  file_name TEXT NOT NULL DEFAULT '',
  ai_processed BOOLEAN NOT NULL DEFAULT false,
  owner_id TEXT NOT NULL DEFAULT 'legacy',
  extraction_chars INTEGER NOT NULL DEFAULT 0,
  extraction_pages INTEGER,
  ai_model TEXT NOT NULL DEFAULT '',
  ai_status TEXT NOT NULL DEFAULT 'indexed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_research_type ON research_records (type);
CREATE INDEX IF NOT EXISTS idx_research_created ON research_records (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_owner ON research_records (owner_id, created_at DESC);
`;

export async function ensureSchema(): Promise<void> {
  const sql = getSql();
  // neon() supports single statements best; split manually
  await sql`CREATE TABLE IF NOT EXISTS research_records (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('paper', 'experiment', 'dataset')),
    authors JSONB NOT NULL DEFAULT '[]',
    date TEXT NOT NULL DEFAULT '',
    topics JSONB NOT NULL DEFAULT '[]',
    keywords JSONB NOT NULL DEFAULT '[]',
    variables JSONB NOT NULL DEFAULT '[]',
    experiment_name TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    extracted_text TEXT NOT NULL DEFAULT '',
    summary JSONB NOT NULL DEFAULT '{"objective":"","method":"","keyFindings":[],"limitations":[]}',
    findings JSONB NOT NULL DEFAULT '[]',
    limitations JSONB NOT NULL DEFAULT '[]',
    file_name TEXT NOT NULL DEFAULT '',
    ai_processed BOOLEAN NOT NULL DEFAULT false,
    owner_id TEXT NOT NULL DEFAULT 'legacy',
    extraction_chars INTEGER NOT NULL DEFAULT 0,
    extraction_pages INTEGER,
    ai_model TEXT NOT NULL DEFAULT '',
    ai_status TEXT NOT NULL DEFAULT 'indexed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`ALTER TABLE research_records ADD COLUMN IF NOT EXISTS owner_id TEXT NOT NULL DEFAULT 'legacy'`;
  await sql`ALTER TABLE research_records ADD COLUMN IF NOT EXISTS extraction_chars INTEGER NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE research_records ADD COLUMN IF NOT EXISTS extraction_pages INTEGER`;
  await sql`ALTER TABLE research_records ADD COLUMN IF NOT EXISTS ai_model TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE research_records ADD COLUMN IF NOT EXISTS ai_status TEXT NOT NULL DEFAULT 'indexed'`;
  await sql`CREATE INDEX IF NOT EXISTS idx_research_type ON research_records (type)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_research_created ON research_records (created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_research_owner ON research_records (owner_id, created_at DESC)`;
}

type DbRow = {
  id: string;
  title: string;
  type: 'paper' | 'experiment' | 'dataset';
  authors: unknown;
  date: string;
  topics: unknown;
  keywords: unknown;
  variables: unknown;
  experiment_name: string;
  description: string;
  extracted_text: string;
  summary: unknown;
  findings: unknown;
  limitations: unknown;
  file_name: string;
  ai_processed: boolean;
  owner_id?: string;
  extraction_chars?: number | null;
  extraction_pages?: number | null;
  ai_model?: string | null;
  ai_status?: string | null;
};

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return [];
    }
  }
  return [];
}

export function rowToRecord(row: DbRow): ResearchRecord {
  const summaryRaw = (typeof row.summary === 'string' ? safeParse(row.summary) : row.summary) as Record<string, unknown> | null;
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    authors: asStringArray(row.authors),
    date: row.date,
    topics: asStringArray(row.topics),
    keywords: asStringArray(row.keywords),
    variables: asStringArray(row.variables),
    experimentName: row.experiment_name,
    description: row.description,
    extractedText: row.extracted_text,
    summary: {
      objective: String(summaryRaw?.objective ?? ''),
      method: String(summaryRaw?.method ?? ''),
      keyFindings: asStringArray(summaryRaw?.keyFindings),
      limitations: asStringArray(summaryRaw?.limitations),
    },
    findings: asStringArray(row.findings),
    limitations: asStringArray(row.limitations),
    fileName: row.file_name,
    aiProcessed: Boolean(row.ai_processed),
    ownerId: typeof row.owner_id === 'string' ? row.owner_id : undefined,
    aiStatus:
      row.ai_status === 'needs-text' || row.ai_status === 'failed' ? row.ai_status : 'indexed',
    aiModel: typeof row.ai_model === 'string' ? row.ai_model : '',
    extractionChars: typeof row.extraction_chars === 'number' ? row.extraction_chars : 0,
    extractionPages: typeof row.extraction_pages === 'number' ? row.extraction_pages : undefined,
  };
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export async function listRecords(limit = 100, ownerId?: string): Promise<ResearchRecord[]> {
  const sql = getSql();
  await ensureSchema();
  if (!ownerId) return [];
  const rows = (await sql`SELECT * FROM research_records WHERE owner_id = ${ownerId} ORDER BY created_at DESC LIMIT ${limit}`) as unknown as DbRow[];
  return rows.map(rowToRecord);
}

export async function getRecord(id: string, ownerId?: string): Promise<ResearchRecord | null> {
  const sql = getSql();
  await ensureSchema();
  const rows = ownerId
    ? ((await sql`SELECT * FROM research_records WHERE id = ${id} AND owner_id = ${ownerId} LIMIT 1`) as unknown as DbRow[])
    : ((await sql`SELECT * FROM research_records WHERE id = ${id} LIMIT 1`) as unknown as DbRow[]);
  if (rows.length === 0) return null;
  return rowToRecord(rows[0]);
}

export async function countRecords(ownerId?: string): Promise<number> {
  const sql = getSql();
  await ensureSchema();
  const rows = ownerId
    ? ((await sql`SELECT COUNT(*)::int AS count FROM research_records WHERE owner_id = ${ownerId}`) as unknown as { count: number }[])
    : ((await sql`SELECT COUNT(*)::int AS count FROM research_records`) as unknown as { count: number }[]);
  return rows[0]?.count ?? 0;
}

export async function upsertRecord(record: ResearchRecord, ownerId?: string): Promise<ResearchRecord> {
  const sql = getSql();
  await ensureSchema();
  const owner = ownerId ?? record.ownerId ?? 'legacy';
  const aiStatus = record.aiStatus ?? (record.aiProcessed ? 'indexed' : 'failed');
  const rows = (await sql`
    INSERT INTO research_records (
      id, title, type, authors, date, topics, keywords, variables,
      experiment_name, description, extracted_text, summary,
      findings, limitations, file_name, ai_processed, owner_id,
      extraction_chars, extraction_pages, ai_model, ai_status
    ) VALUES (
      ${record.id}, ${record.title}, ${record.type},
      ${JSON.stringify(record.authors)}::jsonb, ${record.date},
      ${JSON.stringify(record.topics)}::jsonb,
      ${JSON.stringify(record.keywords)}::jsonb,
      ${JSON.stringify(record.variables)}::jsonb,
      ${record.experimentName}, ${record.description}, ${record.extractedText},
      ${JSON.stringify(record.summary)}::jsonb,
      ${JSON.stringify(record.findings)}::jsonb,
      ${JSON.stringify(record.limitations)}::jsonb,
      ${record.fileName}, ${record.aiProcessed}, ${owner},
      ${record.extractionChars ?? 0}, ${record.extractionPages ?? null},
      ${record.aiModel ?? ''}, ${aiStatus}
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      type = EXCLUDED.type,
      authors = EXCLUDED.authors,
      date = EXCLUDED.date,
      topics = EXCLUDED.topics,
      keywords = EXCLUDED.keywords,
      variables = EXCLUDED.variables,
      experiment_name = EXCLUDED.experiment_name,
      description = EXCLUDED.description,
      extracted_text = EXCLUDED.extracted_text,
      summary = EXCLUDED.summary,
      findings = EXCLUDED.findings,
      limitations = EXCLUDED.limitations,
      file_name = EXCLUDED.file_name,
      ai_processed = EXCLUDED.ai_processed,
      extraction_chars = EXCLUDED.extraction_chars,
      extraction_pages = EXCLUDED.extraction_pages,
      ai_model = EXCLUDED.ai_model,
      ai_status = EXCLUDED.ai_status
    RETURNING *
  `) as unknown as DbRow[];
  return rowToRecord(rows[0]);
}

export async function deleteRecord(id: string, ownerId?: string): Promise<boolean> {
  const sql = getSql();
  await ensureSchema();
  const rows = ownerId
    ? ((await sql`DELETE FROM research_records WHERE id = ${id} AND owner_id = ${ownerId} RETURNING id`) as unknown as { id: string }[])
    : ((await sql`DELETE FROM research_records WHERE id = ${id} RETURNING id`) as unknown as { id: string }[]);
  return rows.length > 0;
}

export async function searchRecords(query: string, ownerId?: string, limit = 20): Promise<ResearchRecord[]> {
  const sql = getSql();
  await ensureSchema();
  if (!ownerId) return [];
  const q = `%${query.trim().toLowerCase()}%`;
  if (!query.trim()) return listRecords(limit, ownerId);
  const rows = (await sql`
    SELECT * FROM research_records
    WHERE owner_id = ${ownerId}
      AND (
        LOWER(title) LIKE ${q}
        OR LOWER(description) LIKE ${q}
        OR LOWER(extracted_text) LIKE ${q}
        OR LOWER(file_name) LIKE ${q}
        OR LOWER(topics::text) LIKE ${q}
        OR LOWER(keywords::text) LIKE ${q}
        OR LOWER(authors::text) LIKE ${q}
        OR LOWER(variables::text) LIKE ${q}
      )
    ORDER BY created_at DESC
    LIMIT ${limit}
  `) as unknown as DbRow[];
  return rows.map(rowToRecord);
}
