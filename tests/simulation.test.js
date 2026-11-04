import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, advanceWorld, resumeAfterAbsence } from '../simulation/world.js';
import { openConversation, finishConversation } from '../simulation/social.js';
const hour=3600000;
test('un ciclo simulado conserva diversidad y limita la lectura',()=>{
 const start=Date.UTC(2026,0,1,7),world=createWorld({seed:19,now:start});
 const kinds=new Set();
 for(let i=0;i<30;i++){
  advanceWorld(world,start+(i+1)*48*60000);
  assert.ok(world.people.filter(p=>p.action?.id==='leer').length<=2);
  for(const p of world.people){kinds.add(p.action?.id);for(const value of Object.values(p.needs))assert.ok(value>=0&&value<=100)}
 }
 assert.ok(kinds.size>=5);
 assert.ok(kinds.has('charlar'));
});
test('ausencia conserva relaciones y no crea eventos',()=>{
 const world=createWorld({seed:3,now:0});advanceWorld(world,hour);
 world.people[0].relationships['mii-2']={friendship:12};
 world.lastObservedAt=1000;const count=world.eventSequence;
 assert.equal(resumeAfterAbsence(world,100*hour,{wallNow:200000}),true);
 assert.equal(world.eventSequence,count);
 assert.equal(world.people[0].relationships['mii-2'].friendship,12);
 assert.ok(world.people.every(p=>p.action===null&&p.position));
});
test('conversación compartida aplica sus efectos una sola vez',()=>{
 const world=createWorld({now:0});const [a,b]=world.people;
 a.position={x:0,z:0};b.position={x:1,z:0};
 const c=openConversation(world,a,b,0);assert.ok(c);
 assert.equal(a.action.conversationId,b.action.conversationId);
 assert.equal(finishConversation(world,c.id,480000),true);
 const value=a.relationships[b.id].friendship;
 assert.equal(finishConversation(world,c.id,480000),false);
 assert.equal(a.relationships[b.id].friendship,value);
});
test('misma semilla y reloj producen el mismo mundo',()=>{
 const a=createWorld({seed:42,now:0}),b=createWorld({seed:42,now:0});
 advanceWorld(a,hour);advanceWorld(b,hour);assert.deepEqual(a,b);
});
