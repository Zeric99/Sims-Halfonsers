export async function ensureFillers(sql){
 await sql`CREATE TABLE IF NOT EXISTS sims_fillers (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, person_id text NOT NULL, text text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(person_id,text))`;
}
export function readSpeechCatalog(sql, resident=null){
 return sql`SELECT id::text AS id,person_id AS "personId",text,kind FROM (
 SELECT id,person_id,text,'phrase' AS kind FROM sims_phrases
 UNION ALL SELECT id,person_id,text,'filler' FROM sims_fillers
 ) AS catalog WHERE ${resident}::text IS NULL OR person_id=${resident} ORDER BY kind,catalog.id`;
}
