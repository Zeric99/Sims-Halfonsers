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
 assert.ok(world.events.some(e=>e.type==='conversation_finished'));
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

test('un acuerdo se cumple solo al liberar el recurso',async()=>{
 const {recordKitchenWait,attemptKitchenRepair,releaseKitchen}=await import('../simulation/conflicts.js');
 const world=createWorld({now:0}),[a,b]=world.people;
 const c=recordKitchenWait(world,a,b,0);assert.ok(c);
 const tension=a.relationships[b.id].tension;
 assert.equal(attemptKitchenRepair(world,{finished:true,participants:[a.id,b.id]},3600000,0),true);
 assert.equal(c.state,'repair_pending');assert.equal(a.relationships[b.id].tension,tension);
 releaseKitchen(world,b,7200000);assert.equal(c.state,'resolved');assert.ok(a.relationships[b.id].tension<tension);
});
test('una propuesta romántica requiere reciprocidad',async()=>{
 const {proposeRelationship,respondToProposal}=await import('../simulation/romance.js');
 const world=createWorld({now:0}),[a,b]=world.people;a.profile.romanceEnabled=b.profile.romanceEnabled=true;a.profile.romancePartners=[b.id];b.profile.romancePartners=[a.id];
 a.position={x:0,z:0};b.position={x:1,z:0};
 a.relationships[b.id]={romanticInterest:80,familiarity:30};
 b.relationships[a.id]={romanticInterest:0,familiarity:30};
 const offer=proposeRelationship(world,a,b,0);assert.ok(offer);
 assert.equal(respondToProposal(world,offer.id,b.id,true,1),false);
 b.relationships[a.id].romanticInterest=80;
 assert.equal(respondToProposal(world,offer.id,b.id,true,2),true);
 assert.equal(respondToProposal(world,offer.id,b.id,true,3),false);
});

test('la experiencia cambia preferencias de forma gradual y acotada',async()=>{
 const {recordExperience}=await import('../simulation/learning.js');
 const person={learned:{skills:{},preferences:{}}};
 recordExperience(person,{activity:'jugar',skill:'juegos',minutes:60,reward:1});
 assert.equal(person.learned.preferences.jugar,.05);assert.ok(person.learned.skills.juegos>0);
 for(let i=0;i<500;i++)recordExperience(person,{activity:'jugar',skill:'juegos',minutes:60,reward:1});
 assert.ok(person.learned.preferences.jugar<=1);assert.ok(person.learned.skills.juegos<=100);
});
test('el cuestionario invierte valores y conserva respuestas omitidas',async()=>{
 const {profileFromAnswers}=await import('../simulation/profiles.js');
 const p=profileFromAnswers({prefiereSoledad:5},{traits:{orden:.7}});
 assert.equal(p.traits.privacidad,1);assert.equal(p.traits.sociabilidad,0);assert.equal(p.traits.orden,.7);
 assert.throws(()=>profileFromAnswers({prefiereSoledad:6}),RangeError);
});
