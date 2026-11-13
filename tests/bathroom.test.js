import test from 'node:test';
import assert from 'node:assert/strict';
import {qaScenario} from '../simulation/qa-scenarios.js';
import {bathroomCall,bathroomDeparture} from '../simulation/bathroom.js';
import {advanceWorld} from '../simulation/world.js';

test('el aviso corta la charla, reserva el váter y se dice antes de correr',()=>{
 for(const [phase,name,line] of [['shout','Eric','¡Me cago!'],['polite','Linkal','Perdona, tengo que ir al baño.']]){
  const {world}=qaScenario('bathroom',phase);
  const person=world.people.find(p=>p.name===name);
  const action=person.action;
  const conversation=Object.values(world.conversations).find(c=>c.participants.includes(person.id));
  assert.equal(conversation.cancelledAt,action.start);
  assert.ok(world.people.every(p=>p.action?.conversationId!==conversation.id));
  assert.equal(world.reservations[action.resource].personId,person.id);
  assert.equal(action.bathroomCall,line);
  assert.equal(action.bathroomRush,true);
  assert.ok(bathroomDeparture(action)>action.start&&bathroomDeparture(action)<action.start+action.travelMs);
  assert.ok(action.seat);
 }
 for(const name of ['Eric','David','Lolo'])assert.equal(bathroomCall({name},false),'¡Me cago!');
});

test('desde el ordenador espera si el baño está ocupado y corre al quedar libre',()=>{
 const {world}=qaScenario('bathroom','computer');
 const [eric,linkal]=world.people;
 assert.equal(eric.action.id,'jugar');
 assert.equal(world.reservations['piso-1:bathroom'].personId,linkal.id);
 advanceWorld(world,linkal.action.until+60000);
 assert.equal(eric.action.id,'usar_bano');
 assert.equal(eric.action.bathroomCall,'¡Me cago!');
});
