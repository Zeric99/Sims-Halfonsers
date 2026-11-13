import test from 'node:test';
import assert from 'node:assert/strict';
import {qaScenario} from '../simulation/qa-scenarios.js';
import {spectatorScene} from '../simulation/spectator.js';
import {openConversation} from '../simulation/social.js';
import {recordIncident} from '../simulation/conflicts.js';

test('la cámara mantiene la charla en curso aunque empiece una reconciliación',()=>{
 const {world,serverTime:now}=qaScenario('spectator','prank');
 const first=spectatorScene(world,now);
 const [, , a,b]=world.people;
 a.position={x:-4,z:-5};
 b.position={x:-5,z:-5};
 recordIncident(world,a,b,'no_show',now-3600000);
 const repair=openConversation(world,a,b,now);
 assert.equal(spectatorScene(world,now).id,repair.id);
 assert.equal(spectatorScene(world,now,first).id,first.id);
 world.conversations[first.id].finished=true;
 assert.equal(spectatorScene(world,now,first).id,repair.id);
});

test('un plan conserva el encuadre al pasar del camino a la actividad y explica un plantón previo',()=>{
 const {world,serverTime:now}=qaScenario('spectator','cooking');
 const scene=spectatorScene(world,now);
 const plan=world.plans[scene.id];
 const conversation=world.conversations[plan.conversationId];
 world.events.push({type:'plan_missed',participants:[...plan.participants],at:conversation.start-3600000});
 const before=structuredClone(world);
 before.conversations={};
 before.plans[plan.id].status='travelling';
 const walking=spectatorScene(before,now);
 assert.equal(walking.id,plan.id);
 const arrived=spectatorScene(world,now,walking);
 assert.equal(arrived.id,walking.id);
 assert.match(arrived.context,/plantón/);
 assert.equal(spectatorScene(world,conversation.end,arrived),null);
});
