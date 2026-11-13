import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceWorld,resumeAfterAbsence} from '../simulation/world.js';
import {qaScenario} from '../simulation/qa-scenarios.js';
import {groupBeat,groupKinds} from '../simulation/group-events.js';
import {spectatorScene} from '../simulation/spectator.js';
import {conversationMessages} from '../simulation/speech.js';
import {isWalkable} from '../simulation/navigation.js';
import {relation} from '../simulation/relationships.js';

test('las cuatro quedadas llevan a los que aceptan al jardín y dejan un resultado compartido',()=>{
 for(const kind of Object.keys(groupKinds)){
  const {world,serverTime}=qaScenario('group',kind),event=Object.values(world.groupEvents)[0];
  const attendees=world.people.filter(p=>p.action?.groupId===event.id);
  const declined=world.people.find(p=>event.replies[p.id]==='declined');
  assert.equal(attendees.length,4);
  assert.ok(declined&&!event.attending.includes(declined.id));
  assert.equal(groupBeat(event,serverTime).index,1);
  assert.equal(spectatorScene(world,serverTime).id,event.id);
  assert.ok(attendees.every(p=>p.position.z>=15&&isWalkable(p.position.x,p.position.z)));
  for(const [i,a] of attendees.entries())for(const b of attendees.slice(i+1))
   assert.ok(Math.hypot(a.position.x-b.position.x,a.position.z-b.position.z)>=1);
  const dialogue=conversationMessages(event.dialogue,event.end-1,0);
  assert.equal(dialogue.length,6);assert.equal(new Set(dialogue.map(m=>m.speaker)).size,4);
  const before=structuredClone(declined.relationships);
  advanceWorld(world,event.end+2*60000);
  assert.equal(event.status,'completed');
  assert.ok(attendees.every(p=>p.action?.groupId!==event.id&&p.memories.some(m=>m.kind==='group_finished')));
  assert.equal(declined.memories.some(m=>m.kind==='group_finished'),false);
  assert.deepEqual(declined.relationships,before);
  const result=world.events.find(e=>e.type==='group_finished'&&e.groupId===event.id);
  if(kind==='tournament')assert.ok(event.attending.includes(result.winnerId));
 }
});

test('una cena tensa puede acabar en un conflicto y una visita ausente no lo simula',()=>{
 const {world}=qaScenario('group','dinner'),event=Object.values(world.groupEvents)[0];
 const [host,guest]=world.people;
 host.profile.traits.orden=.9;
 relation(host,guest).tension=25;
 const absent=structuredClone(world),past=absent.events.length;
 resumeAfterAbsence(absent,event.end+60000,{force:true});
 assert.equal(absent.events.length,past);
 assert.equal(absent.groupEvents[event.id].status,'cancelled');
 assert.equal(absent.people[0].relationships[guest.id].tension,25);
 advanceWorld(world,event.end+2*60000);
 assert.equal(event.outcome,'cleanup_dispute');
 assert.ok(Object.values(world.conflicts).some(c=>c.kind==='dishes'&&c.participants.includes(guest.id)));
 assert.ok(host.relationships[guest.id].tension>25);
});

test('una urgencia quita al vecino del grupo y nunca recibe recompensas por terminarlo',()=>{
 const {world}=qaScenario('group','barbecue'),event=Object.values(world.groupEvents)[0];
 const guest=world.people[1];
 guest.needs.bano=0;
 advanceWorld(world,event.end+2*60000);
 assert.equal(event.status,'completed');
 assert.equal(guest.memories.some(m=>m.kind==='group_finished'),false);
 assert.ok(world.events.some(e=>e.personId===guest.id&&e.type==='activity_interrupted'&&e.nextAction==='usar_bano'));
});
