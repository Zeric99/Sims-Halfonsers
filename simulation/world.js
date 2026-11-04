// Núcleo determinista independiente de la representación y del alojamiento.
import { residents } from './profiles.js';
import { advanceNeeds, urgency } from './needs.js';
import { openConversation, finishConversation } from './social.js';
import { recordKitchenWait, attemptKitchenRepair, releaseKitchen, coolConflicts } from './conflicts.js';
import { recordExperience, preferenceBonus } from './learning.js';
import { findRoute } from './navigation.js';
import { proposeRelationship, respondToProposal, endRelationship } from './romance.js';
import { moodFrom } from './mood.js';

export const ENGINE_VERSION = 4;
export const SCHEMA_VERSION = 1;
const MINUTE=60000, HOUR=60*MINUTE;
const limit=(n,min=0,max=100)=>Math.max(min,Math.min(max,n));
const definitions={
 esperar:{label:'esperando un camino libre',minutes:3,need:'energia',gain:0,resource:null},
 practicar:{label:'disfrutando de su afición',minutes:30,need:'diversion',gain:25,resource:null},
 ver_tv:{label:'viendo la tele',minutes:40,need:'diversion',gain:25,resource:'sofa'},
 pasear:{label:'dando un paseo',minutes:15,need:'diversion',gain:12,resource:null},
 dormir:{label:'durmiendo',minutes:480,need:'energia',gain:0,resource:'bed'},
 comer:{label:'comiendo',minutes:25,need:'saciedad',gain:60,resource:'kitchen'},
 usar_bano:{label:'usando el baño',minutes:5,need:'bano',gain:80,resource:'bathroom'},
 asearse:{label:'aseándose',minutes:10,need:'higiene',gain:70,resource:'bathroom'},
 jugar:{label:'jugando al ordenador',minutes:45,need:'diversion',gain:30,resource:'computer'},
 estudiar:{label:'estudiando',minutes:40,need:'diversion',gain:4,resource:'computer'},
 descansar:{label:'descansando',minutes:25,need:'energia',gain:8,resource:'sofa'},
 leer:{label:'leyendo',minutes:30,need:'diversion',gain:18,resource:null},
 charlar:{label:'charlando',minutes:8,need:'compania',gain:22,resource:null}
};
function random(world){world.randomState=(Math.imul(world.randomState,1664525)+1013904223)>>>0;return world.randomState/4294967296}
function localHour(ms,timezone){return Number(new Intl.DateTimeFormat('en-GB',{timeZone:timezone,hour:'2-digit',hourCycle:'h23'}).format(ms))}
function inSleepWindow(hour,profile){const duration=(profile.wakeHour-profile.sleepHour+24)%24;return (hour-profile.sleepHour+24)%24<duration}
function event(world,type,person,at,extra={}){world.events.push({id:world.worldId+':'+(++world.eventSequence),type,personId:person.id,at,...extra});if(world.events.length>500)world.events.splice(0,world.events.length-500)}
export function createWorld({worldId='casa',seed=123456,now=Date.now(),timezone='Europe/Madrid'}={}){
 if(!Number.isFinite(now)||!Number.isInteger(seed))throw new TypeError('Reloj o semilla inválidos');
 return {worldId,schemaVersion:SCHEMA_VERSION,simulationVersion:ENGINE_VERSION,seed,randomState:seed>>>0,worldVersion:0,lastSimulatedAt:now,timezone,eventSequence:0,events:[],reservations:{},people:residents.map(({identity,profile},i)=>({id:identity.id,name:identity.name,homeId:identity.homeId,profile,needs:{saciedad:65+i%5*4,energia:65+i%4*5,higiene:75,compania:60,diversion:65,bano:75},action:null,learned:{skills:{},preferences:{}},memories:[],relationships:{}}))};
}
function choose(world,p,at){
 const hour=localHour(at,'UTC'),sleepTime=inSleepWindow(hour,p.profile),n=p.needs,options=[];
 for(const [id,a] of Object.entries(definitions)){
  if(id==='charlar'||id==='esperar')continue; // Conversación compartida se incorpora con consentimiento en una fase posterior.
  const key=a.resource?(p.homeId+':'+a.resource+(['bed','computer'].includes(a.resource)?':'+p.id:'')):null;
  if(key&&world.reservations[key]&&world.reservations[key].until>at)continue;
  let score=urgency(n[a.need])*.65;
  if(id==='dormir')score+=sleepTime?.55:-.15;
  if(id==='comer'&&[8,9,13,14,20,21].includes(hour))score+=.18;
  if(id==='jugar'&&p.profile.interests.includes('ordenador'))score+=.16;
  if(id==='estudiar'&&p.profile.interests.includes('estudio'))score+=.2;
  if(id==='leer')score+=.02;
  if(id==='practicar')score+=.14;
  if(id==='ver_tv')score+=.10;
  if(id==='pasear')score+=.09;
  const others=world.people.filter(other=>other.id!==p.id&&other.action?.id===id).length;
  if(id==='leer'&&others>=2)continue;
  if(!['dormir','comer','charlar'].includes(id))score-=Math.max(0,others-1)*.10;
  score+=preferenceBonus(p,id);
  if(p.lastAction===id)score-=.16;
  if(n.energia<20&&id!=='dormir')score-=.4;
  options.push({id,key,score:score+random(world)*.04});
 }
 options.sort((a,b)=>b.score-a.score);
 return options[0];
}
const homes={'piso-1':[-10,-7],'piso-2':[10,-7],'piso-3':[-10,7],'piso-4':[10,7]};
function roomPosition(p){const [cx,cz]=homes[p.homeId];const slot=residents.filter(r=>r.identity.homeId===p.homeId).findIndex(r=>r.identity.id===p.id);return {x:cx-7+Math.max(0,slot)*3.5+2.5,z:cz-6+3.7}}
function destination(p,id){const [cx,cz]=homes[p.homeId];if(id==='pasear')return {x:0,z:16};if(['dormir','jugar','estudiar'].includes(id))return roomPosition(p);if(['asearse','usar_bano'].includes(id))return {x:cx+.2,z:cz+3.6};if(id==='comer')return {x:cx-1,z:cz+1};return {x:cx+1,z:cz+1}}
function routeFor(p,to){return findRoute(p.position??roomPosition(p),to)}
function acceptsInvitation(world,p,other){const tension=p.relationships?.[other.id]?.tension??0;const socialNeed=(100-p.needs.compania)/100;const chance=Math.max(.1,Math.min(.9,.25+.35*p.profile.traits.sociabilidad+.3*socialNeed-tension/200));return random(world)<chance}
function start(world,p,at){
 const kitchen=world.reservations[p.homeId+':kitchen'];
 if(p.needs.saciedad<50&&kitchen&&kitchen.until>at&&kitchen.personId!==p.id){const occupant=world.people.find(q=>q.id===kitchen.personId);if(occupant)recordKitchenWait(world,p,occupant,at)}
 const selected=choose(world,p,at);if(!selected)return;
 const def=definitions[selected.id];
 const route=routeFor(p,destination(p,selected.id));
 if(!route.length){const pos=p.position??roomPosition(p);p.action={id:'esperar',label:definitions.esperar.label,start:at,until:at+3*MINUTE,resource:null,route:[pos],travelMs:0};event(world,'route_blocked',p,at,{action:selected.id});return}
 let length=0;for(let i=1;i<route.length;i++)length+=Math.hypot(route[i].x-route[i-1].x,route[i].z-route[i-1].z);const travelMs=Math.round(length*2000*48),until=at+travelMs+def.minutes*MINUTE;
 const hobby=p.profile.interests[0];const label=selected.id==='practicar'&&hobby?'disfrutando de '+hobby:def.label;
 p.action={id:selected.id,label,start:at,until,resource:selected.key,route,travelMs};
 if(selected.key)world.reservations[selected.key]={personId:p.id,until};
 event(world,'action_started',p,at,{action:selected.id});
}
function finish(world,p,at){
 const action=p.action,def=definitions[action.id];
 if(action.conversationId&&finishConversation(world,action.conversationId,at)){
  const conversation=world.conversations[action.conversationId];
  attemptKitchenRepair(world,conversation,at,random(world));
  const [a,b]=conversation.participants.map(id=>world.people.find(q=>q.id===id));
  if(a&&b&&a.profile.romanceEnabled&&b.profile.romanceEnabled){
   const key=[a.id,b.id].sort().join(':'),pair=world.romance?.couples?.[key],tension=Math.max(a.relationships?.[b.id]?.tension??0,b.relationships?.[a.id]?.tension??0);
   const repeated=Object.values(world.conflicts??{}).some(c=>c.participants.includes(a.id)&&c.participants.includes(b.id)&&c.severity>=3);
   if(pair?.status==='together'&&tension>=75&&repeated&&random(world)<.15)endRelationship(world,a,b,at,'conflictos de convivencia acumulados');
   else if(!pair||pair.status!=='together'){
    if(random(world)<.15){const offer=proposeRelationship(world,a,b,at);if(offer){const r=b.relationships?.[a.id];const chance=Math.max(.05,Math.min(.9,((r?.romanticInterest??0)+(r?.trust??0))/200));respondToProposal(world,offer.id,b.id,random(world)<chance,at)}}
   }
  }
 }
 if(def.gain)p.needs[def.need]=limit(p.needs[def.need]+def.gain);
 if(action.resource&&world.reservations[action.resource]?.personId===p.id){delete world.reservations[action.resource];if(action.resource.endsWith(':kitchen'))releaseKitchen(world,p,at)}
 const skillByAction={jugar:'juegos',estudiar:'estudio',comer:'cocina',practicar:'aficiones'};
 if(skillByAction[action.id]){
  const likes=(action.id==='jugar'&&p.profile.interests.includes('ordenador'))||(action.id==='estudiar'&&p.profile.interests.includes('estudio'))||action.id==='practicar';
  recordExperience(p,{activity:action.id,skill:skillByAction[action.id],minutes:Math.max(0,(at-action.start-(action.travelMs||0))/MINUTE),reward:likes?.5:0});
 }
 if(action.route?.length)p.position=action.route[action.route.length-1];p.lastAction=action.id;p.action=null;event(world,'action_finished',p,at,{action:action.id});
}
// En ausencia de visitantes no se simulan hechos ni cambios sociales.
export function resumeAfterAbsence(world,now,{idleThresholdMs=90000,wallNow=now,force=false}={}){
 const last=world.lastObservedAt ?? wallNow;
 if(!force && wallNow-last<=idleThresholdMs)return false;
 world.reservations={};
 for(const c of Object.values(world.conversations??{}))if(!c.finished){c.finished=true;c.cancelled=true}
 for(const p of world.people){
  p.action=null;
  p.position=roomPosition(p);
  // Descanso y comidas se presuponen, sin generar recuerdos ni relaciones.
  p.needs={...p.needs,saciedad:75,energia:75,higiene:75,bano:75,compania:Math.max(35,p.needs.compania),diversion:Math.max(40,p.needs.diversion)};
 }
 world.lastSimulatedAt=now-1;
 return true;
}
// Procesamiento acotado: el llamador persiste cada lote antes de continuar.
export function advanceWorld(world,target,{maxMinutes=720}={}){
 if(world.simulationVersion<2){const initial=new Map(residents.map(r=>[r.identity.id,r.profile]));for(const p of world.people){if(p.profile.provenance==='provisional'&&initial.has(p.id))p.profile={...p.profile,traits:initial.get(p.id).traits}}world.simulationVersion=2}
 if(world.simulationVersion<3){for(const p of world.people){p.position=p.position??roomPosition(p);if(p.action&&!p.action.route){p.action.route=[p.position];p.action.travelMs=0}}world.simulationVersion=3}
 if(world.simulationVersion<4){for(const p of world.people)if(!Number.isFinite(p.needs.bano))p.needs.bano=75;world.simulationVersion=4}
 if(!Number.isFinite(target)||target<world.lastSimulatedAt)throw new RangeError('El reloj no puede retroceder');
 if(!Number.isInteger(maxMinutes)||maxMinutes<1||maxMinutes>10080)throw new RangeError('Límite de lote inválido');
 const end=Math.min(target,world.lastSimulatedAt+maxMinutes*MINUTE);
 while(world.lastSimulatedAt<end){
  const at=world.lastSimulatedAt,step=Math.min(MINUTE,end-at),next=at+step;
  coolConflicts(world,at);
  for(const p of world.people)if(p.action&&(p.action.until<=at||(p.action.id==='dormir'&&at>=p.action.start+(p.action.travelMs||0)&&p.needs.energia>=60&&!inSleepWindow(localHour(at,'UTC'),p.profile))))finish(world,p,at);
  // Una invitación puede interrumpir ocio tranquilo si ambos están disponibles,
  // cerca y han pasado al menos tres horas de juego desde su último encuentro.
  const canInvite=p=>p.action&&['leer','pasear','ver_tv','descansar'].includes(p.action.id)
    &&at-p.action.start>=10*MINUTE&&at>=p.action.start+(p.action.travelMs||0)
    &&p.action.until-at>=5*MINUTE&&at-(p.lastSocialAt??-Infinity)>=3*HOUR;
  for(const a of world.people){
   if(!canInvite(a)||a.needs.compania>75||random(world)>.025)continue;
   const aPos=a.action.route?.at(-1)??a.position;
   const b=world.people.find(q=>q.id!==a.id&&q.homeId===a.homeId&&canInvite(q)
    &&q.action.route?.length&&aPos
    &&Math.hypot(q.action.route.at(-1).x-aPos.x,q.action.route.at(-1).z-aPos.z)<3);
   if(!b)continue;
   if(!acceptsInvitation(world,a,b)||!acceptsInvitation(world,b,a)){a.lastSocialAt=at;continue}
   for(const p of [a,b]){const old=p.action;if(old.resource&&world.reservations[old.resource]?.personId===p.id)delete world.reservations[old.resource];p.position=old.route?.at(-1)??p.position;p.action=null;event(world,'activity_interrupted',p,at,{action:old.id,reason:'invitación aceptada'})}
   if(openConversation(world,a,b,at)){a.lastSocialAt=at;b.lastSocialAt=at}
  }
  // Dos personas libres y próximas pueden aceptar una charla; una sola acción compartida.
  const available=world.people.filter(p=>!p.action);
  for(let i=0;i<available.length;i++){
   const a=available[i];if(a.action||random(world)>.35)continue;
   const b=available.slice(i+1).find(q=>!q.action&&q.homeId===a.homeId&&q.position&&a.position&&Math.hypot(q.position.x-a.position.x,q.position.z-a.position.z)<3);
   if(b&&acceptsInvitation(world,a,b)&&acceptsInvitation(world,b,a))openConversation(world,a,b,at);
  }
  for(const p of world.people){
   if(!p.action)start(world,p,at);
   // El desplazamiento y el sueño tienen efectos distintos incluso si el
   // personaje llega a la cama a mitad de un intervalo de simulación.
   const sleepStart=p.action?.id==='dormir'?p.action.start+(p.action.travelMs||0):Infinity;
   const awakeMs=Math.max(0,Math.min(step,sleepStart-at));
   const asleepMs=step-awakeMs;
   if(awakeMs)p.needs=advanceNeeds(p.needs,awakeMs/HOUR,{sleeping:false,sociability:p.profile.traits.sociabilidad});
   if(asleepMs)p.needs=advanceNeeds(p.needs,asleepMs/HOUR,{sleeping:true,sociability:p.profile.traits.sociabilidad});
   p.mood=moodFrom(p);
  }
  world.lastSimulatedAt=next;
 }
 world.worldVersion++;
 return {world,complete:world.lastSimulatedAt>=target};
}
