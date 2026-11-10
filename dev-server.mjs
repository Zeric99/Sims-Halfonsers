// Servidor de pruebas: mundo persistente y compartido entre pestañas.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { createWorld } from './simulation/world.js';
import { advanceSharedWorld } from './simulation/shared-world.js';
import { normalizeChatMessage } from './simulation/chat-validation.js';
import { localWorldStore } from './simulation/local-world-store.js';
import {qaScenario} from './simulation/qa-scenarios.js';
import { normalizePhrase } from './simulation/phrases.js';
const base=resolve('.'),started=Date.now(),dataDir=resolve(process.env.SIMS_DATA_DIR||resolve(base,'.local-data'));
// Mismo protocolo de versiones que el servicio remoto; solo para ensayo local.
const localStore=await localWorldStore(resolve(dataDir,'world.json'),createWorld({seed:73184,now:started}));
const chat=[];let chatSequence=0;
const phrases=[];let phraseSequence=0;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.css':'text/css; charset=utf-8'};
http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1');
  if(url.pathname==='/api/qa-world'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});return res.end(JSON.stringify(qaScenario(url.searchParams.get('qa')||'meal',url.searchParams.get('phase')||'eating')))}
  if(url.pathname==='/api/world'){
   const data=await advanceSharedWorld({
    read:async()=>{const row=await localStore.read();row.state.phraseCatalog=structuredClone(phrases);return row},
    write:localStore.write
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
  if(!path.startsWith(base+sep)||path.split(sep).some(part=>part.startsWith('.'))){res.writeHead(403);return res.end()}
  const data=await readFile(path);res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream'});res.end(data);
 }catch(error){const api=req.url.startsWith('/api/');res.writeHead(api?503:404,{'Content-Type':api?'application/json':'text/plain'});res.end(api?JSON.stringify({error:'No se pudo cargar el servicio local'}):'No encontrado')}
}).listen(Number(process.env.SIMS_PORT)||8766,'127.0.0.1',function(){console.log('Prueba local: http://127.0.0.1:'+this.address().port)});
