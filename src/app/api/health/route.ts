import {sql} from 'drizzle-orm';
import {db} from '@/server/db';

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({status: 'ok', checks: {database: 'up'}});
  } catch {
    return Response.json({status: 'degraded', checks: {database: 'down'}}, {status: 503});
  }
}
