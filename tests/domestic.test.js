import test from 'node:test';
import assert from 'node:assert/strict';
import {freeResource} from '../simulation/resources.js';
import {qaScenario} from '../simulation/qa-scenarios.js';
import {advanceWorld,createWorld,resumeAfterAbsence} from '../simulation/world.js';
import {RECIPES} from '../simulation/recipes.js';
import {findRoute,isWalkable} from '../simulation/navigation.js';
import {replaceProfile} from '../simulation/resident-state.js';

test('el sofá tiene tres plazas independientes, con vencimiento y compatibilidad antigua',()=>{
 const world={reservations:{}};
 for(let i=0;i<3;i++){const key=freeResource(world,'casa:sofa',0,3);assert.equal(key,'casa:sofa:'+i);world.reservations[key]={until:10}}
 assert.equal(freeResource(world,'casa:sofa',0,3),null);
 assert.equal(freeResource(world,'casa:sofa',10,3),'casa:sofa:0');
 world.reservations['casa:sofa']={until:20};assert.equal(freeResource(world,'casa:sofa',10,3),null);
});
test('la receta determina preparación y nutrición sin premiar coger ingredientes',()=>{
 const {world}=qaScenario('meal'),p=world.people[0],{meal}=p.action;
 const recipe=RECIPES.find(r=>r.id===meal.recipe),cooking=meal.stages[3];
 assert.equal(cooking.end-cooking.start,recipe.prepareMinutes*60000);assert.equal(meal.nutrition,recipe.nutrition);
 advanceWorld(world,meal.eatingStart);const before=p.needs.saciedad;
 advanceWorld(world,p.action.until);assert.ok(p.needs.saciedad>before+recipe.nutrition-2);
});
test('etapas corruptas, perfiles y aprendizaje se rechazan sin mutación parcial',()=>{
 const changes=[w=>w.people[0].action.meal.stages[3].end++,w=>w.people[0].action.meal.stages[1].route=[],w=>w.people[0].profile.traits.orden=2,w=>w.people[0].learned.skills.cocina=NaN];
 for(const change of changes){const {world}=qaScenario('meal');change(world);const before=structuredClone(world);assert.throws(()=>advanceWorld(world,world.lastSimulatedAt+60000),TypeError);assert.deepEqual(world,before)}
});
test('un reloj inválido no migra parcialmente una partida antigua',()=>{
 const world=createWorld({now:0});world.simulationVersion=4;delete world.households;const before=structuredClone(world);
 assert.throws(()=>advanceWorld(world,NaN),RangeError);assert.deepEqual(world,before);
});
test('rechaza metadatos domésticos corruptos antes de procesar acciones',()=>{
 for(const corrupt of [w=>delete w.people[4].profile.traits.sociabilidad,w=>w.households['piso-1'].mess=NaN,w=>w.eventSequence=-1,w=>w.reservations.test={personId:'mii-1',until:NaN},w=>w.people[2].relationships.otro={tension:Infinity}]){
  const world=createWorld({now:0});corrupt(world);const before=structuredClone(world);assert.throws(()=>advanceWorld(world,60000),TypeError);assert.deepEqual(world,before);
 }
});
test('cambiar el perfil conserva identidad, estado, relaciones y aprendizaje',()=>{
 const person=createWorld({now:0}).people[0];person.learned.skills.cocina=12;person.relationships.otro={friendship:25};person.memories.push({kind:'recuerdo'});
 const before=structuredClone(person),profile=structuredClone(person.profile);profile.interests=['estudio'];replaceProfile(person,profile);profile.interests.push('otro');
 assert.deepEqual(person,{...before,profile:{...before.profile,interests:['estudio']}});
});
test('rutas fuera del mapa o con coordenadas no finitas no se ejecutan',()=>{
 for(const point of [{x:Infinity,z:0},{x:100,z:0},{x:0,z:-100}])assert.deepEqual(findRoute(point,{x:0,z:0}),[]);
});
test('los catorce vecinos pueden recorrer la receta completa sin atravesar muebles',()=>{
 for(let i=0;i<14;i++){
  const {world}=qaScenario('meal','eating',i),action=world.people[i].action;
  assert.equal(action.id,'comer');
  for(const stage of action.meal.stages)for(let j=1;j<stage.route.length;j++){
   const a=stage.route[j-1],b=stage.route[j],steps=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.1);
   for(let n=0;n<=steps;n++)assert.ok(isWalkable(a.x+(b.x-a.x)*n/steps,a.z+(b.z-a.z)*n/steps));
  }
 }
});
test('los escenarios visuales usan las acciones reales de sueño, aseo, baño, estudio, ordenador, sofá y limpieza',()=>{
 for(const [kind,id] of [['sleep','dormir'],['wash','asearse'],['bath','usar_bano'],['desk','estudiar'],['computer','jugar'],['sofa','descansar'],['clean','limpiar']]){
  const {world}=qaScenario(kind),p=world.people[0];assert.equal(p.action.id,id);assert.ok(p.action.route.length>0);
 }
});
test('volver tras una ausencia cancela encuentros pendientes sin inventar sucesos',()=>{
 const world=createWorld({now:0});world.meetings={old:{id:'old',participants:['mii-1','mii-2'],expires:60000,finished:false}};world.lastObservedAt=0;
 resumeAfterAbsence(world,3600000,{wallNow:100000});advanceWorld(world,3600000);
 assert.equal(world.meetings.old.finished,true);assert.ok(!world.events.some(e=>e.type==='invitation_cancelled'));
});
