import { neon } from '@neondatabase/serverless';
import { normalizePhrase } from '../simulation/phrases.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(!['GET','POST'].includes(req.method)){res.setHeader('Allow','GET, POST');return res.status(405).json({error:'Método no permitido'})}
 if(!process.env.DATABASE_URL)return res.status(503).json({error:'Frases no disponibles'});
 let phrase;
 if(req.method==='POST'){
  let body;try{body=typeof req.body==='string'?JSON.parse(req.body):req.body}catch{return res.status(400).json({error:'Datos inválidos'})}
  phrase=normalizePhrase(body);if(!phrase)return res.status(400).json({error:'Escribe una frase de hasta 100 caracteres para un personaje válido.'});
 }
 try{
  const sql=neon(process.env.DATABASE_URL);
  await sql`CREATE TABLE IF NOT EXISTS sims_phrases (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, person_id text NOT NULL, text text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(person_id,text))`;
  if(req.method==='GET'){
   const rows=await sql`SELECT id::text AS id,person_id AS "personId",text FROM sims_phrases ORDER BY id ASC`;
   return res.status(200).json({phrases:rows});
  }
  const rows=await sql`INSERT INTO sims_phrases(person_id,text) SELECT ${phrase.personId},${phrase.text} WHERE (SELECT count(*) FROM sims_phrases WHERE person_id=${phrase.personId})<50 ON CONFLICT (person_id,text) DO NOTHING RETURNING id::text AS id,person_id AS "personId",text`;
  if(!rows.length)return res.status(409).json({error:'La frase ya existe o este personaje tiene 50 frases.'});
  return res.status(201).json({phrase:rows[0]});
 }catch(error){console.error('phrase storage error',error?.name);return res.status(503).json({error:'No se pudieron guardar o cargar las frases'})}
}
