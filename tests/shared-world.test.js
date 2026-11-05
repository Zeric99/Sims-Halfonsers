import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../simulation/world.js';
import { advanceSharedWorld } from '../simulation/shared-world.js';

function store(initial){
 let state=JSON.parse(JSON.stringify(initial)),version=0;
 return {
  read:async()=>({version,state:JSON.parse(JSON.stringify(state))}),
  write:async(expected,next)=>{if(expected!==version)return false;state=JSON.parse(JSON.stringify(next));version++;return true},
  snapshot:()=>({version,state:JSON.parse(JSON.stringify(state))})
 };
}
test('dos visitas simultáneas reintentan sin perder ni duplicar cambios',async()=>{
 const wall=1700000000000,game=Date.UTC(2026,0,1,7),initial=createWorld({seed:42,now:game});
 initial.simulationClock={realAnchor:wall-1000,gameAnchor:game,rate:48};initial.lastObservedAt=wall-1000;
 const db=store(initial),sequential=store(initial);let firstReads=0,release;
 const gate=new Promise(resolve=>{release=resolve});
 const read=async()=>{const row=await db.read();if(++firstReads<=2){if(firstReads===2)release();await gate}return row};
 const params={read,write:db.write,now:()=>wall};
 const results=await Promise.all([advanceSharedWorld(params),advanceSharedWorld(params)]);
 assert.ok(results.every(Boolean));assert.ok(firstReads>=3);assert.equal(db.snapshot().version,2);
 await advanceSharedWorld({read:sequential.read,write:sequential.write,now:()=>wall});
 await advanceSharedWorld({read:sequential.read,write:sequential.write,now:()=>wall});
 assert.deepEqual(db.snapshot().state,sequential.snapshot().state);
 const events=db.snapshot().state.events.map(e=>e.id);assert.equal(new Set(events).size,events.length);
});
test('si se agotan los reintentos no se informa de una escritura exitosa',async()=>{
 const initial=createWorld({now:Date.UTC(2026,0,1,7)});let writes=0;
 const result=await advanceSharedWorld({read:async()=>({version:0,state:structuredClone(initial)}),write:async()=>{writes++;return false},now:()=>1000,maxAttempts:3});
 assert.equal(result,null);assert.equal(writes,3);
});
test('el estado serializado se recupera al recrear el cliente',async()=>{
 const wall=1700000000000,game=Date.UTC(2026,0,1,7),initial=createWorld({seed:13,now:game});
 initial.simulationClock={realAnchor:wall,gameAnchor:game,rate:48};initial.lastObservedAt=wall;
 const db=store(initial);await advanceSharedWorld({read:db.read,write:db.write,now:()=>wall+1000});
 const saved=db.snapshot().state,clientAfterRestart=store(saved);
 const resumed=await advanceSharedWorld({read:clientAfterRestart.read,write:clientAfterRestart.write,now:()=>wall+2000});
 assert.ok(resumed.world.lastSimulatedAt>=saved.lastSimulatedAt);
 for(const e of saved.events)assert.ok(resumed.world.events.some(x=>x.id===e.id));
});
