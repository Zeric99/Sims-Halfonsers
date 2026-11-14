import { neon } from '@neondatabase/serverless';
import { createWorld } from '../simulation/world.js';
import { advanceSharedWorld } from '../simulation/shared-world.js';
import {createWorldFeed,WORLD_REFRESH_MS} from '../simulation/world-feed.js';
import {ensureFillers,readSpeechCatalog} from '../simulation/phrase-database.js';

let initialized;
let savedWorld;
let catalog;
let catalogAt = 0;

const worldFeed = createWorldFeed(async () => {
 const sql = neon(process.env.DATABASE_URL);
 initialized ??= (async () => {
  await sql`CREATE TABLE IF NOT EXISTS sims_worlds (id text PRIMARY KEY, version bigint NOT NULL, state jsonb NOT NULL)`;
  await sql`CREATE TABLE IF NOT EXISTS sims_phrases (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, person_id text NOT NULL, text text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(person_id,text))`;
  await ensureFillers(sql);
  const initial=createWorld({now:Date.now(),seed:73184});
  await sql`INSERT INTO sims_worlds(id,version,state) VALUES ('casa',0,${JSON.stringify(initial)}::jsonb) ON CONFLICT (id) DO NOTHING`;
 })().catch(error => { initialized = undefined; throw error; });
 await initialized;
 return advanceSharedWorld({
  minInterval:WORLD_REFRESH_MS,
  beforeAdvance:async world=>{
   if(!catalog||Date.now()-catalogAt>=30_000){
    catalog=await readSpeechCatalog(sql);
    catalogAt=Date.now();
   }
   world.phraseCatalog=catalog;
  },
  read:async () => {
   if (!savedWorld) {
    const [row] = await sql`SELECT version,state FROM sims_worlds WHERE id='casa'`;
    if (!row) return null;
    savedWorld = {version:row.version, state:row.state};
   }
   return {version:savedWorld.version, state:structuredClone(savedWorld.state)};
  },
  write:async (version, world) => {
   const {phraseCatalog, ...state} = world;
   const previous = savedWorld.state;
   const changes = Object.fromEntries(Object.entries(state).filter(([key, value]) =>
    JSON.stringify(value) !== JSON.stringify(previous[key])
   ));
   const removed = Object.keys(previous).filter(key => !Object.hasOwn(state, key));
   const [updated] = await sql`
    UPDATE sims_worlds SET version=version+1,
     state=(state - ARRAY(SELECT jsonb_array_elements_text(${JSON.stringify(removed)}::jsonb))) || ${JSON.stringify(changes)}::jsonb
    WHERE id='casa' AND version=${version} RETURNING version
   `;
   savedWorld = updated ? {version:updated.version, state} : undefined;
   return Boolean(updated);
  }
 });
});

export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Método no permitido'})}
 if(!process.env.DATABASE_URL)return res.status(503).json({error:'Base de datos no configurada'});
 try{
  const {feed, since, resident} = req.query ?? {};
  if (resident !== undefined && (typeof resident !== 'string' || !/^mii-(?:[1-9]|1[0-4])$/.test(resident))) {
   return res.status(400).json({error:'Vecino inválido'});
  }
  const result = await worldFeed({feed, since, resident});
  if (result && feed === '1' && !resident) {
   const age = result.serverWallTime ? Date.now()-result.serverWallTime : WORLD_REFRESH_MS;
   const seconds = Math.max(1,Math.floor((WORLD_REFRESH_MS-age)/1000));
   res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage='+seconds);
   res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  }
  if(result)return res.status(200).json(result);
  return res.status(503).json({error:'El mundo está ocupado; vuelve a intentarlo'});
 }catch(error){console.error('world storage error',error?.name);return res.status(503).json({error:'No se pudo cargar el mundo compartido'})}
}
