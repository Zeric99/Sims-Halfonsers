import {database, hasDatabase, logDatabaseError, usesManagedPostgres, writeChat} from '../simulation/database.js';
import { normalizeChatMessage } from '../simulation/chat-validation.js';
let initialized;

export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(!['GET','POST'].includes(req.method)){res.setHeader('Allow','GET, POST');return res.status(405).json({error:'Método no permitido'})}
 if(!hasDatabase())return res.status(503).json({error:'Chat no disponible'});
 try{
  const sql=database();
  if (!usesManagedPostgres()) {
   initialized ??= sql`CREATE TABLE IF NOT EXISTS sims_chat (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name text NOT NULL, message text NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`.catch(error => { initialized=undefined; throw error; });
   await initialized;
  }
  if(req.method==='GET'){
   const after=req.query?.after ?? '0';
   if(typeof after!=='string'||!/^\d{1,19}$/.test(after)||BigInt(after)>9223372036854775807n)
    return res.status(400).json({error:'Cursor inválido'});
   const rows=await sql`SELECT id::text AS id,name,message,created_at FROM (
    SELECT id,name,message,created_at FROM sims_chat WHERE id>${after}::bigint ORDER BY id DESC LIMIT 100
   ) recent ORDER BY recent.id ASC`;
   return res.status(200).json({messages:rows});
  }
  let body;try{body=typeof req.body==='string'?JSON.parse(req.body):req.body}catch{return res.status(400).json({error:'Mensaje inválido'})}
  const normalized=normalizeChatMessage(body);
  if(!normalized)return res.status(400).json({error:'Escribe un nombre y un mensaje válidos'});
  const {name,message}=normalized;
  const rows=await writeChat(sql, transaction=>transaction`INSERT INTO sims_chat(name,message) SELECT ${name},${message} WHERE (SELECT count(*) FROM sims_chat WHERE lower(name)=lower(${name}) AND created_at>now()-interval '1 minute')<8 RETURNING id::text AS id,name,message,created_at`);
  if(!rows.length)return res.status(429).json({error:'Espera un momento antes de enviar más mensajes'});
  return res.status(201).json({message:rows[0]});
 }catch(error){logDatabaseError('chat',error);return res.status(503).json({error:'No se pudo conectar con el chat'})}
}
