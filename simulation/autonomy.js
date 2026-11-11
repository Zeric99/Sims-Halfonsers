import {activeGoal} from './goals.js';
import {findRoute,canTalkAt} from './navigation.js';
import {DAY_RATE} from './clock.js';
import {openConversation} from './social.js';
import {remember} from './memory.js';
import {hasUpcomingPlan} from './plans.js';
import {affinity,consent} from './relationships.js';
const MIN=60000;
function onRoute(action,at){const route=action.route,distances=route.slice(1).map((p,i)=>Math.hypot(p.x-route[i].x,p.z-route[i].z));let left=distances.reduce((a,b)=>a+b,0)*Math.max(0,Math.min(1,(at-action.start)/(action.travelMs||1)));for(let i=0;i<distances.length;i++){if(distances[i]>0&&left<=distances[i]){const q=left/distances[i];return {x:route[i].x+(route[i+1].x-route[i].x)*q,z:route[i].z+(route[i+1].z-route[i].z)*q}}left-=distances[i]}return route.at(-1)}
function log(world,type,at,extra){const event={id:world.worldId+':'+(++world.eventSequence),type,at,...extra};world.events.push(event);if(world.events.length>500)world.events.shift();return event}
const ready=(world,p,at)=>!hasUpcomingPlan(world,p,at)&&p.action&&['leer','ver_tv','descansar','pasear','practicar'].includes(p.action.id)&&p.action.activity!=='gimnasio'&&!p.action.meetingId&&!p.action.planId&&at>=p.action.start+(p.action.travelMs||0)+5*MIN&&p.needs.energia>25&&p.needs.saciedad>25&&p.needs.bano>25&&at-(p.lastSocialAt??-Infinity)>3*3600000;
export function socialPulse(world,at,random){
 world.meetings??={};
 for(const meeting of Object.values(world.meetings)){
  if(meeting.finished)continue;
  const pair=meeting.participants.map(id=>world.people.find(p=>p.id===id));
  if(pair.some(p=>!p||p.action?.meetingId!==meeting.id)||at>meeting.expires){meeting.finished=true;for(const p of pair)if(p?.action?.meetingId===meeting.id){p.position=onRoute(p.action,at);p.action=null}log(world,'invitation_cancelled',at,{participants:meeting.participants});continue}
  if(pair.every(p=>at>=p.action.start+p.action.travelMs)){
   for(const p of pair){p.position=p.action.route.at(-1);p.action=null}
   meeting.finished=true;openConversation(world,...pair,at);
  }
 }
 const old=Object.values(world.meetings).filter(m=>m.finished);for(const m of old.slice(0,Math.max(0,old.length-30)))delete world.meetings[m.id];
 for(const a of world.people){
  const goal=activeGoal(a,at);
  const repair=goal?.kind==='repair'&&world.people.some(other=>other.id===goal.with&&ready(world,other,at));
  if(!ready(world,a,at)||(!repair&&a.needs.compania>70)||random()>(repair?.045:.025))continue;
  const candidates=world.people.filter(b=>b.id!==a.id&&ready(world,b,at)).map(b=>({b,score:affinity(a,b,at)+(a.homeId===b.homeId?.2:0)+(repair&&goal.with===b.id?.5:0)})).sort((x,y)=>y.score-x.score);
  const b=candidates[0]?.b;if(!b)continue;
  const posA=a.action.route?.at(-1)??a.position,posB=b.action.route?.at(-1)??b.position;if(!posA||!posB)continue;
  // Buscar un punto accesible al lado del invitado, nunca teletransportarlo.
  const route=findRoute(posA,{x:posB.x+1,z:posB.z});if(!route.length||!canTalkAt(route.at(-1),posB))continue;
  a.lastSocialAt=b.lastSocialAt=at;
  const chance=consent(b,a,at);
  const accepted=random()<chance,event=log(world,accepted?'invitation_accepted':'invitation_declined',at,{participants:[a.id,b.id],reason:'charlar'});
  a.intention={text:'Buscar a '+b.name+' para hablar',at};b.intention={text:accepted?'Hablar con '+a.name:'Prefiere seguir con lo suyo',at};
  remember(a,{eventId:event.id,kind:accepted?'invitation':'rejection',with:b.id,at,valence:accepted?1:-1,importance:1});
  if(!accepted)continue;
  const id=event.id;let maxTravel=0;
  for(const [p,path] of [[a,route],[b,[posB]]]){
   const previous=p.action;if(previous.resource&&world.reservations[previous.resource]?.personId===p.id)delete world.reservations[previous.resource];
   let length=0;for(let i=1;i<path.length;i++)length+=Math.hypot(path[i].x-path[i-1].x,path[i].z-path[i-1].z);
   const travelMs=Math.round(length*1500*DAY_RATE);maxTravel=Math.max(maxTravel,travelMs);
   p.position=path[0];p.action={id:'pasear',label:p===a?'yendo a hablar con '+b.name:'esperando a '+a.name,start:at,until:at+travelMs+60*MIN,travelMs,route:path,resource:null,meetingId:id};
  }
  world.meetings[id]={id,participants:[a.id,b.id],expires:at+maxTravel+10*MIN,finished:false};
 }
}
