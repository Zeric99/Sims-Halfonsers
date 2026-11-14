import {database, hasDatabase} from '../simulation/database.js';
import { normalizePhrase } from '../simulation/phrases.js';
import {ensureFillers,readSpeechCatalog} from '../simulation/phrase-database.js';
let initialized;

export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(!['GET','POST'].includes(req.method)){res.setHeader('Allow','GET, POST');return res.status(405).json({error:'Método no permitido'})}
 if(!hasDatabase())return res.status(503).json({error:'Frases no disponibles'});
 let phrase;
 if(req.method==='POST'){
  let body;try{body=typeof req.body==='string'?JSON.parse(req.body):req.body}catch{return res.status(400).json({error:'Datos inválidos'})}
  phrase=normalizePhrase(body);if(!phrase)return res.status(400).json({error:'Máximo 100 caracteres para frases y 40 para muletillas.'});
 }
 try{
  const sql=database();
  initialized ??= (async()=>{
   await sql`CREATE TABLE IF NOT EXISTS sims_phrases (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, person_id text NOT NULL, text text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(person_id,text))`;
   await ensureFillers(sql);
  })().catch(error=>{initialized=undefined;throw error;});
  await initialized;
  if(req.method==='GET'){
   const resident=req.query?.resident ?? null;
   if(resident!==null&&(typeof resident!=='string'||!/^mii-(?:[1-9]|1[0-4])$/.test(resident)))
    return res.status(400).json({error:'Vecino inválido'});
   const rows=await readSpeechCatalog(sql,resident);
   return res.status(200).json({phrases:rows});
  }
  const rows=phrase.kind==='filler'
   ?await sql`INSERT INTO sims_fillers(person_id,text) SELECT ${phrase.personId},${phrase.text} WHERE (SELECT count(*) FROM sims_fillers WHERE person_id=${phrase.personId})<20 ON CONFLICT (person_id,text) DO NOTHING RETURNING id::text AS id,person_id AS "personId",text,'filler' AS kind`
   :await sql`INSERT INTO sims_phrases(person_id,text) SELECT ${phrase.personId},${phrase.text} WHERE (SELECT count(*) FROM sims_phrases WHERE person_id=${phrase.personId})<50 ON CONFLICT (person_id,text) DO NOTHING RETURNING id::text AS id,person_id AS "personId",text`;
  if(!rows.length)return res.status(409).json({error:phrase.kind==='filler'?'La muletilla ya existe o este vecino tiene 20.':'La frase ya existe o este personaje tiene 50 frases.'});
  return res.status(201).json({phrase:rows[0]});
 }catch(error){console.error('phrase storage error',error?.name);return res.status(503).json({error:'No se pudieron guardar o cargar las frases'})}
}
