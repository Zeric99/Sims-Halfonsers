// Servidor de pruebas local: estado temporal compartido entre pestañas.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { createWorld } from './simulation/world.js';
import { advanceSharedWorld } from './simulation/shared-world.js';
import { normalizeChatMessage } from './simulation/chat-validation.js';
import { normalizePhrase } from './simulation/phrases.js';
const base=resolve('.'),started=Date.now();
// Mismo protocolo que el servicio remoto, con almacenamiento temporal en memoria.
let state=createWorld({seed:73184,now:started}),version=0;
const chat=[];let chatSequence=0;
const phrases=[];let phraseSequence=0;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.css':'text/css; charset=utf-8'};
http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1');
  if(url.pathname==='/api/world'){
   const data=await advanceSharedWorld({
    read:async()=>({version,state:{...structuredClone(state),phraseCatalog:structuredClone(phrases)}}),
    write:async(expected,next)=>{if(version!==expected)return false;state=structuredClone(next);version++;return true}
   });
   if(!data){res.writeHead(503,{'Content-Type':'application/json'});return res.end(JSON.stringify({error:'Mundo ocupado'}))}
   res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});
   return res.end(JSON.stringify({...data,mode:'prueba_local'}));
  }
  if(url.pathname==='/api/phrases'){
   const reply=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body))};
   if(req.method==='GET')return reply(200,{phrases,mode:'prueba_local_temporal'});
   if(req.method!=='POST')return reply(405,{error:'Método no permitido'});
   let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>4096)return reply(413,{error:'Mensaje demasiado largo'})}
   let body;try{body=JSON.parse(raw)}catch{return reply(400,{error:'Datos inválidos'})}
   const phrase=normalizePhrase(body);if(!phrase)return reply(400,{error:'Escribe una frase de hasta 100 caracteres para un personaje válido.'});
   if(phrases.filter(p=>p.personId===phrase.personId).length>=50||phrases.some(p=>p.personId===phrase.personId&&p.text===phrase.text))return reply(409,{error:'La frase ya existe o este personaje tiene 50 frases.'});
   const entry={id:String(++phraseSequence),...phrase};phrases.push(entry);return reply(201,{phrase:entry});
  }
  if(url.pathname==='/api/chat'){
   const reply=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body))};
   if(req.method==='GET')return reply(200,{messages:chat.slice(-100),mode:'prueba_local_temporal'});
   if(req.method!=='POST')return reply(405,{error:'Método no permitido'});
   let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>4096)return reply(413,{error:'Mensaje demasiado largo'})}
   let body;try{body=JSON.parse(raw)}catch{return reply(400,{error:'Mensaje inválido'})}
   const normalized=normalizeChatMessage(body);if(!normalized)return reply(400,{error:'Escribe un nombre y un mensaje válidos'});
   const now=Date.now();if(chat.filter(m=>m.name.toLowerCase()===normalized.name.toLowerCase()&&now-Date.parse(m.created_at)<60000).length>=8)return reply(429,{error:'Espera un momento antes de enviar más mensajes'});
   const message={id:String(++chatSequence),...normalized,created_at:new Date(now).toISOString()};chat.push(message);
   return reply(201,{message});
  }
  const path=resolve(base,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!path.startsWith(base+sep)||path.includes(sep+'.git'+sep)){res.writeHead(403);return res.end()}
  const data=await readFile(path);res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream'});res.end(data);
 }catch{res.writeHead(404);res.end('No encontrado')}
}).listen(8766,'127.0.0.1',()=>console.log('Prueba local: http://127.0.0.1:8766'));
