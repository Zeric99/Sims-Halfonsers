import {openConversation} from './social.js';
import {attemptKitchenRepair,honorAgreement,recordIncident} from './conflicts.js';
import {proposePlan,activities} from './plans.js';
import {proposeGroup,groupKinds} from './group-events.js';
import {createWorld,advanceWorld} from './world.js';
import {collectChronicle} from './chronicles.js';
// Solo lo sirve dev-server; nunca escribe en el mundo del usuario.
export function qaScenario(kind='meal',phase='eating',personIndex=0){
 if(kind==='greeting'){
  const at=Date.UTC(2026,0,1,15),world=createWorld({seed:42,now:at});
  const [a,b]=world.people;a.position={x:0,z:15};b.position={x:1,z:15};
  const c=openConversation(world,a,b,at);c.story='catch_up';
  return {world,serverTime:at+1000,clockRate:1,mode:'escenario_local'};
 }
 if(kind==='bathroom'){
  const at=Date.UTC(2026,0,1,15);
  const world=createWorld({seed:42,now:at});
  world.nextGroupCheck=world.nextPlanCheck=at+86400000;
  const [eric,linkal,mei]=world.people;
  const person=phase==='polite'?linkal:eric;
  const other=phase==='polite'?mei:linkal;
  person.position={x:-8,z:-6};other.position={x:-9,z:-6};
  if(phase==='computer'){
   person.position={x:-14.5,z:-9.5};
   person.action={id:'jugar',label:'jugando al ordenador',start:at-600000,until:at+600000,travelMs:0,route:[person.position],resource:null};
   other.action={id:'asearse',label:'aseándose',start:at,until:at+600000,travelMs:0,route:[other.position],resource:'piso-1:bathroom'};
   world.reservations['piso-1:bathroom']={personId:other.id,until:other.action.until};
  }else openConversation(world,person,other,at);
  person.needs.bano=4;
  advanceWorld(world,at+1000);
  const clock=phase==='seated'?person.action.start+person.action.travelMs+60000:
   phase==='run'?person.action.start+Math.floor(person.action.travelMs*.6):at+1000;
  return {world,serverTime:clock,clockRate:phase==='run'?22:1,mode:'escenario_local'};
 }
 if(kind==='guide'){
  const fixture=qaScenario('spectator','repair');
  const {world,serverTime}=fixture;
  const [,,host,guest]=world.people;
  const conflict=Object.values(world.conflicts)[0];
  world.events=world.events.filter(e=>e.type!=='conversation_started'||e.at<=serverTime);
  world.plans??={};
  const id=world.worldId+':plan:'+(++world.eventSequence);
  world.plans[id]={id,status:'scheduled',kind:'cooking',participants:[host.id,guest.id],scheduledAt:serverTime+140000,createdAt:serverTime};
  collectChronicle(world,serverTime);
  return {...fixture,clockRate:1,qaConflict:conflict.id};
 }
 if(kind==='chronicle'){
  const {world}=qaScenario('group','tournament');
  const group=Object.values(world.groupEvents)[0];
  advanceWorld(world,group.end+120000);
  const at=Date.UTC(2026,0,2,17),[a,b]=world.people;
  const conflict=recordIncident(world,a,b,'dishes',at);
  attemptKitchenRepair(world,{participants:[a.id,b.id],finished:true,conflictId:conflict.id},at+86400000,0);
  world.qaPreviousVisit=world.eventSequence;
  honorAgreement(world,b,'clean_dishes',at+2*86400000,a);
  collectChronicle(world,at+2*86400000);
  return {world,serverTime:at+2*86400000,clockRate:1,mode:'escenario_local'};
 }
 if(kind==='group'){
  const at=Date.UTC(2026,0,1,17),world=createWorld({seed:42,now:at});
  world.nextGroupCheck=world.nextPlanCheck=at+86400000;
  const people=world.people.slice(0,5);
  for(const [i,p] of world.people.entries()){
   p.needs={saciedad:72,energia:100,higiene:100,compania:85,diversion:100,bano:100};
   if(i<5)p.position={x:-1+i*.5,z:14};
   p.action={id:'esperar',label:'descansando',start:at,until:at+86400000,travelMs:0,route:p.position?[p.position]:[]};
  }
  const type=Object.hasOwn(groupKinds,phase)?phase:'barbecue';
  let draw=0;
  const event=proposeGroup(world,people[0],people.slice(1),type,at,()=>++draw===4?.999:0);
  let clock=event.scheduledAt;
  while(event.status!=='active'&&clock<at+3*3600000){clock+=60000;advanceWorld(world,clock)}
  if(event.status==='active'){
   clock=event.start+Math.floor((event.end-event.start)*.37);
   advanceWorld(world,clock);
  }
  return {world,serverTime:clock,clockRate:1,mode:'escenario_local'};
 }
 if(kind==='spectator'){
  if(['cooking','prep','stove','serve'].includes(phase)){
   const fixture=qaScenario('social','cooking');
   const conversation=Object.values(fixture.world.conversations).find(c=>c.planId);
   const offset={prep:0,stove:.35,serve:.79}[phase];
   if(offset!==undefined)fixture.serverTime=conversation.start+offset*(conversation.end-conversation.start);
   return {...fixture,clockRate:offset===undefined?20:1};
  }
  const at=Date.UTC(2026,0,1,15);
  const world=createWorld({seed:42,now:at});
  const [a,b]=world.people;
  a.position={x:-11,z:-6};
  b.position={x:-9.5,z:-6};
  if(phase==='repair'){
   recordIncident(world,a,b,'no_show',at-60*60000);
  }else{
   // El próximo identificador selecciona una broma del catálogo habitual.
   world.eventSequence=4;
   b.profile.traits.paciencia=phase==='offended'?.2:.8;
  }
  openConversation(world,a,b,at);
  return {world,serverTime:at+(['laugh','offended','repair'].includes(phase)?8*60000+1000:1000),clockRate:phase==='prank'?20:1,mode:'escenario_local'};
 }
 if(kind==='night'){
  const at=Date.UTC(2026,0,1,23,35);
  const world=createWorld({seed:42,now:at-35*60000});
  advanceWorld(world,at);
  return {world,serverTime:at,clockRate:1,mode:'escenario_local'};
 }
 if(kind==='evolution'){
  const {world}=qaScenario('social','result');
  const at=Date.UTC(2026,0,2,7,1);
  // Isolate the remembered plan from unrelated random group events.
  world.nextGroupCheck=at+86400000;
  advanceWorld(world,at,{maxMinutes:1440});
  return {world,serverTime:at,clockRate:1,mode:'escenario_local'};
 }
 const start=Date.UTC(2026,0,1,12),world=createWorld({seed:42,now:start});
 for(const p of world.people){p.needs={saciedad:100,energia:100,higiene:100,compania:100,diversion:100,bano:100};p.action={id:'esperar',label:'prueba de postura',start,until:start+86400000,resource:null,travelMs:0,route:[]}}
 if(kind==='social'){
  const [host,guest]=world.people;
  host.position={x:-14.5,z:-9.5};
  guest.position={x:-11,z:-9.5};
  host.action.route=[host.position];
  guest.action.route=[guest.position];
  world.nextPlanCheck=start+86400000;
  const activity=Object.hasOwn(activities,phase)?phase:'anime';
  const plan=proposePlan(world,host,guest,activity,start,()=>0);
  let at=start;
  while(plan.status!=='active'&&at<start+3*3600000){
   at+=60000;
   advanceWorld(world,at);
  }
  if(plan.status==='active'&&['stack','fade'].includes(phase)){
   at=host.action.until-(phase==='fade'?10000:2*60000);
   advanceWorld(world,at);
  }
  if(plan.status==='active'&&phase==='result'){
   at=host.action.until+60000;
   advanceWorld(world,at);
  }
  return {world,serverTime:at,clockRate:1,mode:'escenario_local'};
 }
 const p=world.people[personIndex];p.action=null;
 if(kind==='meal')p.needs.saciedad=0;
 else if(kind==='sleep')p.needs.energia=0;
 else if(kind==='bath')p.needs.bano=0;
 else if(kind==='wash')p.needs.higiene=0;
 else if(kind==='desk'){p.profile.interests=['estudio'];p.needs.diversion=0}
 else if(kind==='computer'){p.profile.interests=['ordenador'];p.needs.diversion=0}
 else if(kind==='sofa')p.needs.energia=40;
 else if(kind==='clean'){world.households[p.homeId].mess=100;p.profile.traits.orden=1}
 advanceWorld(world,start+60000);
 let at=p.action.start+(p.action.travelMs||0)+180000;
 if(kind==='meal'){const stage=p.action.meal.stages.find(s=>s.kind===phase)||p.action.meal.stages.at(-1);at=stage.start+(stage.end-stage.start)/2}
 return {world,serverTime:at,clockRate:1,mode:'escenario_local'};
}
