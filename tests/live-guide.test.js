import test from 'node:test';
import assert from 'node:assert/strict';
import {qaScenario} from '../simulation/qa-scenarios.js';
import {liveGuide} from '../simulation/live-guide.js';
import {spectatorScene} from '../simulation/spectator.js';
import {overviewZoom,plot} from '../simulation/camera-layout.js';

test('la guía enlaza el conflicto correcto y no anuncia planes pasados',()=>{
 const {world,serverTime}=qaScenario('guide');
 const {live,upcoming}=liveGuide(world,serverTime,1);
 assert.match(live[0].backstory,/no aparecer a un plan/);
 assert.ok(world.chronicle.events.some(e=>e.id===live[0].momentId));
 assert.equal(upcoming[0].seconds,140);
 assert.equal(liveGuide(world,serverTime+141000,1).upcoming.length,0);
});
test('una rutina elegida a mano gana a la recomendación del director',()=>{
 const {world,serverTime}=qaScenario('guide');
 const person=world.people.at(-1);
 person.action={id:'estudiar',start:serverTime-1000,until:serverTime+10000,label:'estudiando'};
 const {live}=liveGuide(world,serverTime,1);
 assert.equal(live.length,2);
 assert.equal(spectatorScene(world,serverTime,live[0],live[1]).id,live[1].id);
 assert.equal(spectatorScene(world,serverTime+11000,live[0],live[1]).id,live[0].id);
});
test('el terreno cuadrado completo cabe en retrato y paisaje en ambas vistas',()=>{
 for(const aspect of [.66,1.6])for(const top of [true,false]){
  const zoom=overviewZoom(aspect,top);
  assert.ok(plot.side/2*(top?1:Math.SQRT2)*zoom<18*aspect);
  assert.ok(plot.side/2*(top?1:Math.sqrt(2/3))*zoom<18);
 }
});
