import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {applyWorldReading} from '../simulation/world-feed.js';
import {join} from 'node:path';
async function startServer(dir){
 const child=spawn(process.execPath,['dev-server.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,SIMS_PORT:'18769',SIMS_DATA_DIR:dir},stdio:['ignore','pipe','pipe']});
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Servidor sin respuesta')),10000);child.stdout.once('data',()=>{clearTimeout(timer);resolve()});child.once('error',reject);child.once('exit',code=>{clearTimeout(timer);reject(new Error('Servidor terminado: '+code))})});return child;
}
async function stop(child){if(child.exitCode!==null)return;const ended=once(child,'exit');child.kill();await ended}
test('dos clientes HTTP, desconexión y reinicio conservan el mundo local sin duplicar eventos',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'sims-http-'));let server;
 const visit=async()=>{const response=await fetch('http://127.0.0.1:18769/api/world');assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/json/);return response.json()};
 try{
  server=await startServer(dir);const [a,b]=await Promise.all([visit(),visit()]);
  assert.equal(a.world.worldId,b.world.worldId);assert.equal(a.world.randomState,b.world.randomState);
  const base='http://127.0.0.1:18769';
  const read=async path=>{const response=await fetch(base+path);assert.equal(response.status,200);return response.json()};
  const [publicA,publicB]=await Promise.all([read('/api/world?feed=1'),read('/api/world?feed=1')]);
  assert.deepEqual(publicA,publicB);
  assert.ok(!Object.hasOwn(publicA.world.people[0],'relationships'));
  assert.ok(!Object.hasOwn(publicA.world,'phraseCatalog'));
  const {resident}=await read('/api/world?resident='+a.world.people[0].id);
  assert.equal(resident.name,a.world.people[0].name);
  assert.ok(Array.isArray(resident.relationships));
  assert.deepEqual(await read('/api/world?feed=1&since='+publicA.world.worldVersion),{unchanged:publicA.world.worldVersion});
  assert.deepEqual(applyWorldReading(await read('/api/world?feed=1&since=99999')),publicA);

  const postChat=async message=>{
   const response=await fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Prueba',message})});
   assert.equal(response.status,201);
   return (await response.json()).message;
  };
  const first=await postChat('Primero'),second=await postChat('Segundo');
  assert.deepEqual((await read('/api/chat?after='+first.id)).messages,[second]);
  assert.deepEqual((await read('/api/chat?after='+second.id)).messages,[]);
  const endpoint='http://127.0.0.1:18769/api/phrases';
  const entry={personId:a.world.people[0].id,text:'en plan',kind:'filler'};
  const post=()=>fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(entry)});
  const submitted=await Promise.all([post(),post()]);
  assert.deepEqual(submitted.map(r=>r.status).sort(),[201,409]);
  assert.deepEqual((await (await fetch(endpoint)).json()).phrases.map(({id,...p})=>p),[entry]);
  const before=JSON.parse(await readFile(join(dir,'world.json'),'utf8'));await stop(server);
  server=await startServer(dir);const after=await visit();
  assert.deepEqual(after.world.phraseCatalog.map(({id,...p})=>p),[entry]);
  assert.ok(after.world.worldVersion>before.state.worldVersion);
  assert.deepEqual(after.world.people.map(p=>p.id),before.state.people.map(p=>p.id));
  assert.deepEqual(after.world.people.map(p=>p.relationships),before.state.people.map(p=>p.relationships));
  for(const event of before.state.events)assert.ok(after.world.events.some(e=>e.id===event.id));
  assert.equal(new Set(after.world.events.map(e=>e.id)).size,after.world.events.length);
  const recovered=await visit();assert.ok(recovered.world.lastSimulatedAt>=after.world.lastSimulatedAt);
 }finally{if(server)await stop(server);await rm(dir,{recursive:true,force:true})}
});
