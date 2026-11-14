import {neon} from '@neondatabase/serverless';
import postgres from 'postgres';
import {readFileSync} from 'node:fs';
import {rootCertificates} from 'node:tls';

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
  const ssl = url && new URL(url).hostname.endsWith('.supabase.com')
   ? {rejectUnauthorized:true, ca:[...rootCertificates, readFileSync(new URL('../certificates/supabase-root.crt', import.meta.url), 'utf8')]}
   : 'verify-full';
  client = url
   ? postgres(url, {prepare:false, ssl, max:2, idle_timeout:20})
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

export function logDatabaseError(operation, error) {
 const code = typeof error?.code === 'string' && /^[A-Z0-9_]{1,50}$/.test(error.code) ? error.code : 'unknown';
 let provider = 'neon';
 if (postgresUrl()) {
  try {
   provider = new URL(postgresUrl()).hostname.endsWith('.supabase.com') ? 'supabase' : 'postgres';
  } catch {
   provider = 'invalid-url';
  }
 }
 console.error('Database operation failed', operation, provider, code);
}
