import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,advanceWorld} from '../simulation/world.js';

test('rechaza versiones futuras antes de mutar un mundo persistido',()=>{
 const world=createWorld({now:0});world.simulationVersion=999;
 const before=structuredClone(world);
 assert.throws(()=>advanceWorld(world,60000),RangeError);
 assert.deepEqual(world,before);
});
test('rechaza habitantes duplicados y estado de reloj inválido',()=>{
 const a=createWorld({now:0});a.people[1].id=a.people[0].id;
 assert.throws(()=>advanceWorld(a,60000),TypeError);
 const b=createWorld({now:0});b.lastSimulatedAt=NaN;
 assert.throws(()=>advanceWorld(b,60000),TypeError);
});
test('migra un mundo anterior sin borrar sus relaciones ni recuerdos',()=>{
 const world=createWorld({now:0});world.simulationVersion=4;delete world.households;
 world.people[0].relationships.otro={friendship:20};world.people[0].memories.push({kind:'test'});
 advanceWorld(world,60000);
 assert.equal(world.simulationVersion,5);assert.equal(world.people[0].relationships.otro.friendship,20);
 assert.equal(world.people[0].memories[0].kind,'test');
});
test('rechaza necesidades corruptas antes de cambiar a ningún vecino',()=>{
 for(const value of [NaN,-1,101,undefined]){
  const world=createWorld({now:0});world.people[7].needs.energia=value;
  const original=structuredClone(world);assert.throws(()=>advanceWorld(world,60000),/Necesidad inválida/);assert.deepEqual(world,original);
 }
});
test('acepta y migra mundos antiguos sin necesidad de baño',()=>{
 const world=createWorld({now:0});world.simulationVersion=3;for(const p of world.people)delete p.needs.bano;
 advanceWorld(world,60000);assert.ok(world.people.every(p=>Number.isFinite(p.needs.bano)));assert.equal(world.simulationVersion,5);
});
test('rechaza posiciones y acciones dañadas antes de modificar el mundo',()=>{
 for(const corrupt of [p=>p.position={x:NaN,z:0},p=>p.action={id:'desconocida',start:0,until:1},p=>p.action={id:'leer',start:0,until:-1},p=>p.action={id:'leer',start:0,until:1,route:[{x:1,z:Infinity}]}]){
  const world=createWorld({now:0});corrupt(world.people[7]);const before=structuredClone(world);
  assert.throws(()=>advanceWorld(world,60000),TypeError);assert.deepEqual(world,before);
 }
});
