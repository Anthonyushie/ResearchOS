import { listRecords, upsertRecord, deleteRecord, isDbConfigured } from '@/lib/db';
import { requireOwnerId } from '@/lib/auth-helpers';
import { demoRecords } from '@/lib/demo-data';

export const dynamic = 'force-dynamic';

/**
 * POST /api/seed — load the demo library into the caller's private
 * workspace. Idempotent: refuses when the user already has records, so
 * real libraries are never mixed with demo data by accident.
 */
export async function POST() {
  const authz = await requireOwnerId();
  if ('error' in authz) return authz.error;
  if (!isDbConfigured()) {
    return Response.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }
  try {
    const existing = await listRecords(1, authz.ownerId);
    if (existing.length > 0) {
      return Response.json(
        { error: 'Library is not empty — demo data only seeds into an empty workspace' },
        { status: 409 }
      );
    }
    const records = demoRecords(authz.ownerId);
    for (const record of records) {
      await upsertRecord(record, authz.ownerId);
    }
    return Response.json({ seeded: records.length, source: 'db' }, { status: 201 });
  } catch (err) {
    console.error('[api/seed POST] failed:', err);
    return Response.json({ error: 'Failed to seed demo data' }, { status: 500 });
  }
}

/**
 * DELETE /api/seed — remove only `demo-*` records from the caller's
 * workspace. Real uploads are never touched.
 */
export async function DELETE() {
  const authz = await requireOwnerId();
  if ('error' in authz) return authz.error;
  if (!isDbConfigured()) {
    return Response.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }
  try {
    const all = await listRecords(200, authz.ownerId);
    const demos = all.filter((r) => r.id.startsWith('demo-'));
    for (const record of demos) {
      await deleteRecord(record.id, authz.ownerId);
    }
    return Response.json({ removed: demos.length, source: 'db' });
  } catch (err) {
    console.error('[api/seed DELETE] failed:', err);
    return Response.json({ error: 'Failed to clear demo data' }, { status: 500 });
  }
}
