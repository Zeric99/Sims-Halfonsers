import { neon } from '@neondatabase/serverless';
import { createWorld } from '../simulation/world.js';
import { advanceSharedWorld } from '../simulation/shared-world.js';
import {ensureFillers,readSpeechCatalog} from '../simulation/phrase-database.js';

export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Método no permitido'})}
 if(!process.env.DATABASE_URL)return res.status(503).json({error:'Base de datos no configurada'});
 try{
  const sql=neon(process.env.DATABASE_URL);
  await sql`CREATE TABLE IF NOT EXISTS sims_worlds (id text PRIMARY KEY, version bigint NOT NULL, state jsonb NOT NULL)`;
  await sql`CREATE TABLE IF NOT EXISTS sims_phrases (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, person_id text NOT NULL, text text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(person_id,text))`;
  await ensureFillers(sql);
  const initial=createWorld({now:Date.now(),seed:73184});
  await sql`INSERT INTO sims_worlds(id,version,state) VALUES ('casa',0,${JSON.stringify(initial)}::jsonb) ON CONFLICT (id) DO NOTHING`;
  const result=await advanceSharedWorld({
   read:async()=>{const [rows,phrases]=await Promise.all([sql`SELECT version,state FROM sims_worlds WHERE id='casa'`,readSpeechCatalog(sql)]);if(rows[0])rows[0].state.phraseCatalog=phrases;return rows[0]},
   write:async(version,world)=>{const updated=await sql`UPDATE sims_worlds SET version=version+1,state=${JSON.stringify(world)}::jsonb WHERE id='casa' AND version=${version} RETURNING version`;return updated.length>0}
  });
  if(result)return res.status(200).json(result);
  return res.status(503).json({error:'El mundo está ocupado; vuelve a intentarlo'});
 }catch(error){console.error('world storage error',error?.name);return res.status(503).json({error:'No se pudo cargar el mundo compartido'})}
}
