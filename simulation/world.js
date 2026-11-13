// Núcleo determinista independiente de la representación y del alojamiento.
import { DAY_RATE } from './clock.js';
import {activeGoal, advanceGoal, expireGoals, goalBonus, reflectAtNight} from './goals.js';
import {recipeFor} from './recipes.js';
import {freeResource} from './resources.js';
import {socialPulse} from './autonomy.js';
import {consent, coolTension} from './relationships.js';
import {canPauseForPlan, completePlan, hasUpcomingPlan, pausePlans, progressPlans} from './plans.js';
import {hasGroupCommitment,pauseGroups,progressGroups} from './group-events.js';
import {collectChronicle} from './chronicles.js';
import {bathroomRush,bathroomCall,bathroomDeparture} from './bathroom.js';
import { residents } from './profiles.js';
import {createResident} from './resident-state.js';
import { advanceNeeds, urgency } from './needs.js';
import { openConversation, finishConversation } from './social.js';
import { recordKitchenWait, attemptKitchenRepair, releaseKitchen, coolConflicts, checkNoise, hasAgreement, honorAgreement, recordIncident } from './conflicts.js';
import { recordExperience, preferenceBonus, cookMinutes, learnedQuiet } from './learning.js';
import { findRoute, canTalkAt } from './navigation.js';
import { updateRomance } from './romance.js';
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
 return {worldId,schemaVersion:SCHEMA_VERSION,simulationVersion:ENGINE_VERSION,seed,randomState:seed>>>0,worldVersion:0,lastSimulatedAt:now,timezone,eventSequence:0,events:[],reservations:{},households:Object.fromEntries(['piso-1','piso-2','piso-3','piso-4'].map(id=>[id,{mess:0}])),people:residents.map(createResident)};
}
function choose(world,p,at){
 const hour=localHour(at,'UTC'),sleepTime=inSleepWindow(hour,p.profile),n=p.needs,options=[];
 const safeForGoals=!sleepTime&&n.energia>=24&&n.saciedad>=28&&n.bano>=24;
 const protectsPlan=n.energia>=24&&n.saciedad>=28&&n.bano>=24&&hasUpcomingPlan(world,p,at);
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
  if(protectsPlan&&!canPauseForPlan({id,activity:gym?'gimnasio':null}))continue;
  const base=gym?'comunidad:gimnasio':a.resource?(p.homeId+':'+a.resource+(['bed','computer'].includes(a.resource)?':'+p.id:'')):null;
  const key=base?freeResource(world,base,at,a.resource==='sofa'?3:1):null;
  if(base&&!key)continue;
  const mess=world.households[p.homeId]?.mess??0;
  if(id==='limpiar'&&mess<20)continue;
  // Evitar volver a acostarse nada más despertarse con energía suficiente.
  if(id==='dormir'&&n.energia>=(sleepTime?85:35))continue;
  let score=id==='limpiar'?(.08+mess/100*(.55+.25*(p.profile.traits.orden??.5))):urgency(n[a.need])*.65;
  if(id==='limpiar'&&hasAgreement(world,p,'clean_dishes'))score+=.35;
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
  if(safeForGoals){
   score+=goalBonus(p,id,at);
   if(['leer','estudiar','practicar','pasear','jugar'].includes(id)&&id!==p.lastAction)
    score+=p.profile.traits.curiosidad*.025;
  }
  if(p.lastAction===id)score-=.16;
  if(n.energia<20&&id!=='dormir')score-=.4;
  options.push({id,key,hobby,score:score+random(world)*.04});
 }
 options.sort((a,b)=>b.score-a.score);
 return options[0];
}
const homes={'piso-1':[-10,-7],'piso-2':[10,-7],'piso-3':[-10,7],'piso-4':[10,7]};
function roomPosition(p){const [cx,cz]=homes[p.homeId];const slot=residents.filter(r=>r.identity.homeId===p.homeId).findIndex(r=>r.identity.id===p.id);return {x:cx-7+Math.max(0,slot)*3.5+2.5,z:cz-6+3.7}}
function destination(p,id){const [cx,cz]=homes[p.homeId];if(id==='pasear')return {x:0,z:16};if(id==='fumar'){const index=['Catalán','Linkal','May','Mei'].indexOf(p.name);return {x:-3+index*2,z:17}}if(['dormir','jugar','estudiar'].includes(id))return roomPosition(p);if(id==='asearse')return {x:cx-4.9,z:cz+4.65};if(id==='usar_bano')return {x:cx-5.5,z:cz+4.25};if(id==='limpiar')return {x:cx-1.5,z:cz+4.35};if(id==='comer')return {x:cx-1,z:cz+1};return {x:cx+1,z:cz+1}}
function routeFor(p,to){return findRoute(p.position??roomPosition(p),to)}
function planMeal(p,at,eventSequence){
 const goal=activeGoal(p,at);
 const recipe=recipeFor(p,eventSequence,goal?.kind==='recipe'?goal.recipe:undefined);
 const [cx,cz]=homes[p.homeId],stages=[];let cursor=at,position=p.position??roomPosition(p);
 const walk=(kind,target)=>{const route=findRoute(position,target);if(!route.length)return false;let length=0;for(let i=1;i<route.length;i++)length+=Math.hypot(route[i].x-route[i-1].x,route[i].z-route[i-1].z);const duration=Math.round(length*1500*DAY_RATE);stages.push({kind,start:cursor,end:cursor+duration,route});cursor+=duration;position=route.at(-1);return true};
 const pause=(kind,duration)=>{stages.push({kind,start:cursor,end:cursor+duration,route:[position]});cursor+=duration};
 if(!walk('to_fridge',{x:cx+1.3,z:cz+4.35}))return null;
 pause('fridge',MINUTE);
 if(!walk('to_stove',{x:cx-2.8,z:cz+4.35}))return null;
 pause('cooking',Math.round(cookMinutes(p,recipe)*MINUTE));
 if(!walk('to_table',{x:cx+1.9,z:cz+1.2}))return null;
 const eatingStart=cursor;pause('eating',25*MINUTE);
 return {recipe:recipe.id,recipeName:recipe.name,nutrition:recipe.nutrition,stages,eatingStart,eatMs:25*MINUTE,seat:{x:cx+1.9,z:cz+1.2},until:cursor};
}
function acceptsInvitation(world,p,other){return random(world)<consent(p,other,world.lastSimulatedAt)}
function start(world,p,at,forced=null){
 const kitchen=world.reservations[p.homeId+':kitchen'];
 if(p.needs.saciedad<50&&kitchen&&kitchen.until>at&&kitchen.personId!==p.id){const occupant=world.people.find(q=>q.id===kitchen.personId);if(occupant)recordKitchenWait(world,p,occupant,at)}
 const selected=forced??choose(world,p,at);if(!selected)return;
 const def=definitions[selected.id];
 const gym=selected.id==='practicar'&&selected.key==='comunidad:gimnasio';
 const meal=selected.id==='comer'?planMeal(p,at,world.eventSequence):null;
 const sofaSlot=selected.key?.includes(':sofa:')?Number(selected.key.split(':').at(-1)):null;
 const [homeX,homeZ]=homes[p.homeId],sofaSeat=sofaSlot===null?null:{x:homeX+4.2+(sofaSlot-1)*.77,z:homeZ+4.8};
 const route=selected.id==='comer'?(meal?.stages[0].route??[]):routeFor(p,sofaSeat?{x:sofaSeat.x,z:homeZ+3.95}:gym?{x:9,z:17}:destination(p,selected.id));
 if(!route.length){const pos=p.position??roomPosition(p);p.action={id:'esperar',label:definitions.esperar.label,start:at,until:at+3*MINUTE,resource:null,route:[pos],travelMs:0};event(world,'route_blocked',p,at,{action:selected.id});return}
 const rushing=selected.id==='usar_bano'&&bathroomRush(p);
 const call=rushing?bathroomCall(p,selected.wasTalking):null;
 let length=0;
 for(let i=1;i<route.length;i++)length+=Math.hypot(route[i].x-route[i-1].x,route[i].z-route[i-1].z);
 const travelMs=Math.round(length*(rushing?(call==='¡Me cago!'?570:730):1500)*DAY_RATE)
  +(bathroomDeparture({start:at,bathroomCall:call})-at);
 const until=meal?.until??(at+travelMs+def.minutes*MINUTE);
 const hobby=selected.hobby||p.profile.interests[0];const label=gym?'levantando pesas en el gimnasio comunitario':selected.id==='practicar'&&hobby?'disfrutando de '+hobby:def.label;
 p.action={id:selected.id,label,start:at,until,resource:selected.key,route,travelMs};
 if(rushing){p.action.bathroomRush=true;if(call)p.action.bathroomCall=call}
 if(gym)p.action.activity='gimnasio';
 if(selected.id==='ver_tv'&&(hasAgreement(world,p,'quiet_tv')||learnedQuiet(p,world,at+travelMs))){
  p.action.quiet=true;
  p.action.label='viendo la tele a volumen bajo';
 }
 if(sofaSeat)p.action.seat=sofaSeat;
 if(selected.id==='usar_bano')p.action.seat={x:homeX-6.35,z:homeZ+5.33};
 if(meal)p.action.meal=meal;
 if(['asearse','usar_bano'].includes(selected.id))p.action.care={durationMs:def.minutes*MINUTE};
 if(selected.key)world.reservations[selected.key]={personId:p.id,until};
 event(world,'action_started',p,at,{action:selected.id});
}
function finish(world,p,at){
 const action=p.action,def=definitions[action.id];
 if(action.conversationId&&finishConversation(world,action.conversationId,at)){
  const conversation=world.conversations[action.conversationId];
  if(conversation.planId)completePlan(world,conversation,at);
  else attemptKitchenRepair(world,conversation,at,random(world));
  updateRomance(world,conversation,at,()=>random(world));
 }
 if(action.id==='fumar')p.lastSmokedAt=at;
 if(action.id==='comer'){
  const home=world.households[p.homeId];
  home.mess=limit(home.mess+12);
  const affected=world.people.find(q=>q!==p&&q.homeId===p.homeId&&q.profile.traits.orden>=.55&&q.action?.id!=='dormir'
   &&Math.hypot((q.position?.x??0)-homes[p.homeId][0],(q.position?.z??0)-homes[p.homeId][1])<7);
  if(home.mess>=48&&affected)recordIncident(world,affected,p,'dishes',at);
 }
 if(action.id==='ver_tv'&&action.quiet)honorAgreement(world,p,'quiet_tv',at);
 if(action.id==='limpiar'){
  const home=world.households[p.homeId];home.mess=limit(home.mess-45);
  event(world,'cleaning_finished',p,at,{homeId:p.homeId,mess:home.mess});
  honorAgreement(world,p,'clean_dishes',at);
 }
 if(def.gain&&!(action.id==='comer'&&action.meal)&&!(['asearse','usar_bano'].includes(action.id)&&action.care))p.needs[def.need]=limit(p.needs[def.need]+def.gain);
 if(action.resource&&world.reservations[action.resource]?.personId===p.id){delete world.reservations[action.resource];if(action.resource.endsWith(':kitchen'))releaseKitchen(world,p,at)}
 const skillByAction={jugar:'juegos',estudiar:'estudio',comer:'cocina',practicar:'aficiones'};
 if(skillByAction[action.id]){
  const likes=(action.id==='jugar'&&p.profile.interests.includes('ordenador'))||(action.id==='estudiar'&&p.profile.interests.includes('estudio'))||action.id==='practicar';
  const cooking=action.meal?.stages?.find(stage=>stage.kind==='cooking');
  const effectiveMs=action.id==='comer'
   ?(cooking?cooking.end-cooking.start:action.meal?.prepareMs??0)
   :action.until-action.start-(action.travelMs??0);
  recordExperience(p,{activity:action.id,skill:skillByAction[action.id],
   minutes:Math.max(0,effectiveMs/MINUTE),reward:likes?.5:0,recipe:action.meal?.recipe});
 }
 advanceGoal(p,'practice',{activity:action.id},at);
 if(action.meal?.recipe)advanceGoal(p,'recipe',{recipe:action.meal.recipe},at);
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
 const departure=bathroomDeparture(action);
 let left=total*Math.max(0,Math.min(1,(at-departure)/Math.max(1,action.start+action.travelMs-departure)));
 for(let i=0;i<lengths.length;i++){const d=lengths[i];if(d&&left<=d){const a=route[i],b=route[i+1],q=left/d;return {x:a.x+(b.x-a.x)*q,z:a.z+(b.z-a.z)*q}}left-=d}
 return route.at(-1);
}
function addressUrgentNeed(world,p,at){
 const old=p.action;
 if(!old)return false;
 const canInterrupt=old.planId||old.groupId||['practicar','ver_tv','pasear','jugar','estudiar','descansar','leer','esperar','limpiar','fumar'].includes(old.id);
 const critical=bathroomRush(p)&&(canInterrupt||old.conversationId)?'usar_bano':
  canInterrupt&&p.needs.saciedad<10?'comer':canInterrupt&&p.needs.energia<8?'dormir':null;
 if(!critical)return false;
 const resource=definitions[critical].resource;
 const key=p.homeId+':'+resource+(resource==='bed'?':'+p.id:'');
 if(world.reservations[key]?.until>at&&world.reservations[key].personId!==p.id)return false;
 const position=positionDuring(old,p.position??roomPosition(p),at);
 if(!findRoute(position,destination(p,critical)).length)return false;
 const conversation=old.conversationId&&world.conversations?.[old.conversationId];
 const wasTalking=old.id==='charlar';
 if(critical==='usar_bano'&&conversation&&!conversation.planId&&!conversation.finished){
  conversation.finished=true;conversation.cancelled=true;conversation.cancelledAt=at;
  for(const other of world.people.filter(q=>q!==p&&q.action?.conversationId===conversation.id)){
   other.position=positionDuring(other.action,other.position,at);
   other.action=null;
  }
 }
 if(old.resource&&world.reservations[old.resource]?.personId===p.id)delete world.reservations[old.resource];
 p.position=position;p.action=null;p.lastAction=old.id;
 event(world,'activity_interrupted',p,at,{action:old.id,reason:'necesidad urgente',nextAction:critical,
  ...(critical==='usar_bano'&&wasTalking?{bathroomCall:bathroomCall(p,true)}:{})});
 start(world,p,at,{id:critical,key,wasTalking});return true;
}
// En ausencia de visitantes no se simulan hechos ni cambios sociales.
export function resumeAfterAbsence(world,now,{idleThresholdMs=90000,wallNow=now,force=false}={}){
 const last=world.lastObservedAt ?? wallNow;
 if(!force && wallNow-last<=idleThresholdMs)return false;
 world.reservations={};
 pausePlans(world,now);
 pauseGroups(world,now);
 for(const c of Object.values(world.conversations??{}))if(!c.finished){c.finished=true;c.cancelled=true}
 for(const meeting of Object.values(world.meetings??{}))if(!meeting.finished){meeting.finished=true;meeting.cancelled=true}
 for(const p of world.people){
  p.action=null;
  p.position=roomPosition(p);
  // Descanso y comidas se presuponen, sin generar recuerdos ni relaciones.
  p.needs={...p.needs,saciedad:75,energia:(localHour(now,'UTC')>=7&&localHour(now,'UTC')<23)?90:35,higiene:75,bano:75,compania:Math.max(35,p.needs.compania),diversion:Math.max(40,p.needs.diversion)};
 }
 world.lastReflectionDay=Math.floor((now-23*HOUR)/(24*HOUR));
 world.lastSimulatedAt=now-1;
 return true;
}
// Procesamiento acotado: el llamador persiste cada lote antes de continuar.
export function advanceWorld(world,target,{maxMinutes=720}={}){
 validateWorldEnvelope(world,{schemaVersion:SCHEMA_VERSION,simulationVersion:ENGINE_VERSION});
 if(!Number.isFinite(target)||target<world.lastSimulatedAt)throw new RangeError('El reloj no puede retroceder');
 if(!Number.isInteger(maxMinutes)||maxMinutes<1||maxMinutes>10080)throw new RangeError('Límite de lote inválido');
 if(world.simulationVersion<2){const initial=new Map(residents.map(r=>[r.identity.id,r.profile]));for(const p of world.people){if(p.profile.provenance==='provisional'&&initial.has(p.id))p.profile={...p.profile,traits:initial.get(p.id).traits}}world.simulationVersion=2}
 if(world.simulationVersion<3){for(const p of world.people){p.position=p.position??roomPosition(p);if(p.action&&!p.action.route){p.action.route=[p.position];p.action.travelMs=0}}world.simulationVersion=3}
 if(world.simulationVersion<4){for(const p of world.people)if(!Number.isFinite(p.needs.bano))p.needs.bano=75;world.simulationVersion=4}
 if(world.simulationVersion<5){
  world.households??={};
  for(const id of Object.keys(homes))world.households[id]??={mess:0};
  world.simulationVersion=5;
 }
 const end=Math.min(target,world.lastSimulatedAt+maxMinutes*MINUTE);
 collectChronicle(world,world.lastSimulatedAt);
 let nextChronicle=world.lastSimulatedAt+30*MINUTE;
 while(world.lastSimulatedAt<end){
  const at=world.lastSimulatedAt,step=Math.min(MINUTE,end-at),next=at+step;
  coolConflicts(world,at);
  expireGoals(world,at);
  coolTension(world,step/HOUR);
  for(const p of world.people)if(p.action&&(p.action.until<=at||(p.action.id==='dormir'&&at>=p.action.start+(p.action.travelMs||0)&&at>=p.action.start+(p.action.travelMs||0)+4*HOUR&&p.needs.energia>=80&&!inSleepWindow(localHour(at,'UTC'),p.profile))))finish(world,p,at);
  // Una reserva solo es válida mientras su dueño siga usando ese recurso.
  // Si la acción continúa, reparar su vencimiento evita reservas simultáneas.
  for(const [key,reservation] of Object.entries(world.reservations)){
   if(reservation.planId&&world.plans?.[reservation.planId]?.keys?.includes(key)
    &&['travelling','active'].includes(world.plans[reservation.planId].status)&&reservation.until>at)continue;
   const owner=world.people.find(p=>p.id===reservation?.personId),action=owner?.action;
   if(!action||action.resource!==key||!Number.isFinite(action.until)||action.until<=at)delete world.reservations[key];
   else reservation.until=action.until;
  }
  for(const p of world.people)addressUrgentNeed(world,p,at);
  progressGroups(world,at,positionDuring,()=>random(world),step);
  progressPlans(world,at,positionDuring,()=>random(world));
  checkNoise(world,at);
  socialPulse(world,at,()=>random(world));
  // Una invitación puede interrumpir ocio tranquilo si ambos están disponibles,
  // cerca y han pasado al menos tres horas de juego desde su último encuentro.
  const canInvite=p=>p.action&&!hasUpcomingPlan(world,p,at)&&!hasGroupCommitment(world,p.id,at)&&!p.action.planId&&!p.action.meetingId&&(['leer','pasear','ver_tv','descansar'].includes(p.action.id)||(p.action.id==='practicar'&&p.action.activity!=='gimnasio'))
    &&at-p.action.start>=10*MINUTE&&at>=p.action.start+(p.action.travelMs||0)
    &&p.action.until-at>=5*MINUTE&&at-(p.lastSocialAt??-Infinity)>=3*HOUR;
  for(const a of world.people){
   if(!canInvite(a)||a.needs.compania>75||random(world)>.05)continue;
   const aPos=a.action.route?.at(-1)??a.position;
   const b=world.people.find(q=>q.id!==a.id&&q.homeId===a.homeId&&canInvite(q)
    &&q.action.route?.length&&aPos
    &&canTalkAt(q.action.route.at(-1),aPos));
   if(!b)continue;
   if(!acceptsInvitation(world,a,b)||!acceptsInvitation(world,b,a)){a.lastSocialAt=at;continue}
   for(const p of [a,b]){const old=p.action;if(old.resource&&world.reservations[old.resource]?.personId===p.id)delete world.reservations[old.resource];p.position=old.route?.at(-1)??p.position;p.action=null;event(world,'activity_interrupted',p,at,{action:old.id,reason:'invitación aceptada'})}
   if(openConversation(world,a,b,at)){a.lastSocialAt=at;b.lastSocialAt=at}
  }
  // Dos personas libres y próximas pueden aceptar una charla; una sola acción compartida.
  const available=world.people.filter(p=>!p.action&&!hasUpcomingPlan(world,p,at)&&!hasGroupCommitment(world,p.id,at));
  for(let i=0;i<available.length;i++){
   const a=available[i];if(a.action||random(world)>.35)continue;
   const b=available.slice(i+1).find(q=>!q.action&&q.homeId===a.homeId&&q.position&&a.position&&canTalkAt(q.position,a.position));
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
    if(elapsed)p.needs.saciedad=limit(p.needs.saciedad+(meal.nutrition??definitions.comer.gain)*elapsed/meal.eatMs);
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
  reflectAtNight(world,at,next);
  if(next>=nextChronicle){collectChronicle(world,next);nextChronicle=next+30*MINUTE}
  world.lastSimulatedAt=next;
 }
 collectChronicle(world,world.lastSimulatedAt);
 world.worldVersion++;
 return {world,complete:world.lastSimulatedAt>=target};
}
