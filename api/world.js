import { neon } from '@neondatabase/serverless';
import { createWorld, advanceWorld } from '../simulation/world.js';

export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Método no permitido'})}
 if(!process.env.DATABASE_URL)return res.status(503).json({error:'Base de datos no configurada'});
 try{
  const sql=neon(process.env.DATABASE_URL);
  await sql`CREATE TABLE IF NOT EXISTS sims_worlds (id text PRIMARY KEY, version bigint NOT NULL, state jsonb NOT NULL)`;
  const initial=createWorld({now:Date.now(),seed:73184});
  await sql`INSERT INTO sims_worlds(id,version,state) VALUES ('casa',0,${JSON.stringify(initial)}::jsonb) ON CONFLICT (id) DO NOTHING`;
  for(let attempt=0;attempt<5;attempt++){
   const rows=await sql`SELECT version,state FROM sims_worlds WHERE id='casa'`;
   const row=rows[0], world=row.state, target=Date.now();
   const result=advanceWorld(world,Math.max(target,world.lastSimulatedAt),{maxMinutes:2880});
   const updated=await sql`UPDATE sims_worlds SET version=version+1,state=${JSON.stringify(result.world)}::jsonb WHERE id='casa' AND version=${row.version} RETURNING version`;
   if(updated.length)return res.status(200).json({world:result.world,recovering:!result.complete,serverTime:target,mode:'recuperacion_al_consultar'});
  }
  return res.status(503).json({error:'El mundo está ocupado; vuelve a intentarlo'});
 }catch(error){console.error('world storage error',error?.name);return res.status(503).json({error:'No se pudo cargar el mundo compartido'})}
}
