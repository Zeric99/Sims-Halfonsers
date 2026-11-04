import { neon } from '@neondatabase/serverless';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(!['GET','POST'].includes(req.method)){res.setHeader('Allow','GET, POST');return res.status(405).json({error:'Método no permitido'})}
 if(!process.env.DATABASE_URL)return res.status(503).json({error:'Chat no disponible'});
 try{
  const sql=neon(process.env.DATABASE_URL);
  await sql`CREATE TABLE IF NOT EXISTS sims_chat (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name text NOT NULL, message text NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`;
  if(req.method==='GET'){
   const rows=await sql`SELECT id::text AS id,name,message,created_at FROM (SELECT id,name,message,created_at FROM sims_chat ORDER BY id DESC LIMIT 100) recent ORDER BY id ASC`;
   return res.status(200).json({messages:rows});
  }
  const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
  if(!body||typeof body.name!=='string'||typeof body.message!=='string')return res.status(400).json({error:'Escribe un nombre y un mensaje'});
  const name=body.name.trim().replace(/[\u0000-\u001f\u007f]/g,' '),message=body.message.trim().replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'');
  if(!name||name.length>32||!message||message.length>500)return res.status(400).json({error:'Nombre o mensaje fuera de los límites'});
  const rows=await sql`INSERT INTO sims_chat(name,message) SELECT ${name},${message} WHERE (SELECT count(*) FROM sims_chat WHERE lower(name)=lower(${name}) AND created_at>now()-interval '1 minute')<8 RETURNING id::text AS id,name,message,created_at`;
  if(!rows.length)return res.status(429).json({error:'Espera un momento antes de enviar más mensajes'});
  return res.status(201).json({message:rows[0]});
 }catch(error){console.error('chat error',error?.name);return res.status(503).json({error:'No se pudo conectar con el chat'})}
}
