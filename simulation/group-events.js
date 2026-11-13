import {affinity,clamp,consent,relation,relationshipLabel} from './relationships.js';
import {remember} from './memory.js';
import {canPauseForPlan,hasUpcomingPlan} from './plans.js';
import {findRoute} from './navigation.js';
import {DAY_RATE} from './clock.js';
import {fillerForConversation} from './phrases.js';
import {recordIncident} from './conflicts.js';
import {recordExperience} from './learning.js';

const MIN=60000,HOUR=60*MIN;
export const groupKinds={
 dinner:{title:'Cena de vecinos',interest:'cocina',minutes:56,beats:['Poniendo la mesa','Cenando','De sobremesa']},
 anime:{title:'Noche de anime',interest:'anime',minutes:52,beats:['Eligiendo capítulo','Viendo anime','Comentando el final']},
 tournament:{title:'Torneo de videojuegos',interest:'ordenador',minutes:54,beats:['Preparando los mandos','Jugando el torneo','Comentando la final']},
 barbecue:{title:'Barbacoa en el jardín',interest:'cocina',minutes:60,beats:['Encendiendo la parrilla','Comiendo en el jardín','Recogiendo entre todos']}
};
export const groupVenue={x:-8.5,z:17.5};
const spots=[[-10,17.5],[-8.5,16],[-7,16],[-7,18.5],[-8.5,19]].map(([x,z])=>({x,z}));
const labels={
 dinner:['¿Quién pone la mesa? Yo traigo los vasos.','Guardadme un sitio, que voy a por las servilletas.','¿Me pasáis el pan?','Esto con un poco más de salsa sería imbatible.','La próxima vez que cocine otro, ¿eh?','Vale, pero primero decidimos quién recoge.'],
 anime:['¿Ponemos un capítulo o hacemos maratón?','Un capítulo. Luego ya veremos cuánto nos engañamos.','Ese personaje acaba de tomar la peor decisión posible.','Calla, que quiero ver cómo sale de esta.','Necesito hablar de ese final.','Vale, pero nadie busque spoilers para mañana.'],
 tournament:['¿Tenemos todos mando? Vamos a sortear el orden.','Dejadme el que no tiene el botón atascado.','¡No me creo que me hayas remontado!','Eso te pasa por celebrar antes de tiempo.','La final ha estado reñida.','Quiero revancha. Ahora ya sé cómo juegas.'],
 barbecue:['¿Quién ha traído el carbón?','Aquí está. Voy preparando la mesa.','¡La primera tanda está lista!','Que alguien me guarde un trozo.','Ha sobrado comida para mañana.','Pues guardadla antes de que aparezca alguien con hambre.']
};
const variants={
 dinner:['He traído pan. ¿Alguien se encarga de los vasos?','Me pido sentarme cerca de la salsa.','¿Quién ha hecho esto? Está tremendo.','Come despacio, que aún queda el segundo plato.','Hay que repetir la cena otro día.','Sí, pero primero hacemos un pacto con los platos.'],
 anime:['¿Empezamos una serie nueva o seguimos con la de ayer?','La de ayer. Todavía me debe una explicación.','Ya sabía yo que ese tipo escondía algo.','Lo has dicho de todos los personajes.','Me han dejado con ganas de otro capítulo.','Lo dejamos para la próxima y así nadie hace trampas.'],
 tournament:['Quien gane el sorteo elige pista.','Como salga la del hielo, me retiro.','¡No vale bloquearme justo al final!','Vale perfectamente. Era mi única estrategia.','Ha estado más igualado de lo que pensaba.','Mañana practicamos y echamos la revancha.'],
 barbecue:['¿Hace falta más carbón o con eso tiramos?','Con eso vale. Alguien que saque los platos.','Esta tanda ya está. ¿Quién tenía más hambre?','Yo, pero le guardo un poco a quien cocinó.','Lo que sobra va a la nevera.','Y que no se nos olvide apagar la parrilla.']
};
const ongoing=e=>['scheduled','travelling','active'].includes(e.status);
const ready=p=>p.needs.energia>=25&&p.needs.bano>=23&&p.needs.saciedad>=17;
function awake(p,at){const hour=((at/HOUR)%24+24)%24;return (hour-p.profile.sleepHour+24)%24>=(p.profile.wakeHour-p.profile.sleepHour+24)%24}
export function hasGroupCommitment(world,id,at,within=35*MIN){
 return Object.values(world.groupEvents??{}).some(e=>ongoing(e)&&e.attending.includes(id)
  &&(e.status!=='scheduled'||e.scheduledAt-at<=within));
}
function blocked(world,p,at){
 return hasGroupCommitment(world,p.id,at,Infinity)||hasUpcomingPlan(world,p,at,Infinity)
  ||Object.values(world.plans??{}).some(plan=>['travelling','active'].includes(plan.status)&&plan.participants.includes(p.id));
}
function log(world,e,type,at,details={}){
 const item={id:world.worldId+':'+(++world.eventSequence),type,at,groupId:e.id,
  groupKind:e.kind,participants:[...e.attending],...details};
 world.events.push(item);if(world.events.length>500)world.events.shift();return item;
}
export function proposeGroup(world,host,guests,kind,at,random){
 const type=groupKinds[kind];
 if(!type||!ready(host)||blocked(world,host,at))return null;
 const events=world.groupEvents??={};
 if(Object.values(events).some(ongoing))return null;
 const scheduledAt=at+22*MIN;
 const fits=p=>ready(p)&&awake(p,scheduledAt)&&awake(p,scheduledAt+(type.minutes+35)*MIN)
  &&(!p.action||p.action.until<=scheduledAt||canPauseForPlan(p.action));
 if(!fits(host))return null;
 const seen=new Set([host.id]);
 const candidates=guests.filter(p=>{if(!p||seen.has(p.id))return false;seen.add(p.id);return true}).slice(0,4);
 if(candidates.length<2)return null;
 const replies=Object.fromEntries(candidates.map(p=>{
  const interest=p.profile.interests.includes(type.interest);
  const hunger=['dinner','barbecue'].includes(kind)&&p.needs.saciedad<75;
  const willingness=clamp(consent(p,host,at)+(interest?.28:0)+(hunger?.19:0)+.13,.05,.98);
  return [p.id,blocked(world,p,at)||!fits(p)?'busy':random()<willingness?'accepted':'declined'];
 }));
 const attending=[host.id,...candidates.filter(p=>replies[p.id]==='accepted').map(p=>p.id)];
 const event={id:world.worldId+':group:'+(++world.eventSequence),kind,hostId:host.id,attending,replies,scheduledAt,
  alternate:!Object.values(events).filter(e=>e.kind===kind&&e.status==='completed').at(-1)?.alternate,
  status:attending.length>=3?'scheduled':'cancelled'};
 events[event.id]=event;
 log(world,event,'group_invited',at,{hostId:host.id,replies});
 if(event.status==='cancelled')log(world,event,'group_cancelled',at,{reason:'no se apuntaron al menos tres vecinos'});
 return event;
}

export function groupBeat(event,now){
 if(event?.status!=='active'||now<event.start||now>=event.end)return null;
 const i=Math.min(2,Math.floor(3*(now-event.start)/(event.end-event.start)));
 return {index:i,label:groupKinds[event.kind].beats[i]};
}
function leave(world,p,event,at,positionDuring){
 if(p?.action?.groupId!==event.id)return;
 p.position=positionDuring(p.action,p.position,at);
 p.lastAction=p.action.id;p.action=null;
}
function end(world,event,at,positionDuring,reason){
 const present=world.people.filter(p=>p.action?.groupId===event.id);
 const conversation=event.dialogue;
 if(conversation){conversation.finished=true;if(reason){conversation.cancelled=true;conversation.cancelledAt=at}}
 if(reason){event.status='cancelled';log(world,event,'group_cancelled',at,{reason})}
 else{
  event.status='completed';
  const stressed=['dinner','barbecue'].includes(event.kind)
   ?present.find(p=>p.profile.traits.orden>=.58&&present.some(q=>q!==p&&(p.relationships?.[q.id]?.tension??0)>=12)):null;
  const target=stressed&&present.filter(q=>q!==stressed&&(stressed.relationships?.[q.id]?.tension??0)>=12)
   .sort((a,b)=>a.profile.traits.orden-b.profile.traits.orden)[0];
  const winner=event.kind==='tournament'?event.ranking.find(id=>present.some(p=>p.id===id)):null;
  event.outcome=stressed?'cleanup_dispute':winner?'tournament_win':'good';
  const item=log(world,event,'group_finished',at,{participants:present.map(p=>p.id),outcome:event.outcome,affectedId:stressed?.id,otherId:target?.id,winnerId:winner});
  if(stressed&&target)item.conflictId=recordIncident(world,stressed,target,'dishes',at)?.id;
  for(const p of present){
   p.needs.diversion=Math.min(100,p.needs.diversion+15);
   p.needs.compania=Math.min(100,p.needs.compania+18);
   for(const q of present.filter(other=>other!==p)){
    const r=relation(p,q),negative=p===stressed&&q===target;
    r.friendship=clamp(r.friendship+(negative?-2:3),-100,100);
    r.tension=clamp(r.tension+(negative?2:-1),0,100);
    r.familiarity=Math.min(100,r.familiarity+2);r.lastEncounter=at;r.status=relationshipLabel(r);
   }
   const other=p===stressed?target:present.find(q=>q!==p);
   remember(p,{eventId:item.id,kind:'group_finished',activity:event.kind,with:other?.id,at,
    valence:p===stressed?-2:2,importance:2});
   recordExperience(p,{activity:'group:'+event.kind,skill:event.kind==='tournament'?'juegos':undefined,
    minutes:(at-event.start)/MIN,reward:p===stressed?-.7:p.id===winner?.9:.6});
  }
 }
 event.endedAt=at;
 for(const p of present)leave(world,p,event,at,positionDuring);
}

function begin(world,event,present,at,random){
 event.status='active';event.start=at;event.end=at+groupKinds[event.kind].minutes*MIN;
 event.attending=present.map(p=>p.id);
 const span=(event.end-at)/6;
 const dialogue=event.dialogue={id:event.id,participants:[...event.attending],start:at,end:event.end,turnMs:span,
  speakers:Array.from({length:6},(_,i)=>event.attending[i%event.attending.length]),
  dialogue:[...(event.alternate?variants:labels)[event.kind]],fillers:{}};
 if(event.kind==='tournament'){
  event.ranking=present.map(p=>({id:p.id,score:(p.learned?.skills?.juegos??0)+Number(p.profile.interests.includes('ordenador'))*8+random()*16}))
   .sort((a,b)=>b.score-a.score).map(p=>p.id);
 }
 for(const [i,p] of present.entries()){
  const pos=p.action.route.at(-1);p.position=pos;p.lastSocialAt=at;
  p.action={id:'charlar',label:groupKinds[event.kind].beats[0],groupId:event.id,start:at,until:event.end+MIN,
   route:[pos],travelMs:0,resource:null};
  const filler=fillerForConversation(dialogue,p.id,world.phraseCatalog??[]);
  if(filler)dialogue.fillers[p.id]={...filler,turn:i};
 }
 log(world,event,'group_started',at);
}

export function progressGroups(world,at,positionDuring,random,step=MIN){
 const events=world.groupEvents??={};
 for(const event of Object.values(events)){
  if(!ongoing(event)||at<event.scheduledAt)continue;
  const people=event.attending.map(id=>world.people.find(p=>p.id===id)).filter(Boolean);
  if(event.status==='active'){
   const present=people.filter(p=>p.action?.groupId===event.id);
   if(present.length<3){end(world,event,at,positionDuring,'se quedaron menos de tres');continue}
   if(at>=event.end){end(world,event,at,positionDuring);continue}
   const beat=groupBeat(event,at);
   const live=new Set(present.map(p=>p.id));
   const turn=Math.max(0,Math.floor((at-event.start)/event.dialogue.turnMs));
   for(let i=turn;i<event.dialogue.speakers.length;i++)if(!live.has(event.dialogue.speakers[i]))
    event.dialogue.speakers[i]=present[i%present.length].id;
   if(event.kind==='tournament'&&beat.index===2){
    const winner=event.ranking.find(id=>live.has(id));
    event.dialogue.dialogue[4]=world.people.find(p=>p.id===winner).name+' gana la final. ¡Ha estado reñida!';
   }
   for(const p of present){
    p.action.label=beat.label;
    if(beat.index===1&&['dinner','barbecue'].includes(event.kind))p.needs.saciedad=Math.min(100,p.needs.saciedad+2.6*step/MIN);
   }
   continue;
  }
  if(event.status==='travelling'){
   const enRoute=people.filter(p=>p.action?.groupId===event.id);
   const arrived=enRoute.filter(p=>at>=p.action.start+p.action.travelMs);
   if(enRoute.length<3||at>=event.arriveBy&&arrived.length<3){end(world,event,at,positionDuring,'no llegaron suficientes vecinos');continue}
   if(arrived.length===enRoute.length||at>=event.arriveBy){
    for(const p of enRoute.filter(p=>!arrived.includes(p)))leave(world,p,event,at,positionDuring);
    begin(world,event,arrived,at,random);
   }
   continue;
  }
  const canLeave=people.filter(p=>ready(p)&&awake(p,at)&&canPauseForPlan(p.action));
  if(canLeave.length<3||!canLeave.includes(people[0])){
   if(at>=event.scheduledAt+12*MIN)end(world,event,at,positionDuring,'los invitados estaban ocupados');
   continue;
  }
  const routes=canLeave.map((p,i)=>[p,findRoute(positionDuring(p.action??{},p.position,at),spots[i])]).filter(([,route])=>route.length);
  if(routes.length<3||routes[0][0].id!==event.hostId){end(world,event,at,positionDuring,'no había camino al jardín');continue}
  event.status='travelling';
  for(const [p,route] of routes){
   const travelMs=Math.round(route.slice(1).reduce((sum,point,i)=>sum+Math.hypot(point.x-route[i].x,point.z-route[i].z),0)*1500*DAY_RATE);
   if(p.action?.resource&&world.reservations[p.action.resource]?.personId===p.id)delete world.reservations[p.action.resource];
   p.position=route[0];p.action={id:'pasear',label:'yendo a '+groupKinds[event.kind].title,route,start:at,
    until:at+3*HOUR,travelMs,groupId:event.id,resource:null};
  }
  event.arriveBy=at+Math.max(...routes.map(([p])=>p.action.travelMs))+6*MIN;
  log(world,event,'group_travelling',at,{participants:routes.map(([p])=>p.id)});
 }
 if(at<(world.nextGroupCheck??-Infinity))return;
 world.nextGroupCheck=at+26*MIN;
 for(const old of Object.values(events).filter(e=>!ongoing(e)).slice(0,Math.max(0,Object.keys(events).length-24)))delete events[old.id];
 const hour=((at/HOUR)%24+24)%24;
 if(hour<12||hour>=22||Object.values(events).some(ongoing)
   ||at-(world.lastGroupAttempt??-Infinity)<2*HOUR||random()>.6)return;
 const candidates=world.people.filter(p=>p.position&&ready(p)&&awake(p,at)&&!blocked(world,p,at)&&canPauseForPlan(p.action));
 if(candidates.length<4)return;
 const hosts=[...candidates].sort((a,b)=>b.profile.traits.sociabilidad-a.profile.traits.sociabilidad);
 const host=hosts[Math.floor(random()*Math.min(4,hosts.length))];
 const kinds=hour<16?['barbecue','tournament']:['dinner','anime','tournament','barbecue'];
 const recent=Object.values(events).filter(e=>e.status==='completed').at(-1)?.kind;
 const choices=kinds.filter(kind=>kind!==recent),kind=choices[Math.floor(random()*choices.length)];
 const score=p=>affinity(host,p,at)+Number(p.profile.interests.includes(groupKinds[kind].interest))*.35;
 const guests=candidates.filter(p=>p!==host).sort((a,b)=>score(b)-score(a)).slice(0,4);
 if(proposeGroup(world,host,guests,kind,at,random))world.lastGroupAttempt=at;
}

export function pauseGroups(world,now){
 for(const event of Object.values(world.groupEvents??{})){
  if(!ongoing(event)||(event.status==='scheduled'&&event.scheduledAt>=now))continue;
  event.status='cancelled';event.endedAt=now;
  if(event.dialogue){event.dialogue.finished=true;event.dialogue.cancelled=true}
 }
}
