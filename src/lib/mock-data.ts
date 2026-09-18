export interface ResearchRecord {
  id: string;
  title: string;
  type: "paper" | "experiment" | "dataset";
  authors: string[];
  date: string;
  topics: string[];
  keywords: string[];
  variables: string[];
  experimentName: string;
  description: string;
  extractedText: string;
  summary: {
    objective: string;
    method: string;
    keyFindings: string[];
    limitations: string[];
  };
  findings: string[];
  limitations: string[];
  fileName: string;
  aiProcessed: boolean;
  ownerId?: string;
  /** Honest AI outcome: 'indexed' | 'needs-text' | 'failed' | 'demo'. Defaults to 'indexed' for legacy rows. */
  aiStatus?: 'indexed' | 'needs-text' | 'failed' | 'demo';
  /** Model that produced the analysis ('' when AI did not run). */
  aiModel?: string;
  /** Characters of source text extracted (0 = nothing readable). */
  extractionChars?: number;
  /** PDF page count, when known. */
  extractionPages?: number;
}

export interface InsightRecord {
  id: string;
  title: string;
  description: string;
  correlation?: number;
  sourceIds: string[];
  category: string;
  dataset?: { label: string; x: number; y: number }[];
}

// NOTE: The bundled mock library was removed. Neon Postgres is the single
// source of truth for research records. These empty arrays remain only so
// existing imports keep typechecking; all UI reads live data from /api/*.
export const researchRecords: ResearchRecord[] = [];

export const insightRecords: InsightRecord[] = [];
