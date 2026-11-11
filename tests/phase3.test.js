import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld, advanceWorld, resumeAfterAbsence} from '../simulation/world.js';
import {remember, relevantMemories, socialBias} from '../simulation/memory.js';
import {applyQuestionnaire} from '../simulation/resident-state.js';
import {checkNoise} from '../simulation/conflicts.js';
import {learnedQuiet} from '../simulation/learning.js';
import {qaScenario} from '../simulation/qa-scenarios.js';
import {describeResident} from '../simulation/resident-details.js';

const MIN=60000;
const HOUR=60*MIN;

test('un recuerdo importante sobrevive al ruido de recuerdos menores y pierde peso con el tiempo',()=>{
 const person={};
 remember(person,{eventId:'plantón',kind:'no_show',with:'mii-2',at:0,valence:-2,importance:3});
 for(let i=1;i<=60;i++)remember(person,{eventId:'charla:'+i,kind:'conversation',with:'mii-3',at:i*MIN,valence:1});
 assert.equal(person.memories.length,50);
 assert.equal(relevantMemories(person,25*HOUR,{withId:'mii-2'})[0].memory.eventId,'plantón');
 assert.ok(socialBias(person,'mii-2',25*HOUR)<0);
 assert.equal(socialBias(person,'mii-2',73*HOUR),0);
});

test('completar un plan crea experiencia y la noche propone repetirlo con la misma persona',()=>{
 const {world,serverTime}=qaScenario('evolution');
 const [host,guest]=world.people;
 const info=describeResident(world,host.name,serverTime);
 assert.equal(info.goal.kind,'plan');
 assert.equal(info.goal.with,guest.id);
 assert.match(info.reflection.positive,/Linkal/);
 assert.ok(host.learned.contexts['plan:anime:'+guest.id]>0);
 const saved=JSON.parse(JSON.stringify(world));
 advanceWorld(world,serverTime+10*MIN);
 advanceWorld(saved,serverTime+10*MIN);
 assert.deepEqual(saved,world);
 assert.equal(world.people[0].reflection.at,info.reflection.at);
});

test('una receta practicada se prepara antes y solo mejora tras completar la comida',()=>{
 const {world,serverTime}=qaScenario('meal','cooking');
 const person=world.people[0],first=person.action.meal;
 const cooking=first.stages.find(stage=>stage.kind==='cooking');
 const start=world.lastSimulatedAt;
 person.goal={id:'receta',kind:'recipe',recipe:first.recipe,priority:.09,target:2,
  progress:0,status:'active',createdAt:start,expiresAt:start+24*HOUR};
 advanceWorld(world,serverTime);
 assert.equal(person.learned.skills.cocina,undefined);
 assert.equal(person.goal.progress,0);
 advanceWorld(world,first.until+MIN);
 assert.equal(person.goal.progress,1);
 assert.equal(person.learned.recipes[first.recipe],1);
 assert.ok(person.learned.skills.cocina>0);
 person.action=null;
 person.needs.saciedad=0;
 advanceWorld(world,world.lastSimulatedAt+MIN);
 const second=person.action.meal.stages.find(stage=>stage.kind==='cooking');
 assert.equal(person.action.meal.recipe,first.recipe);
 assert.ok(second.end-second.start<cooking.end-cooking.start);
 advanceWorld(world,person.action.until+MIN);
 assert.equal(person.goal.status,'completed');
});

test('las molestias repetidas por la tele enseñan a bajar el volumen en ese contexto',()=>{
 const start=Date.UTC(2026,0,1,23);
 const world=createWorld({now:start}),[viewer,sleeper]=world.people;
 viewer.action={id:'ver_tv',start};
 sleeper.action={id:'dormir',start};
 sleeper.profile.traits.sensibilidadRuido=.9;
 for(let i=0;i<2;i++)checkNoise(world,start+i*HOUR);
 assert.equal(learnedQuiet(viewer,world,start+HOUR),false);
 checkNoise(world,start+2*HOUR);
 assert.equal(learnedQuiet(viewer,world,start+2*HOUR),true);
 assert.equal(learnedQuiet(viewer,world,start+12*HOUR),false);
 assert.equal(viewer.learned.preferences.ver_tv,undefined);
});

test('el cuestionario invierte la escala y conserva todo el estado salvo el perfil',()=>{
 const {world}=qaScenario('evolution');
 const person=world.people[0],before=structuredClone(person);
 applyQuestionnaire(person,{version:1,answers:{prefiereSoledad:5,ruidoNoMolesta:null}});
 const {profile,...state}=person;
 const {profile:oldProfile,...oldState}=before;
 assert.deepEqual(state,oldState);
 assert.equal(profile.traits.sociabilidad,0);
 assert.equal(profile.traits.privacidad,1);
 assert.equal(profile.traits.sensibilidadRuido,oldProfile.traits.sensibilidadRuido);
 assert.deepEqual(profile.interests,oldProfile.interests);
 assert.equal(profile.wakeHour,oldProfile.wakeHour);
 assert.equal(profile.questionnaireVersion,1);
 const snapshot=structuredClone(person);
 for(const submission of [{version:99},{version:1,answers:{ruidoNoMolesta:7}},{version:1,answers:{desconocida:4}},{version:1,answers:[]}]){
  assert.throws(()=>applyQuestionnaire(person,submission));
  assert.deepEqual(person,snapshot);
 }
});

test('reanudar justo a las 23:00 no inventa una reflexión de un día sin visitantes',()=>{
 const now=Date.UTC(2026,0,1,23);
 const world=createWorld({now:now-24*HOUR});
 resumeAfterAbsence(world,now,{force:true});
 advanceWorld(world,now+MIN);
 assert.ok(world.people.every(person=>!person.reflection));
});
