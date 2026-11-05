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

test('las catorce habitaciones conectan con el jardín',async()=>{
 const {findRoute}=await import('../simulation/navigation.js');
 for(const cx of [-10,10])for(const cz of [-7,7])for(let i=0;i<(cz<0?4:3);i++){
  const room={x:cx-7+i*3.5+2.5,z:cz-6+3.7};
  const route=findRoute(room,{x:0,z:16});assert.ok(route.length>0);
  for(let j=1;j<route.length;j++)assert.ok(route[j].x===route[j-1].x||route[j].z===route[j-1].z);
 }
});
test('reservas activas exclusivas no se duplican',()=>{
 const start=Date.UTC(2026,0,1,7),world=createWorld({seed:17,now:start});
 for(let minute=1;minute<=180;minute++){
  advanceWorld(world,start+minute*60000);
  const resources=world.people.map(p=>p.action?.resource).filter(Boolean);
  assert.equal(new Set(resources).size,resources.length);
 }
});

test('el ánimo responde a necesidades y tensión sin alterar rasgos',async()=>{
 const {moodFrom}=await import('../simulation/mood.js');
 const p={needs:{saciedad:80,energia:80,higiene:80,compania:80,diversion:80,bano:80},relationships:{b:{tension:0}},profile:{traits:{paciencia:.4}}};
 const before=moodFrom(p);p.relationships.b.tension=60;const after=moodFrom(p);
 assert.ok(after.score<before.score);assert.equal(p.profile.traits.paciencia,.4);
});

test('viajar a la cama no recupera energía y el sueño comienza al llegar',()=>{
 const start=Date.UTC(2026,0,1,23),world=createWorld({now:start}),p=world.people[0];
 p.needs.energia=10;p.action={id:'dormir',label:'durmiendo',start,until:start+480*60000,resource:null,route:[{x:0,z:0},{x:1,z:0}],travelMs:150000};
 advanceWorld(world,start+60000);const enCamino=p.needs.energia;
 assert.ok(enCamino<10);
 advanceWorld(world,start+180000);
 // Un minuto y medio despierto y medio minuto dormido.
 assert.ok(Math.abs(p.needs.energia-(10-4*2.5/60+9*.5/60))<1e-8);
 const afterArrival=p.needs.energia;advanceWorld(world,start+240000);
 assert.ok(p.needs.energia>afterArrival);
});
test('la reserva incluye el trayecto y el tiempo completo de la actividad',()=>{
 const start=Date.UTC(2026,0,1,23),world=createWorld({now:start});
 for(const p of world.people){p.position={x:0,z:16};p.needs.energia=0}
 advanceWorld(world,start+60000);
 const sleepers=world.people.filter(p=>p.action?.id==='dormir'&&p.action.travelMs>0);
 assert.ok(sleepers.length>0);
 for(const p of sleepers){const a=p.action;assert.equal(a.until-a.start-a.travelMs,480*60000);assert.equal(world.reservations[a.resource].until,a.until)}
});

test('una necesidad urgente interrumpe ocio y libera el recurso sin completar la actividad',()=>{
 const start=Date.UTC(2026,0,1,12),world=createWorld({now:start}),p=world.people[0];
 p.position={x:-8,z:-6};p.needs.bano=5;p.needs.diversion=30;
 const key=p.homeId+':computer:'+p.id;
 p.action={id:'jugar',label:'jugando',start,until:start+60*60000,resource:key,route:[p.position],travelMs:0};
 world.reservations[key]={personId:p.id,until:p.action.until};
 advanceWorld(world,start+60000);
 assert.equal(p.action.id,'usar_bano');assert.equal(world.reservations[key],undefined);
 assert.equal(world.reservations[p.homeId+':bathroom'].personId,p.id);
 assert.ok(p.needs.diversion<30);
 assert.ok(world.events.some(e=>e.type==='activity_interrupted'&&e.personId===p.id&&e.reason==='necesidad urgente'));
 assert.ok(!world.events.some(e=>e.type==='action_finished'&&e.personId===p.id&&e.action==='jugar'));
});
test('una necesidad urgente espera si el recurso está ocupado',()=>{
 const start=Date.UTC(2026,0,1,12),world=createWorld({now:start}),[p,other]=world.people;
 p.position={x:-8,z:-6};p.needs.bano=5;
 p.action={id:'leer',label:'leyendo',start,until:start+60*60000,resource:null,route:[p.position],travelMs:0};
 world.reservations[p.homeId+':bathroom']={personId:other.id,until:start+30*60000};
 advanceWorld(world,start+60000);
 assert.equal(p.action.id,'leer');assert.equal(world.reservations[p.homeId+':bathroom'].personId,other.id);
});

test('comer ensucia la cocina y limpiar la deja recogida una sola vez',()=>{
 const start=Date.UTC(2026,0,1,12),world=createWorld({now:start}),p=world.people[0],home=world.households[p.homeId];
 p.action={id:'comer',label:'comiendo',start:start-1800000,until:start,resource:null,route:[],travelMs:0};
 advanceWorld(world,start+60000);assert.equal(home.mess,12);
 p.action={id:'limpiar',label:'limpiando',start:start-1800000,until:start+60000,resource:null,route:[],travelMs:0};home.mess=60;
 advanceWorld(world,start+120000);assert.equal(home.mess,15);
 assert.equal(world.events.filter(e=>e.type==='cleaning_finished'&&e.personId===p.id).length,1);
 advanceWorld(world,start+180000);assert.equal(world.events.filter(e=>e.type==='cleaning_finished'&&e.personId===p.id).length,1);
});
test('una cocina muy desordenada motiva a limpiar y reserva su uso',()=>{
 const start=Date.UTC(2026,0,1,12),world=createWorld({seed:12,now:start}),p=world.people[0];
 world.households[p.homeId].mess=100;
 for(const resident of world.people){resident.needs={saciedad:100,energia:100,higiene:100,compania:100,diversion:100,bano:100};if(resident!==p)resident.action={id:'leer',label:'leyendo',start,until:start+3600000,resource:null,route:[],travelMs:0}}
 advanceWorld(world,start+60000);assert.equal(p.action.id,'limpiar');
 assert.equal(world.reservations[p.homeId+':kitchen'].personId,p.id);
});
test('la migración añade estado de cocina sin borrar relaciones ni recuerdos',()=>{
 const world=createWorld({now:0});world.simulationVersion=4;delete world.households;
 world.people[0].relationships.otro={friendship:15};world.people[0].memories.push({kind:'test'});
 advanceWorld(world,60000);assert.equal(world.households['piso-1'].mess,0);
 assert.equal(world.people[0].relationships.otro.friendship,15);assert.equal(world.people[0].memories[0].kind,'test');
});

test('los perfiles se aíslan entre mundos y no cambian los valores iniciales',()=>{
 const a=createWorld({now:0}),b=createWorld({now:0});
 const initial=b.people[0].profile.traits.orden;
 a.people[0].profile.traits.orden=initial===1?0:1;
 a.people[0].profile.interests.push('prueba');
 assert.equal(b.people[0].profile.traits.orden,initial);
 assert.ok(!b.people[0].profile.interests.includes('prueba'));
 const c=createWorld({now:0});assert.equal(c.people[0].profile.traits.orden,initial);
});
test('reanudar desde estado serializado reproduce el mismo mundo',()=>{
 const start=Date.UTC(2026,0,1,7),a=createWorld({seed:827,now:start});
 advanceWorld(a,start+6*hour);const b=JSON.parse(JSON.stringify(a));
 advanceWorld(a,start+12*hour);advanceWorld(b,start+12*hour);assert.deepEqual(a,b);
});
test('siete días simulados mantienen necesidades y recursos coherentes',()=>{
 const start=Date.UTC(2026,0,1,7),world=createWorld({seed:73184,now:start}),kinds=new Set();
 for(let h=1;h<=168;h++){
  advanceWorld(world,start+h*hour);
  for(const e of world.events)if(e.type==='action_finished')kinds.add(e.action);
  for(const p of world.people)for(const n of Object.values(p.needs))assert.ok(Number.isFinite(n)&&n>=0&&n<=100);
  const keys=world.people.map(p=>p.action?.resource).filter(Boolean);assert.equal(new Set(keys).size,keys.length);
 }
 for(const kind of ['comer','dormir','asearse','jugar','limpiar'])assert.ok(kinds.has(kind));
});

test('dormir no termina prematuramente al salir de la franja habitual',()=>{
 const start=Date.UTC(2026,0,1,7),world=createWorld({now:start}),p=world.people[0];
 p.profile.sleepHour=22;p.profile.wakeHour=7;p.needs.energia=80;
 p.action={id:'dormir',label:'durmiendo',start:start-60*60000,until:start+7*hour,resource:null,route:[{x:-14,z:-9}],travelMs:0};
 advanceWorld(world,start+60000);assert.equal(p.action.id,'dormir');
});
test('tras descansar suficiente fuera de su horario no vuelve a acostarse',()=>{
 const start=Date.UTC(2026,0,1,8),world=createWorld({now:start}),p=world.people[0];
 p.profile.sleepHour=22;p.profile.wakeHour=7;p.needs.energia=95;
 p.action={id:'dormir',label:'durmiendo',start:start-6*hour,until:start+2*hour,resource:null,route:[{x:-14,z:-9}],travelMs:0};
 advanceWorld(world,start+60000);
 assert.ok(p.action.id!=='dormir');
 assert.ok(world.events.some(e=>e.type==='action_finished'&&e.personId===p.id&&e.action==='dormir'));
});

test('preparar no sacia y comer recupera saciedad de forma gradual',()=>{
 const start=Date.UTC(2026,0,1,12),world=createWorld({now:start}),p=world.people[0];
 p.needs.saciedad=20;
 p.action={id:'comer',label:'comiendo',start,until:start+33*60000,resource:null,route:[],travelMs:0,meal:{prepareMs:8*60000,eatMs:25*60000}};
 advanceWorld(world,start+8*60000);const before=p.needs.saciedad;assert.ok(before<20);
 advanceWorld(world,start+13*60000);assert.ok(p.needs.saciedad>before+11&&p.needs.saciedad<before+12);
 advanceWorld(world,start+33*60000);assert.ok(Math.abs(p.needs.saciedad-(20-33*4/60+60))<1e-7);
 advanceWorld(world,start+34*60000);assert.ok(p.needs.saciedad<80);
});
test('la reserva de cocina incluye preparación y comida',()=>{
 const start=Date.UTC(2026,0,1,12),world=createWorld({now:start}),p=world.people[0];
 p.needs={saciedad:0,energia:90,higiene:90,compania:90,diversion:90,bano:90};
 advanceWorld(world,start+60000);assert.equal(p.action.id,'comer');
 assert.equal(p.action.until-p.action.start-p.action.travelMs,33*60000);
 assert.equal(world.reservations[p.homeId+':kitchen'].until,p.action.until);
});

test('solo los cuatro fumadores hacen pausas en el jardín',()=>{
 const start=Date.UTC(2026,0,1,7),world=createWorld({seed:73184,now:start}),allowed=['Catalán','Linkal','May','Mei'],seen=new Set();
 for(let i=1;i<=168;i++){
  advanceWorld(world,start+i*3600000);
  for(const p of world.people)if(p.action?.id==='fumar'){
   assert.ok(allowed.includes(p.name));seen.add(p.name);
   assert.ok(p.action.route.at(-1).z>=13);
  }
  for(const e of world.events)if(e.type==='action_started'&&e.action==='fumar'){
   const p=world.people.find(p=>p.id===e.personId);assert.ok(allowed.includes(p.name));seen.add(p.name);
  }
 }
 assert.deepEqual([...seen].sort(),allowed.sort());
});

test('aseo y baño recuperan necesidades al llegar y sin recompensa duplicada',()=>{
 for(const [id,need,gain,duration,decay] of [['asearse','higiene',70,10,2],['usar_bano','bano',80,5,5]]){
  const start=Date.UTC(2026,0,1,12),world=createWorld({now:start}),p=world.people[0],minute=60000;
  p.needs[need]=10;
  p.action={id,label:id,start,until:start+(2+duration)*minute,resource:null,route:[],travelMs:2*minute,care:{durationMs:duration*minute}};
  advanceWorld(world,start+2*minute);assert.ok(p.needs[need]<10);
  advanceWorld(world,start+(2+duration)*minute);
  assert.ok(Math.abs(p.needs[need]-(10+gain-decay*(2+duration)/60))<1e-7);
  advanceWorld(world,start+(3+duration)*minute);assert.ok(p.needs[need]<10+gain);
 }
});
test('una acción de aseo anterior sin progresión conserva su recompensa al acabar',()=>{
 const start=Date.UTC(2026,0,1,12),world=createWorld({now:start}),p=world.people[0];
 p.needs.higiene=10;p.action={id:'asearse',label:'aseándose',start:start-600000,until:start,resource:null,route:[],travelMs:0};
 advanceWorld(world,start+60000);assert.ok(p.needs.higiene>79&&p.needs.higiene<80);
});
