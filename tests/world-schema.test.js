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
