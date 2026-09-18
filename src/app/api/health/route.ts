import { isDbConfigured, getSql } from '@/lib/db';
import { isGeminiConfigured } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

export async function GET() {
  const dbConfigured = isDbConfigured();
  const geminiConfigured = isGeminiConfigured();

  let dbOk = false;
  let dbError: string | null = null;
  if (dbConfigured) {
    try {
      const sql = getSql();
      await sql`SELECT 1 AS ok`;
      dbOk = true;
    } catch (err) {
      dbError = err instanceof Error ? err.message : String(err);
    }
  }

  const ok = dbOk;
  return Response.json(
    {
      ok,
      db: { configured: dbConfigured, connected: dbOk, error: dbError },
      gemini: { configured: geminiConfigured },
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 }
  );
}
