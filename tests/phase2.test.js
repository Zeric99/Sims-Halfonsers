import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceWorld, createWorld, resumeAfterAbsence} from '../simulation/world.js';
import {proposePlan} from '../simulation/plans.js';
import {openConversation, finishConversation} from '../simulation/social.js';
import {consent, relationshipLabel} from '../simulation/relationships.js';
import {checkNoise, attemptKitchenRepair, honorAgreement, recordIncident, coolConflicts} from '../simulation/conflicts.js';
import {updateRomance} from '../simulation/romance.js';
import {describeResident} from '../simulation/resident-details.js';
import {speechAt} from '../simulation/speech.js';
import {isWalkable} from '../simulation/navigation.js';

const MIN=60000;
const start=Date.UTC(2026,0,1,12);
function setup(){
 const w=createWorld({now:start});
 for(const [i,p] of w.people.entries()){
  p.position={x:i%2?-11:-14.5,z:-9.5};
  p.needs={saciedad:85,energia:85,higiene:85,compania:75,diversion:85,bano:85};
  p.action={id:'esperar',label:'esperando',route:[p.position],start,until:start+12*60*MIN};
 }
 w.nextPlanCheck=start+12*60*MIN;
 return w;
}

test('los planes comparten destino, hora, reserva y desenlace entre clientes y después de recargar',()=>{
 for(const kind of ['games','cooking','anime','gym']){
  let w=setup();
  const p=proposePlan(w,...w.people.slice(0,2),kind,start,()=>0);
  advanceWorld(w,p.scheduledAt+MIN);
  assert.equal(p.status,'travelling');
  const travellers=w.people.slice(0,2);
  for(const person of travellers){
   assert.equal(person.action.planId,p.id);
   assert.ok(person.action.route.every(point=>isWalkable(point.x,point.z)));
  }
  for(const key of p.keys)assert.equal(w.reservations[key].planId,p.id);
  const arrives=Math.max(...travellers.map(q=>q.action.start+q.action.travelMs));
  advanceWorld(w,arrives);
  assert.equal(p.status,'travelling');
  w=JSON.parse(JSON.stringify(w));
  advanceWorld(w,arrives+MIN);
  const active=w.plans[p.id],a=w.people[0],b=w.people[1];
  assert.equal(active.status,'active');
  assert.equal(a.action.conversationId,b.action.conversationId);
  assert.equal(a.action.activity,kind);
  const c=w.conversations[active.conversationId];
  assert.ok(speechAt(c,a.id,c.start+1));
  assert.equal(speechAt(c,b.id,c.start+1),'');
  assert.equal(describeResident(w,a.name,c.start).commitments[0].status,'active');
  advanceWorld(w,c.end+MIN);
  assert.equal(active.status,'completed');
  assert.equal(w.events.filter(e=>e.type==='plan_completed'&&e.planId===p.id).length,1);
  for(const key of p.keys)assert.notEqual(w.reservations[key]?.planId,p.id);
  assert.ok(a.relationships[b.id].trust>20);
 }
});

test('rechazar no crea compromiso y una actividad que se alarga permite proponer otra hora',()=>{
 const w=setup(),[a,b]=w.people;
 const decline=proposePlan(w,a,b,'anime',start,()=>1);
 assert.equal(decline.status,'declined');
 b.action={...b.action,id:'estudiar',until:start+37*MIN};
 const moved=proposePlan(w,a,b,'anime',start+MIN,()=>0);
 assert.equal(moved.status,'scheduled');
 assert.ok(moved.scheduledAt>b.action.until);
 assert.ok(w.events.some(e=>e.type==='plan_rescheduled'));
 assert.equal(proposePlan(w,a,w.people[2],'games',start+MIN,()=>0),null);
});

test('un plantón tiene causa, afecta de forma dirigida y un plan posterior permite cumplir el acuerdo',()=>{
 const w=setup(),[a,b]=w.people;
 const plan=proposePlan(w,a,b,'games',start,()=>0);
 b.action={...b.action,id:'jugar',until:start+40*MIN};
 advanceWorld(w,plan.scheduledAt+14*MIN);
 assert.equal(plan.status,'missed');
 const c=Object.values(w.conflicts).find(c=>c.kind==='no_show');
 assert.ok(c);
 const tension=a.relationships[b.id].tension;
 assert.ok(tension>0);
 assert.equal(b.relationships[a.id],undefined);
 const later=start+62*MIN;
 advanceWorld(w,later);
 assert.equal(attemptKitchenRepair(w,{finished:true,participants:[a.id,b.id]},later,0),true);
 assert.equal(c.state,'repair_pending');
 assert.ok(a.relationships[b.id].tension>0);
 // Tras hablar del plantón, ambos están libres para decidir otro plan.
 for(const person of [a,b]){
  const key=person.action?.resource;
  if(key&&w.reservations[key]?.personId===person.id)delete w.reservations[key];
  person.action={id:'esperar',start:later,until:later+6*60*MIN,route:[person.position]};
 }
 const second=proposePlan(w,b,a,'games',later,()=>0);
 assert.ok(second);
 advanceWorld(w,later+150*MIN);
 assert.equal(second.status,'completed');
 assert.equal(c.state,'resolved');
 assert.ok(a.relationships[b.id].tension<tension);
});

test('un recurso ocupado cancela el encuentro sin culpar a un vecino',()=>{
 const w=setup(),[a,b,occupant]=w.people;
 const p=proposePlan(w,a,b,'gym',start,()=>0);
 const key='comunidad:gimnasio';
 occupant.action={...occupant.action,id:'practicar',activity:'gimnasio',resource:key,until:start+90*MIN};
 w.reservations[key]={personId:occupant.id,until:occupant.action.until};
 advanceWorld(w,p.scheduledAt+14*MIN);
 assert.equal(p.status,'cancelled');
 assert.equal(w.reservations[key].personId,occupant.id);
 assert.ok(!Object.values(w.conflicts??{}).some(c=>c.kind==='no_show'));
});

test('amistad, confianza y repetición cambian por dirección y afectan al consentimiento',()=>{
 const w=setup(),[a,b]=w.people;
 a.action=b.action=null;
 a.profile.traits.amabilidad=1;
 b.profile.traits.amabilidad=0;
 const original=consent(a,b,start);
 const c=openConversation(w,a,b,start);
 finishConversation(w,c.id,c.end);
 assert.ok(a.relationships[b.id].friendship>b.relationships[a.id].friendship);
 assert.ok(consent(a,b,c.end)>original);
 const gain=a.relationships[b.id].friendship;
 a.action=b.action=null;
 const second=openConversation(w,a,b,c.end);
 finishConversation(w,second.id,second.end);
 assert.ok(a.relationships[b.id].friendship-gain<gain);
 assert.equal(relationshipLabel({status:'amigo',friendship:18,tension:0}),'amigo');
 assert.equal(relationshipLabel({friendship:18,tension:0}),'conocido');
});

test('solo el ruido durante estudio o sueño genera un incidente y el acuerdo requiere conducta',()=>{
 const w=setup(),[viewer,student]=w.people;
 viewer.action.id='ver_tv';
 student.action.id='estudiar';
 student.profile.traits.sensibilidadRuido=.8;
 checkNoise(w,start);
 checkNoise(w,start+10*MIN);
 const [c]=Object.values(w.conflicts);
 assert.equal(c.kind,'noise');
 assert.equal(c.incidents.length,1);
 const later=start+35*MIN;
 const conversation={finished:true,participants:[viewer.id,student.id]};
 assert.equal(attemptKitchenRepair(w,conversation,later,0),true);
 honorAgreement(w,viewer,'clean_dishes',later+MIN);
 assert.equal(c.state,'repair_pending');
 honorAgreement(w,viewer,'quiet_tv',later+2*MIN);
 assert.equal(c.state,'resolved');
 assert.equal(w.events.filter(e=>e.type==='agreement_fulfilled').length,1);
 recordIncident(w,student,viewer,'noise',start+90*MIN);
 assert.equal(c.state,'open');
 attemptKitchenRepair(w,conversation,start+125*MIN,0);
 coolConflicts(w,c.agreement.deadline);
 assert.equal(c.state,'open');
 assert.ok(w.events.some(e=>e.type==='agreement_broken'));
});

test('el romance requiere configuración y reciprocidad, respeta negativas y una ruptura exige problemas acumulados',()=>{
 const w=setup(),[a,b]=w.people;
 a.position={x:0,z:15};b.position={x:1,z:15};
 a.relationships[b.id]={friendship:45,trust:60,tension:0,romanticInterest:80,familiarity:30};
 b.relationships[a.id]={friendship:40,trust:60,tension:0,romanticInterest:20,familiarity:30};
 const c={participants:[a.id,b.id],story:'shared_interest'};
 updateRomance(w,c,start,()=>0);
 assert.equal(w.romance,undefined);
 for(const [p,q] of [[a,b],[b,a]]){p.profile.romanceEnabled=true;p.profile.romancePartners=[q.id]}
 updateRomance(w,c,start,()=>0);
 assert.ok(w.events.some(e=>e.type==='romance_rejected'));
 const proposalCount=w.events.filter(e=>e.type==='romance_proposed').length;
 b.relationships[a.id].romanticInterest=80;
 updateRomance(w,c,start+MIN,()=>0);
 assert.equal(w.events.filter(e=>e.type==='romance_proposed').length,proposalCount);
 const day=start+1441*MIN;
 updateRomance(w,c,day,()=>0);
 const pair=Object.values(w.romance.couples)[0];
 assert.equal(pair.status,'together');
 recordIncident(w,b,a,'prank',day+MIN);
 updateRomance(w,c,day+2*MIN,()=>0);
 assert.equal(pair.status,'together');
 for(const [i,kind] of ['noise','dishes','no_show'].entries())recordIncident(w,b,a,kind,day+(i+2)*MIN);
 b.relationships[a.id].tension=65;
 updateRomance(w,c,day+15*MIN,()=>0);
 assert.equal(pair.status,'together');
 updateRomance(w,c,day+12*60*MIN+15*MIN,()=>0);
 assert.equal(pair.status,'separated');
 assert.equal(describeResident(w,a.name,day+12*60*MIN+15*MIN).relationship,null);
});

test('un plan pasado durante una ausencia se cancela sin inventar un plantón',()=>{
 const w=setup(),[a,b]=w.people;
 const p=proposePlan(w,a,b,'games',start,()=>0);
 const before=w.events.length;
 resumeAfterAbsence(w,start+60*MIN,{force:true});
 assert.equal(p.status,'cancelled');
 assert.equal(w.events.length,before);
});
