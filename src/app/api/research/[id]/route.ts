import type { NextRequest } from 'next/server';
import { getRecord, upsertRecord, deleteRecord, isDbConfigured } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/research/[id]'>) {
  const { id } = await ctx.params;
  try {
    if (!isDbConfigured()) {
      return Response.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
    }
    const record = await getRecord(id);
    if (!record) return Response.json({ error: 'Record not found' }, { status: 404 });
    return Response.json({ record, source: 'db' });
  } catch (err) {
    console.error('[api/research/[id] GET] failed:', err);
    return Response.json({ error: 'Failed to fetch record' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, ctx: RouteContext<'/api/research/[id]'>) {
  const { id } = await ctx.params;
  try {
    if (!isDbConfigured()) {
      return Response.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
    }
    const existing = await getRecord(id);
    if (!existing) return Response.json({ error: 'Record not found' }, { status: 404 });
    const updates = (await request.json()) as Record<string, unknown>;
    const merged = { ...existing, ...updates, id: existing.id };
    const saved = await upsertRecord(merged);
    return Response.json({ record: saved, source: 'db' });
  } catch (err) {
    console.error('[api/research/[id] PATCH] failed:', err);
    return Response.json({ error: 'Failed to update record' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/research/[id]'>) {
  const { id } = await ctx.params;
  try {
    if (!isDbConfigured()) return Response.json({ error: 'DB not configured' }, { status: 503 });
    const ok = await deleteRecord(id);
    if (!ok) return Response.json({ error: 'Record not found' }, { status: 404 });
    return Response.json({ ok: true });
  } catch (err) {
    console.error('[api/research/[id] DELETE] failed:', err);
    return Response.json({ error: 'Failed to delete record' }, { status: 500 });
  }
}
