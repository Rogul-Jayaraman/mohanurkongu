/**
 * PostgreSQL Connection Diagnostics
 * 
 * Usage: npx ts-node scripts/db-diagnostics.ts
 * 
 * Reports active/idle/blocked connections, max_connections,
 * and long-running queries for the configured database.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runDiagnostics() {
  console.log('\n══════════════════════════════════════════════');
  console.log('  PostgreSQL Connection Diagnostics');
  console.log('══════════════════════════════════════════════\n');

  try {
    // 1. Max connections
    const maxConnResult = await prisma.$queryRaw<
      { setting: string }[]
    >`SHOW max_connections`;
    console.log(`Max connections (server): ${maxConnResult[0]?.setting ?? 'unknown'}`);

    // 2. Active connections grouped by state
    const activeConnections = await prisma.$queryRaw<
      { state: string; count: bigint }[]
    >`
      SELECT state, COUNT(*)::int as count
      FROM pg_stat_activity
      WHERE datname = current_database()
        AND pid <> pg_backend_pid()
      GROUP BY state
      ORDER BY count DESC
    `;
    console.log('\nActive connections (by state):');
    for (const row of activeConnections) {
      console.log(`  ${row.state.padEnd(20)} ${row.count.toString()}`);
    }

    // 3. Total active connections
    const totalResult = await prisma.$queryRaw<
      { count: bigint }[]
    >`
      SELECT COUNT(*)::int as count
      FROM pg_stat_activity
      WHERE datname = current_database()
        AND pid <> pg_backend_pid()
    `;
    console.log(`\nTotal connections to this DB: ${totalResult[0]?.count.toString() ?? 'unknown'}`);

    // 4. Idle connections
    const idleResult = await prisma.$queryRaw<
      { count: bigint }[]
    >`
      SELECT COUNT(*)::int as count
      FROM pg_stat_activity
      WHERE datname = current_database()
        AND state = 'idle'
        AND pid <> pg_backend_pid()
    `;
    console.log(`Idle connections: ${idleResult[0]?.count.toString() ?? 'unknown'}`);

    // 5. Blocked queries
    const blockedResult = await prisma.$queryRaw<
      { pid: number; duration: string; query: string }[]
    >`
      SELECT
        a.pid,
        now() - a.query_start AS duration,
        a.query
      FROM pg_stat_activity a
      WHERE a.datname = current_database()
        AND a.state = 'active'
        AND a.wait_event_type = 'Lock'
        AND a.pid <> pg_backend_pid()
      ORDER BY a.query_start
    `;
    console.log(`\nBlocked queries: ${blockedResult.length}`);
    for (const row of blockedResult) {
      console.log(`  PID ${row.pid}: blocked for ${row.duration} - ${row.query.substring(0, 100)}`);
    }

    // 6. Long-running queries (>5 seconds)
    const longResult = await prisma.$queryRaw<
      { pid: number; duration: string; state: string; query: string }[]
    >`
      SELECT
        a.pid,
        now() - a.query_start AS duration,
        a.state,
        a.query
      FROM pg_stat_activity a
      WHERE a.datname = current_database()
        AND a.state = 'active'
        AND a.pid <> pg_backend_pid()
        AND a.query_start < now() - interval '5 seconds'
      ORDER BY a.query_start
    `;
    console.log(`\nLong-running queries (>5s): ${longResult.length}`);
    for (const row of longResult) {
      console.log(`  PID ${row.pid} (${row.state}): ${row.duration} - ${row.query.substring(0, 100)}`);
    }

    // 7. Connection count by source (application_name)
    const appResult = await prisma.$queryRaw<
      { application_name: string; count: bigint }[]
    >`
      SELECT application_name, COUNT(*)::int as count
      FROM pg_stat_activity
      WHERE datname = current_database()
        AND pid <> pg_backend_pid()
      GROUP BY application_name
      ORDER BY count DESC
    `;
    console.log('\nConnections by application:');
    for (const row of appResult) {
      console.log(`  ${(row.application_name || '(unset)').padEnd(30)} ${row.count.toString()}`);
    }

    console.log('\n══════════════════════════════════════════════');
    console.log('  Diagnostics Complete');
    console.log('══════════════════════════════════════════════\n');
  } catch (err) {
    console.error('Diagnostics failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runDiagnostics();
