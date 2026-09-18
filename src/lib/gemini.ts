import { GoogleGenAI } from '@google/genai';
import type { ResearchRecord } from './mock-data';
import { mockExtractMetadata, mockGenerateComparison } from './ai';

export interface AiAnalysis {
  title: string;
  type: 'paper' | 'experiment' | 'dataset';
  topics: string[];
  keywords: string[];
  authors: string[];
  date: string;
  experimentName: string;
  variables: string[];
  description: string;
  summary: {
    objective: string;
    method: string;
    keyFindings: string[];
    limitations: string[];
  };
  findings: string[];
  limitations: string[];
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

function getClient(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not configured');
  return new GoogleGenAI({ apiKey: key });
}

// Model cascade: newest stable first, older as fallback
const MODELS = ['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-flash-latest'];

async function generateText(prompt: string): Promise<string> {
  const ai = getClient();
  let lastErr: unknown = null;
  for (const model of MODELS) {
    try {
      const res = await ai.models.generateContent({ model, contents: prompt });
      if (res.text) return res.text;
      lastErr = new Error(`Empty response from ${model}`);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

function safeJsonParse(text: string): Record<string, unknown> | null {
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x)).filter(Boolean).slice(0, 12);
  return [];
}

function fallbackAnalysis(fileName: string, text: string): AiAnalysis {
  const meta = mockExtractMetadata(fileName);
  const excerpt = text.slice(0, 500) || `Content extracted from ${fileName}.`;
  return {
    ...meta,
    type: fileName.toLowerCase().endsWith('.csv') ? 'dataset' : 'paper',
    description: excerpt.slice(0, 280),
    summary: {
      objective: `Analyze ${meta.title} based on extracted content.`,
      method: 'Automated extraction pending full AI analysis.',
      keyFindings: [excerpt.slice(0, 160)],
      limitations: ['AI analysis unavailable — verify against source file.'],
    },
    findings: [excerpt.slice(0, 160)],
    limitations: ['AI analysis unavailable — verify against source file.'],
  };
}

export async function analyzeResearchText(fileName: string, extractedText: string): Promise<{ analysis: AiAnalysis; aiUsed: boolean }> {
  if (!isGeminiConfigured()) {
    return { analysis: fallbackAnalysis(fileName, extractedText), aiUsed: false };
  }
  try {
    const truncated = extractedText.slice(0, 12000);
    const prompt = `You are a research assistant for agricultural science. Analyze the following research document and return STRICT JSON only (no markdown, no explanation).

Required JSON shape:
{
  "title": string,
  "type": "paper" | "experiment" | "dataset",
  "topics": string[],
  "keywords": string[],
  "authors": string[],
  "date": "YYYY-MM-DD",
  "experimentName": string,
  "variables": string[],
  "description": string (2-3 sentences),
  "summary": { "objective": string, "method": string, "keyFindings": string[3-5], "limitations": string[2-4] },
  "findings": string[2-4],
  "limitations": string[2-4]
}

File name: ${fileName}
Document text:
${truncated || '(no extractable text — infer from file name only)'}`;

    const text = await generateText(prompt);
    const parsed = safeJsonParse(text);
    if (!parsed) throw new Error('Gemini returned non-JSON');

    const type = parsed.type === 'experiment' || parsed.type === 'dataset' ? parsed.type : 'paper';
    const analysis: AiAnalysis = {
      title: String(parsed.title || fileName.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ')),
      type,
      topics: toStringArray(parsed.topics).length ? toStringArray(parsed.topics) : ['Agriculture'],
      keywords: toStringArray(parsed.keywords),
      authors: toStringArray(parsed.authors).length ? toStringArray(parsed.authors) : ['Unknown Author'],
      date: typeof parsed.date === 'string' && parsed.date ? parsed.date : new Date().toISOString().split('T')[0],
      experimentName: String(parsed.experimentName || `EXP-${Date.now().toString(36).toUpperCase()}`),
      variables: toStringArray(parsed.variables),
      description: String(parsed.description || '').slice(0, 600),
      summary: {
        objective: String((parsed.summary as Record<string, unknown> | undefined)?.objective ?? ''),
        method: String((parsed.summary as Record<string, unknown> | undefined)?.method ?? ''),
        keyFindings: toStringArray((parsed.summary as Record<string, unknown> | undefined)?.keyFindings),
        limitations: toStringArray((parsed.summary as Record<string, unknown> | undefined)?.limitations),
      },
      findings: toStringArray(parsed.findings),
      limitations: toStringArray(parsed.limitations),
    };
    return { analysis, aiUsed: true };
  } catch (err) {
    console.error('[gemini] analyzeResearchText failed, using fallback:', err);
    return { analysis: fallbackAnalysis(fileName, extractedText), aiUsed: false };
  }
}

export async function compareResearch(
  a: ResearchRecord,
  b: ResearchRecord
): Promise<{ similarities: string[]; differences: string[]; aiUsed: boolean }> {
  if (!isGeminiConfigured()) {
    return { ...mockGenerateComparison(a, b), aiUsed: false };
  }
  try {
    const prompt = `Compare two agricultural research studies and return STRICT JSON only: {"similarities": string[2-4], "differences": string[2-4]}.

Study A: "${a.title}" (${a.type}). Topics: ${a.topics.join(', ')}. Variables: ${a.variables.join(', ')}. Summary: ${a.summary.objective} ${a.summary.method} Findings: ${a.summary.keyFindings.join('; ')}.

Study B: "${b.title}" (${b.type}). Topics: ${b.topics.join(', ')}. Variables: ${b.variables.join(', ')}. Summary: ${b.summary.objective} ${b.summary.method} Findings: ${b.summary.keyFindings.join('; ')}.`;
    const text = await generateText(prompt);
    const parsed = safeJsonParse(text);
    if (!parsed) throw new Error('Gemini returned non-JSON');
    const similarities = toStringArray(parsed.similarities);
    const differences = toStringArray(parsed.differences);
    if (!similarities.length || !differences.length) throw new Error('Empty comparison');
    return { similarities, differences, aiUsed: true };
  } catch (err) {
    console.error('[gemini] compareResearch failed, using fallback:', err);
    return { ...mockGenerateComparison(a, b), aiUsed: false };
  }
}
