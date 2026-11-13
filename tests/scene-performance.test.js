import test from 'node:test';
import assert from 'node:assert/strict';
import {qaScenario} from '../simulation/qa-scenarios.js';
import {conversationGesture,cookingStage,placeSpeech} from '../simulation/scene-performance.js';
import {applyFiller,fillerForConversation,normalizePhrase} from '../simulation/phrases.js';
import {conversationMessages} from '../simulation/speech.js';

test('las bromas cambian el gesto de quien escucha según cómo se lo toma',()=>{
 for(const [scene,expected] of [['laugh','laugh'],['offended','offended'],['repair','explain']]){
  const {world,serverTime}=qaScenario('spectator',scene);
  const c=Object.values(world.conversations)[0],[speaker,listener]=c.participants;
  assert.equal(conversationGesture(c,listener,serverTime),expected);
  assert.equal(conversationGesture(c,speaker,serverTime),scene==='laugh'?'laugh':'listenCareful');
  assert.equal(conversationGesture(c,listener,c.end),null);
 }
});

test('el plan de cocina muestra ingredientes, sartén y platos en orden',()=>{
 for(const [scene,stage] of [['prep','prep'],['stove','cook'],['serve','serve']]){
  const {world,serverTime}=qaScenario('spectator',scene);
  const c=Object.values(world.conversations).find(c=>c.planId);
  assert.equal(cookingStage(c,world.people.find(p=>p.id===c.participants[0]).action,null,serverTime),stage);
 }
});

test('los bocadillos no cubren las caras si existe un sitio libre',()=>{
 const heads=[{x:135,y:90,w:25,h:28},{x:165,y:93,w:25,h:28}];
 const box=placeSpeech({x:163,y:92,w:185,h:100,width:345,height:340,heads});
 assert.ok(box.x>=7&&box.y>=7&&box.x+box.w<=338&&box.y+box.h<=333);
 for(const h of heads)assert.ok(box.x>=h.x+h.w||box.x+box.w<=h.x||box.y>=h.y+h.h||box.y+box.h<=h.y);
});

test('la muletilla se conserva en el mismo turno y puede ir antes o después',()=>{
 const {world}=qaScenario('spectator','prank'),c=Object.values(world.conversations)[0];
 const [personId]=c.participants;
 const entry=normalizePhrase({personId,text:' en plan ',kind:'filler'});
 assert.equal(entry.text,'en plan');
 assert.equal(normalizePhrase({...entry,text:'x'.repeat(41)}),null);
 const variants=new Set();
 for(let i=0;i<24;i++){
  const conversation={...c,id:'ejemplo-'+i};
  const filler=fillerForConversation(conversation,personId,[entry]);
  variants.add(filler?.position??'none');
  if(!filler)continue;
  conversation.fillers={[personId]:filler};
  const now=conversation.start+16*60000;
  const messages=conversationMessages(conversation,now,0);
  assert.match(messages[0].text,/en plan/i);
  assert.ok(messages.slice(1).every(m=>!/en plan/i.test(m.text)));
 }
 assert.deepEqual(variants,new Set(['none','prefix','suffix']));
 assert.equal(applyFiller('¿Vienes?',{text:'bro',position:'suffix',turn:0},0),'¿Vienes, bro?');
});
