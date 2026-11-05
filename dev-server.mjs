// Servidor de pruebas local: estado temporal compartido entre pestañas.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { createWorld, advanceWorld } from './simulation/world.js';
const base=resolve('.'),started=Date.now(),gameStart=Date.UTC(2026,0,1,7);
const world=createWorld({seed:73184,now:gameStart});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.css':'text/css; charset=utf-8'};
http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1');
  if(url.pathname==='/api/world'){
   const serverTime=gameStart+(Date.now()-started)*48;
   advanceWorld(world,Math.max(serverTime,world.lastSimulatedAt));
   res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});
   return res.end(JSON.stringify({world,serverTime,clockRate:48,mode:'prueba_local'}));
  }
  if(url.pathname==='/api/chat'){
   if(req.method!=='GET'){res.writeHead(405,{'Content-Type':'application/json'});return res.end(JSON.stringify({error:'El chat no está disponible en la prueba local'}))}
   res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});
   return res.end(JSON.stringify({messages:[]}));
  }
  const path=resolve(base,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!path.startsWith(base+sep)||path.includes(sep+'.git'+sep)){res.writeHead(403);return res.end()}
  const data=await readFile(path);res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream'});res.end(data);
 }catch{res.writeHead(404);res.end('No encontrado')}
}).listen(8766,'127.0.0.1',()=>console.log('Prueba local: http://127.0.0.1:8766'));
