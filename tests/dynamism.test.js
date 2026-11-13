import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,advanceWorld} from '../simulation/world.js';
import {conversationGesture} from '../simulation/scene-performance.js';
import {DAY_RATE} from '../simulation/clock.js';
test('tres ensayos diurnos tienen charlas frecuentes y visitas al baño',()=>{
 for(const seed of [12,73184,400]){
  const start=Date.UTC(2026,0,1,10),w=createWorld({now:start,seed});let silent=0,maxSilent=0,bath=new Set(),talks=new Set();
  for(let m=1;m<=360;m++){
   advanceWorld(w,start+m*60000);
   silent=w.people.some(p=>p.action?.conversationId||p.action?.groupId)?0:silent+1;maxSilent=Math.max(silent,maxSilent);
   for(const e of w.events){if(e.type==='action_started'&&e.action==='usar_bano')bath.add(e.id);if(e.type==='conversation_started')talks.add(e.id)}
  }
  assert.ok(maxSilent*60/DAY_RATE<90,'silencio diurno excesivo');
  assert.ok(talks.size>=10,'faltan conversaciones');assert.ok(bath.size>=5,'faltan visitas al baño');
 }
});
test('saludan al empezar, luego conversan y no saludan en una reparación o plan',()=>{
 const c={start:0,end:24*60000,participants:['a','b'],story:'catch_up'};
 assert.equal(conversationGesture(c,'a',1000),'greet');assert.equal(conversationGesture(c,'b',1000),'greet');
 assert.equal(conversationGesture(c,'a',3*1000*DAY_RATE),'talk');
 assert.equal(conversationGesture({...c,story:'repair'},'a',1000),'explain');
 assert.equal(conversationGesture({...c,planId:'plan'},'a',1000),'talk');
});
