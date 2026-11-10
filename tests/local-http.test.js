import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
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
  const before=JSON.parse(await readFile(join(dir,'world.json'),'utf8'));await stop(server);
  server=await startServer(dir);const after=await visit();
  assert.ok(after.world.worldVersion>before.state.worldVersion);
  assert.deepEqual(after.world.people.map(p=>p.id),before.state.people.map(p=>p.id));
  assert.deepEqual(after.world.people.map(p=>p.relationships),before.state.people.map(p=>p.relationships));
  for(const event of before.state.events)assert.ok(after.world.events.some(e=>e.id===event.id));
  assert.equal(new Set(after.world.events.map(e=>e.id)).size,after.world.events.length);
  const recovered=await visit();assert.ok(recovered.world.lastSimulatedAt>=after.world.lastSimulatedAt);
 }finally{if(server)await stop(server);await rm(dir,{recursive:true,force:true})}
});
