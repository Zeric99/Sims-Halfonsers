import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceSharedWorld} from '../simulation/shared-world.js';
import {createWorld} from '../simulation/world.js';
import {applyWorldReading,createWorldFeed} from '../simulation/world-feed.js';

test('el feed comparte una lectura y reconstruye el estado tras cambiar una actividad y rotar el diario',async()=>{
 let time=10000,loads=0;
 const world=createWorld({now:time});
 world.events=Array.from({length:300},(_,index)=>({id:'casa:'+index,at:index,type:'conversation_started',topic:'el día'}));
 const feed=createWorldFeed(async()=>{loads++;return {world,serverTime:time,serverWallTime:time}},()=>time);
 const [a,b]=await Promise.all([feed({feed:'1'}),feed({feed:'1'})]);
 assert.deepEqual(a,b);
 assert.equal(loads,1);
 time+=8000;
 world.worldVersion++;
 world.people[0].action={id:'leer',start:time,until:time+60000};
 world.events.shift();
 world.events.push({id:'casa:300',at:300,type:'conversation_started',topic:'el día'});
 const delta=await feed({feed:'1',since:'0'});
 const full=await feed({feed:'1'});
 assert.ok(delta.delta);
 assert.equal(loads,2);
 assert.deepEqual(JSON.parse(JSON.stringify(applyWorldReading(delta,a))),full);
 assert.equal(applyWorldReading(delta,full),null);
 assert.ok(JSON.stringify(delta).length<JSON.stringify(full).length/10);
});

test('dos instancias concurrentes reutilizan el estado ganador y escriben una sola actualización',async()=>{
 const now=Date.UTC(2026,0,1,10);
 let state=createWorld({now}),version=0,writes=0;
 const visit=()=>advanceSharedWorld({
  read:async()=>({state:structuredClone(state),version}),
  write:async(expected,next)=>{
   if(expected!==version)return false;
   writes++;version++;state=structuredClone(next);return true;
  },
  now:()=>now,minInterval:8000
 });
 const [a,b]=await Promise.all([visit(),visit()]);
 assert.equal(writes,1);
 assert.deepEqual(a.world,b.world);
});
