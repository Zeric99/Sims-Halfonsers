import {neon} from '@neondatabase/serverless';
import postgres from 'postgres';

let client;

function postgresUrl() {
 return process.env.SIMS_POSTGRES_URL || process.env.SIIMS_POSTGRES_URL;
}

export function hasDatabase() {
 return Boolean(postgresUrl() || process.env.DATABASE_URL);
}

export function database() {
 if (!client) {
  // Opt in only after the destination has been populated and verified.
  const url = postgresUrl();
  client = url
   ? postgres(url, {prepare:false, ssl:'verify-full', max:2, idle_timeout:20})
   : neon(process.env.DATABASE_URL);
 }
 return client;
}

export async function writeChat(sql, insert) {
 if (typeof sql.begin === 'function') {
  return sql.begin(async transaction => {
   await transaction`SELECT pg_advisory_xact_lock(18561, 1)`;
   return insert(transaction);
  });
 }
 const [, rows] = await sql.transaction([
  sql`SELECT pg_advisory_xact_lock(18561, 1)`,
  insert(sql)
 ]);
 return rows;
}
