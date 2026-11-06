// Núcleo determinista independiente de la representación y del alojamiento.
import { DAY_RATE } from './clock.js';
import { residents } from './profiles.js';
import { advanceNeeds, urgency } from './needs.js';
import { openConversation, finishConversation } from './social.js';
import { recordKitchenWait, attemptKitchenRepair, releaseKitchen, coolConflicts } from './conflicts.js';
import { recordExperience, preferenceBonus } from './learning.js';
import { findRoute } from './navigation.js';
import { proposeRelationship, respondToProposal, endRelationship } from './romance.js';
import { moodFrom } from './mood.js';
import { validateWorldEnvelope } from './world-schema.js';
import { mealPosition } from './meal-stage.js';

export const ENGINE_VERSION = 5;
export const SCHEMA_VERSION = 1;
const MINUTE=60000, HOUR=60*MINUTE;
const limit=(n,min=0,max=100)=>Math.max(min,Math.min(max,n));
const definitions={
 esperar:{label:'esperando un camino libre',minutes:3,need:'energia',gain:0,resource:null},
 practicar:{label:'disfrutando de su afición',minutes:30,need:'diversion',gain:25,resource:null},
 ver_tv:{label:'viendo la tele',minutes:40,need:'diversion',gain:25,resource:'sofa'},
 fumar:{label:'fumando en el jardín',minutes:12,need:'diversion',gain:8,resource:null},
 pasear:{label:'dando un paseo',minutes:15,need:'diversion',gain:12,resource:null},
 dormir:{label:'durmiendo',minutes:480,need:'energia',gain:0,resource:'bed'},
 comer:{label:'comiendo',minutes:25,need:'saciedad',gain:60,resource:'kitchen'},
 usar_bano:{label:'usando el baño',minutes:5,need:'bano',gain:80,resource:'bathroom'},
 asearse:{label:'aseándose',minutes:10,need:'higiene',gain:70,resource:'bathroom'},
 jugar:{label:'jugando al ordenador',minutes:45,need:'diversion',gain:30,resource:'computer'},
 estudiar:{label:'estudiando',minutes:40,need:'diversion',gain:4,resource:'computer'},
 limpiar:{label:'recogiendo y limpiando la cocina',minutes:18,need:'diversion',gain:0,resource:'kitchen'},
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
 return {worldId,schemaVersion:SCHEMA_VERSION,simulationVersion:ENGINE_VERSION,seed,randomState:seed>>>0,worldVersion:0,lastSimulatedAt:now,timezone,eventSequence:0,events:[],reservations:{},households:Object.fromEntries(['piso-1','piso-2','piso-3','piso-4'].map(id=>[id,{mess:0}])),people:residents.map(({identity,profile},i)=>({id:identity.id,name:identity.name,homeId:identity.homeId,profile:structuredClone(profile),needs:{saciedad:65+i%5*4,energia:65+i%4*5,higiene:75,compania:60,diversion:65,bano:75},action:null,learned:{skills:{},preferences:{}},memories:[],relationships:{}}))};
}
function choose(world,p,at){
 const hour=localHour(at,'UTC'),sleepTime=inSleepWindow(hour,p.profile),n=p.needs,options=[];
 for(const [id,a] of Object.entries(definitions)){
  if(id==='charlar'||id==='esperar')continue; // Conversación compartida se incorpora con consentimiento en una fase posterior.
  if(id==='fumar'&&(!['Catalán','Linkal','May','Mei'].includes(p.name)||at-(p.lastSmokedAt??-Infinity)<3*HOUR||sleepTime||n.energia<25))continue;
  let gym=id==='practicar'&&p.profile.interests.includes('gimnasio');
  let hobby=null;
  if(gym&&world.reservations['comunidad:gimnasio']?.until>at){
   hobby=p.profile.interests.find(interest=>interest!=='gimnasio')||null;
   if(!hobby)continue;
   gym=false;
  }
  const key=gym?'comunidad:gimnasio':a.resource?(p.homeId+':'+a.resource+(['bed','computer'].includes(a.resource)?':'+p.id:'')):null;
  if(key&&world.reservations[key]&&world.reservations[key].until>at)continue;
  const mess=world.households[p.homeId]?.mess??0;
  if(id==='limpiar'&&mess<20)continue;
  // Evitar volver a acostarse nada más despertarse con energía suficiente.
  if(id==='dormir'&&n.energia>=(sleepTime?85:35))continue;
  let score=id==='limpiar'?(.08+mess/100*(.55+.25*(p.profile.traits.orden??.5))):urgency(n[a.need])*.65;
  if(id==='dormir')score+=sleepTime?.55:-.15;
  if(id==='comer'&&[8,9,13,14,20,21].includes(hour))score+=.18;
  if(id==='jugar'&&p.profile.interests.includes('ordenador'))score+=.16;
  if(id==='estudiar'&&p.profile.interests.includes('estudio'))score+=.2;
  if(id==='leer')score+=.02;
  if(id==='practicar')score+=.14;
  if(id==='ver_tv')score+=.10;
  if(id==='pasear')score+=.09;
  if(id==='fumar')score+=.12;
  const others=world.people.filter(other=>other.id!==p.id&&other.action?.id===id).length;
  if(id==='leer'&&others>=2)continue;
  if(!['dormir','comer','charlar'].includes(id))score-=Math.max(0,others-1)*.10;
  score+=preferenceBonus(p,id);
  if(p.lastAction===id)score-=.16;
  if(n.energia<20&&id!=='dormir')score-=.4;
  options.push({id,key,hobby,score:score+random(world)*.04});
 }
 options.sort((a,b)=>b.score-a.score);
 return options[0];
}
const homes={'piso-1':[-10,-7],'piso-2':[10,-7],'piso-3':[-10,7],'piso-4':[10,7]};
function roomPosition(p){const [cx,cz]=homes[p.homeId];const slot=residents.filter(r=>r.identity.homeId===p.homeId).findIndex(r=>r.identity.id===p.id);return {x:cx-7+Math.max(0,slot)*3.5+2.5,z:cz-6+3.7}}
function destination(p,id){const [cx,cz]=homes[p.homeId];if(id==='pasear')return {x:0,z:16};if(id==='fumar'){const index=['Catalán','Linkal','May','Mei'].indexOf(p.name);return {x:-3+index*2,z:17}}if(['dormir','jugar','estudiar'].includes(id))return roomPosition(p);if(['asearse','usar_bano'].includes(id))return {x:cx-5.5,z:cz+4.25};if(id==='comer'||id==='limpiar')return {x:cx-1,z:cz+1};return {x:cx+1,z:cz+1}}
function routeFor(p,to){return findRoute(p.position??roomPosition(p),to)}
function planMeal(p,at){
 const [cx,cz]=homes[p.homeId],stages=[];let cursor=at,position=p.position??roomPosition(p);
 const walk=(kind,target)=>{const route=findRoute(position,target);if(!route.length)return false;let length=0;for(let i=1;i<route.length;i++)length+=Math.hypot(route[i].x-route[i-1].x,route[i].z-route[i-1].z);const duration=Math.round(length*1500*DAY_RATE);stages.push({kind,start:cursor,end:cursor+duration,route});cursor+=duration;position=route.at(-1);return true};
 const pause=(kind,duration)=>{stages.push({kind,start:cursor,end:cursor+duration,route:[position]});cursor+=duration};
 if(!walk('to_fridge',{x:cx+1.3,z:cz+4.35}))return null;
 pause('fridge',MINUTE);
 if(!walk('to_stove',{x:cx-2.8,z:cz+4.35}))return null;
 pause('cooking',8*MINUTE);
 if(!walk('to_table',{x:cx+1.9,z:cz+1.2}))return null;
 const eatingStart=cursor;pause('eating',25*MINUTE);
 return {stages,eatingStart,eatMs:25*MINUTE,seat:{x:cx+1.9,z:cz+1.2},until:cursor};
}
function acceptsInvitation(world,p,other){const tension=p.relationships?.[other.id]?.tension??0;const socialNeed=(100-p.needs.compania)/100;const chance=Math.max(.1,Math.min(.9,.25+.35*p.profile.traits.sociabilidad+.3*socialNeed-tension/200));return random(world)<chance}
function start(world,p,at,forced=null){
 const kitchen=world.reservations[p.homeId+':kitchen'];
 if(p.needs.saciedad<50&&kitchen&&kitchen.until>at&&kitchen.personId!==p.id){const occupant=world.people.find(q=>q.id===kitchen.personId);if(occupant)recordKitchenWait(world,p,occupant,at)}
 const selected=forced??choose(world,p,at);if(!selected)return;
 const def=definitions[selected.id];
 const gym=selected.id==='practicar'&&selected.key==='comunidad:gimnasio';
 const meal=selected.id==='comer'?planMeal(p,at):null;
 const route=selected.id==='comer'?(meal?.stages[0].route??[]):routeFor(p,gym?{x:9,z:17}:destination(p,selected.id));
 if(!route.length){const pos=p.position??roomPosition(p);p.action={id:'esperar',label:definitions.esperar.label,start:at,until:at+3*MINUTE,resource:null,route:[pos],travelMs:0};event(world,'route_blocked',p,at,{action:selected.id});return}
 let length=0;for(let i=1;i<route.length;i++)length+=Math.hypot(route[i].x-route[i-1].x,route[i].z-route[i-1].z);const travelMs=Math.round(length*1500*DAY_RATE),until=meal?.until??(at+travelMs+def.minutes*MINUTE);
 const hobby=selected.hobby||p.profile.interests[0];const label=gym?'levantando pesas en el gimnasio comunitario':selected.id==='practicar'&&hobby?'disfrutando de '+hobby:def.label;
 p.action={id:selected.id,label,start:at,until,resource:selected.key,route,travelMs};
 if(gym)p.action.activity='gimnasio';
 if(meal)p.action.meal=meal;
 if(['asearse','usar_bano'].includes(selected.id))p.action.care={durationMs:def.minutes*MINUTE};
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
 if(action.id==='fumar')p.lastSmokedAt=at;
 if(action.id==='comer')world.households[p.homeId].mess=limit(world.households[p.homeId].mess+12);
 if(action.id==='limpiar'){
  const home=world.households[p.homeId];home.mess=limit(home.mess-45);
  event(world,'cleaning_finished',p,at,{homeId:p.homeId,mess:home.mess});
 }
 if(def.gain&&!(action.id==='comer'&&action.meal)&&!(['asearse','usar_bano'].includes(action.id)&&action.care))p.needs[def.need]=limit(p.needs[def.need]+def.gain);
 if(action.resource&&world.reservations[action.resource]?.personId===p.id){delete world.reservations[action.resource];if(action.resource.endsWith(':kitchen'))releaseKitchen(world,p,at)}
 const skillByAction={jugar:'juegos',estudiar:'estudio',comer:'cocina',practicar:'aficiones'};
 if(skillByAction[action.id]){
  const likes=(action.id==='jugar'&&p.profile.interests.includes('ordenador'))||(action.id==='estudiar'&&p.profile.interests.includes('estudio'))||action.id==='practicar';
  recordExperience(p,{activity:action.id,skill:skillByAction[action.id],minutes:Math.max(0,(at-action.start-(action.travelMs||0))/MINUTE),reward:likes?.5:0});
 }
 if(action.meal?.stages)p.position=action.meal.stages.at(-1).route.at(-1);else if(action.route?.length)p.position=action.route[action.route.length-1];p.lastAction=action.id;p.action=null;event(world,'action_finished',p,at,{action:action.id});
}
// Una interrupción conserva el punto alcanzado, sin completar ni premiar la acción.
function positionDuring(action,fallback,at){
 const meal=mealPosition(action,at);if(meal)return {x:meal.x,z:meal.z};
 const route=action.route;
 if(!route?.length)return fallback;
 if(route.length===1||!action.travelMs||at>=action.start+action.travelMs)return route.at(-1);
 const lengths=route.slice(1).map((p,i)=>Math.hypot(p.x-route[i].x,p.z-route[i].z));
 const total=lengths.reduce((sum,n)=>sum+n,0);
 let left=total*Math.max(0,Math.min(1,(at-action.start)/action.travelMs));
 for(let i=0;i<lengths.length;i++){const d=lengths[i];if(d&&left<=d){const a=route[i],b=route[i+1],q=left/d;return {x:a.x+(b.x-a.x)*q,z:a.z+(b.z-a.z)*q}}left-=d}
 return route.at(-1);
}
function addressUrgentNeed(world,p,at){
 const old=p.action;
 if(!old||!['practicar','ver_tv','pasear','jugar','estudiar','descansar','leer','esperar','limpiar','fumar'].includes(old.id))return false;
 const critical=p.needs.bano<12?'usar_bano':p.needs.saciedad<10?'comer':p.needs.energia<8?'dormir':null;
 if(!critical)return false;
 const resource=definitions[critical].resource;
 const key=p.homeId+':'+resource+(resource==='bed'?':'+p.id:'');
 if(world.reservations[key]?.until>at&&world.reservations[key].personId!==p.id)return false;
 const position=positionDuring(old,p.position??roomPosition(p),at);
 if(!findRoute(position,destination(p,critical)).length)return false;
 if(old.resource&&world.reservations[old.resource]?.personId===p.id)delete world.reservations[old.resource];
 p.position=position;p.action=null;p.lastAction=old.id;
 event(world,'activity_interrupted',p,at,{action:old.id,reason:'necesidad urgente',nextAction:critical});
 start(world,p,at,{id:critical,key});return true;
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
 validateWorldEnvelope(world,{schemaVersion:SCHEMA_VERSION,simulationVersion:ENGINE_VERSION});
 if(world.simulationVersion<2){const initial=new Map(residents.map(r=>[r.identity.id,r.profile]));for(const p of world.people){if(p.profile.provenance==='provisional'&&initial.has(p.id))p.profile={...p.profile,traits:initial.get(p.id).traits}}world.simulationVersion=2}
 if(world.simulationVersion<3){for(const p of world.people){p.position=p.position??roomPosition(p);if(p.action&&!p.action.route){p.action.route=[p.position];p.action.travelMs=0}}world.simulationVersion=3}
 if(world.simulationVersion<4){for(const p of world.people)if(!Number.isFinite(p.needs.bano))p.needs.bano=75;world.simulationVersion=4}
 if(world.simulationVersion<5){
  world.households??={};
  for(const id of Object.keys(homes))world.households[id]??={mess:0};
  world.simulationVersion=5;
 }
 if(!Number.isFinite(target)||target<world.lastSimulatedAt)throw new RangeError('El reloj no puede retroceder');
 if(!Number.isInteger(maxMinutes)||maxMinutes<1||maxMinutes>10080)throw new RangeError('Límite de lote inválido');
 const end=Math.min(target,world.lastSimulatedAt+maxMinutes*MINUTE);
 while(world.lastSimulatedAt<end){
  const at=world.lastSimulatedAt,step=Math.min(MINUTE,end-at),next=at+step;
  coolConflicts(world,at);
  for(const p of world.people)if(p.action&&(p.action.until<=at||(p.action.id==='dormir'&&at>=p.action.start+(p.action.travelMs||0)&&at>=p.action.start+(p.action.travelMs||0)+4*HOUR&&p.needs.energia>=80&&!inSleepWindow(localHour(at,'UTC'),p.profile))))finish(world,p,at);
  // Una reserva solo es válida mientras su dueño siga usando ese recurso.
  // Si la acción continúa, reparar su vencimiento evita reservas simultáneas.
  for(const [key,reservation] of Object.entries(world.reservations)){
   const owner=world.people.find(p=>p.id===reservation?.personId),action=owner?.action;
   if(!action||action.resource!==key||!Number.isFinite(action.until)||action.until<=at)delete world.reservations[key];
   else reservation.until=action.until;
  }
  for(const p of world.people)addressUrgentNeed(world,p,at);
  // Una invitación puede interrumpir ocio tranquilo si ambos están disponibles,
  // cerca y han pasado al menos tres horas de juego desde su último encuentro.
  const canInvite=p=>p.action&&(['leer','pasear','ver_tv','descansar'].includes(p.action.id)||(p.action.id==='practicar'&&p.action.activity!=='gimnasio'))
    &&at-p.action.start>=10*MINUTE&&at>=p.action.start+(p.action.travelMs||0)
    &&p.action.until-at>=5*MINUTE&&at-(p.lastSocialAt??-Infinity)>=3*HOUR;
  for(const a of world.people){
   if(!canInvite(a)||a.needs.compania>75||random(world)>.05)continue;
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
   const meal=p.action?.id==='comer'&&p.action.meal;
   if(meal){
    const eatingStarts=meal.eatingStart??(p.action.start+(p.action.travelMs||0)+meal.prepareMs);
    const eatingEnds=Math.min(p.action.until,eatingStarts+meal.eatMs);
    const elapsed=Math.max(0,Math.min(next,eatingEnds)-Math.max(at,eatingStarts));
    if(elapsed)p.needs.saciedad=limit(p.needs.saciedad+definitions.comer.gain*elapsed/meal.eatMs);
   }
   // El aseo y el baño solo recuperan la necesidad durante su uso efectivo.
   const action=p.action,care=action?.care;
   if(care&&['asearse','usar_bano'].includes(action.id)&&Number.isFinite(care.durationMs)&&care.durationMs>0){
    const starts=action.start+(action.travelMs||0),ends=Math.min(action.until,starts+care.durationMs);
    const elapsed=Math.max(0,Math.min(next,ends)-Math.max(at,starts));
    if(elapsed){const def=definitions[action.id];p.needs[def.need]=limit(p.needs[def.need]+def.gain*elapsed/care.durationMs)}
   }
   p.mood=moodFrom(p);
  }
  world.lastSimulatedAt=next;
 }
 world.worldVersion++;
 return {world,complete:world.lastSimulatedAt>=target};
}
