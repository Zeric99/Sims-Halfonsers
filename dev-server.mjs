// Servidor de pruebas: mundo persistente y compartido entre pestañas.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { createWorld } from './simulation/world.js';
import {createWorldFeed} from './simulation/world-feed.js';
import { advanceSharedWorld } from './simulation/shared-world.js';
import { normalizeChatMessage } from './simulation/chat-validation.js';
import { localWorldStore } from './simulation/local-world-store.js';
import {qaScenario} from './simulation/qa-scenarios.js';
import { applyQuestionnaire } from './simulation/resident-state.js';
import { normalizePhrase } from './simulation/phrases.js';
const base=resolve('.'),started=Date.now(),dataDir=resolve(process.env.SIMS_DATA_DIR||resolve(base,'.local-data'));
// Mismo protocolo de versiones que el servicio remoto; solo para ensayo local.
const localStore=await localWorldStore(resolve(dataDir,'world.json'),createWorld({seed:73184,now:started}));
const chat=[];let chatSequence=0;
const phraseStore=await localWorldStore(resolve(dataDir,'speech-catalog.json'),[]);
const loadWorld=()=>advanceSharedWorld({
 read:async()=>{const row=await localStore.read();row.state.phraseCatalog=(await phraseStore.read()).state;return row},
 write:localStore.write
});
const localFeed=createWorldFeed(loadWorld);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.css':'text/css; charset=utf-8'};
http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1');
  if(url.pathname==='/api/qa-world'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});return res.end(JSON.stringify(qaScenario(url.searchParams.get('qa')||'meal',url.searchParams.get('phase')||'eating')))}
  if(url.pathname==='/api/world'){
   const params=Object.fromEntries(url.searchParams);
   const data=await (params.feed==='1'||params.resident ? localFeed(params) : loadWorld());
   if(!data){res.writeHead(503,{'Content-Type':'application/json'});return res.end(JSON.stringify({error:'Mundo ocupado'}))}
   res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});
   return res.end(JSON.stringify(data.world||data.delta?{...data,mode:'prueba_local'}:data));
  }
  if(url.pathname==='/api/local-profile'){
   const reply=(status,body)=>{
    res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});
    return res.end(JSON.stringify(body));
   };
   if(req.method!=='POST')return reply(405,{error:'Método no permitido'});
   const address=':'+req.socket.localPort;
   const origins=['http://127.0.0.1'+address,'http://localhost'+address];
   if(!origins.includes(req.headers.origin))return reply(403,{error:'Abre el editor desde la partida local.'});
   if(req.headers['content-type']?.split(';')[0]!=='application/json')
    return reply(415,{error:'Se esperaba un formulario JSON.'});
   let raw='';
   for await(const chunk of req){
    raw+=chunk;
    if(Buffer.byteLength(raw)>4096)return reply(413,{error:'Formulario demasiado largo.'});
   }
   let body;
   try{body=JSON.parse(raw)}catch{return reply(400,{error:'Formulario inválido.'})}
   if(typeof body?.personId!=='string'||!Number.isSafeInteger(body.revision)||body.revision<0
    ||!body.answers||!Object.values(body.answers).some(value=>value!=null))
    return reply(400,{error:'Responde al menos una pregunta.'});
   for(let attempt=0;attempt<5;attempt++){
    const {version,state}=await localStore.read();
    const person=state.people.find(candidate=>candidate.id===body.personId);
    if(!person)return reply(404,{error:'No se encontró al vecino.'});
    const revision=person.profileRevision??0;
    if(body.revision!==revision)return reply(409,{error:'Este perfil cambió en otra pestaña. Cierra el editor y vuelve a abrirlo.'});
    try{applyQuestionnaire(person,{version:body.version,answers:body.answers})}
    catch(error){
     if(error instanceof TypeError||error instanceof RangeError)return reply(400,{error:error.message});
     throw error;
    }
    person.profileRevision=revision+1;
    state.worldVersion++;
    if(await localStore.write(version,state)){
     return reply(200,{profile:person.profile,revision:person.profileRevision});
    }
   }
   return reply(503,{error:'La partida está ocupada. Vuelve a intentar guardar.'});
  }
  if(url.pathname==='/api/phrases'){
   const reply=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body))};
   if(req.method==='GET')return reply(200,{phrases:(await phraseStore.read()).state.filter(phrase=>!url.searchParams.has('resident')||phrase.personId===url.searchParams.get('resident')),mode:'prueba_local'});
   if(req.method!=='POST')return reply(405,{error:'Método no permitido'});
   let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>4096)return reply(413,{error:'Mensaje demasiado largo'})}
   let body;try{body=JSON.parse(raw)}catch{return reply(400,{error:'Datos inválidos'})}
   const phrase=normalizePhrase(body);if(!phrase)return reply(400,{error:'Máximo 100 caracteres para frases y 40 para muletillas.'});
   for(let attempt=0;attempt<5;attempt++){
    const {version,state}=await phraseStore.read();
    const entries=state.filter(p=>p.personId===phrase.personId&&p.kind===phrase.kind);
    if(entries.length>=(phrase.kind==='filler'?20:50)||entries.some(p=>p.text===phrase.text))
     return reply(409,{error:'Ya está guardada o se alcanzó el límite de este tipo.'});
    const entry={id:String(version+1),...phrase};
    if(await phraseStore.write(version,[...state,entry]))return reply(201,{phrase:entry});
   }
   return reply(503,{error:'El catálogo está ocupado. Vuelve a intentarlo.'});
  }
  if(url.pathname==='/api/chat'){
   const reply=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body))};
   if(req.method==='GET')return reply(200,{messages:chat.filter(message=>Number(message.id)>Number(url.searchParams.get('after')||0)).slice(-100),mode:'prueba_local_temporal'});
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
