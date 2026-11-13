import {activeGoal, advanceGoal} from './goals.js';
import {planPreference, recordExperience} from './learning.js';
import {findRoute} from './navigation.js';
import {DAY_RATE} from './clock.js';
import {openConversation} from './social.js';
import {affinity, consent} from './relationships.js';
import {hasAgreement, honorAgreement, recordIncident, releaseKitchen} from './conflicts.js';
import {remember} from './memory.js';
import {hasGroupCommitment} from './group-events.js';

const MIN = 60000;
const HOUR = 60*MIN;
const homes = {'piso-1':[-10,-7],'piso-2':[10,-7],'piso-3':[-10,7],'piso-4':[10,7]};
export const activities = {
 games:{label:'jugar juntos',interest:'ordenador',minutes:30},
 cooking:{label:'cocinar juntos',minutes:25},
 anime:{label:'ver anime juntos',interest:'anime',minutes:35},
 gym:{label:'entrenar juntos',interest:'gimnasio',minutes:25}
};

const busyPlan = p => ['scheduled','travelling','active'].includes(p.status);
export function canPauseForPlan(action) {
 return !action || (!action.meetingId && !action.planId && !action.groupId
  && ['leer','ver_tv','descansar','pasear','practicar','esperar'].includes(action.id)
  && action.activity !== 'gimnasio');
}
const free = p => canPauseForPlan(p.action);

export function hasUpcomingPlan(world,person,at,within=35*MIN) {
 return Object.values(world.plans??{}).some(plan=>plan.status==='scheduled'
  && plan.participants.includes(person.id) && plan.scheduledAt-at<=within);
}
const available = p => p.needs.energia>=24 && p.needs.saciedad>=22 && p.needs.bano>=22;
const awake = (p, at) => {
 const date = new Date(at);
 const hour = date.getUTCHours()+date.getUTCMinutes()/60;
 return (hour-p.profile.sleepHour+24)%24 >= (p.profile.wakeHour-p.profile.sleepHour+24)%24;
};

function log(world,plan,type,at,details={}) {
 const e={id:world.worldId+':'+(++world.eventSequence),type,at,planId:plan.id,
  activity:plan.kind,participants:plan.participants,scheduledAt:plan.scheduledAt,...details};
 world.events.push(e);
 if (world.events.length>500) world.events.shift();
 return e;
}

function venueFor(host,kind) {
 const [x,z] = homes[host.homeId];
 if (kind==='gym') return {spots:[{x:9,z:17},{x:10.5,z:17}],keys:['comunidad:gimnasio']};
 if (kind==='cooking') return {spots:[{x:x-3,z:z+4.5},{x:x-1.5,z:z+4.5}],keys:[host.homeId+':kitchen']};
 if (kind==='anime') return {
  spots:[{x:x+3.5,z:z+4},{x:x+4.5,z:z+4}],
  seats:[{x:x+3.43,z:z+4.8},{x:x+4.2,z:z+4.8}],
  keys:[host.homeId+':sofa:0',host.homeId+':sofa:1']
 };
 return {spots:[{x:x-1,z:z+1},{x:x+.5,z:z+1}],keys:[host.homeId+':games']};
}

export function proposePlan(world,host,guest,kind,at,random) {
 const activity=activities[kind];
 if (!activity || host.id===guest.id || !available(host) || !available(guest)
  ||[host,guest].some(p=>hasGroupCommitment(world,p.id,at,Infinity))) return null;
 const plans=world.plans??={};
 const participants=[host.id,guest.id];
 if (Object.values(plans).some(p=>busyPlan(p)&&p.participants.some(id=>participants.includes(id)))) return null;
 const scheduledAt=at+20*MIN;
 const fits=p=>awake(p,scheduledAt)&&awake(p,scheduledAt+(activity.minutes+20)*MIN)
  && (!p.action||p.action.until<=scheduledAt||free(p));
 if (!fits(host)) return null;
 const rescheduled=!fits(guest) && guest.action?.until<=at+70*MIN
  ? Math.max(scheduledAt+25*MIN,guest.action.until+MIN):null;
 const newTimeFits=rescheduled && [host,guest].every(p=>awake(p,rescheduled)&&awake(p,rescheduled+(activity.minutes+20)*MIN));
 const willing=random()<consent(guest,host,at)+(hasAgreement(world,host,'keep_plan',guest)?.15:0);
 const accepted=willing&&(fits(guest)||newTimeFits);
 const plan={id:world.worldId+':plan:'+(++world.eventSequence),kind,participants,createdAt:at,
  scheduledAt:accepted&&newTimeFits?rescheduled:scheduledAt,status:accepted?'scheduled':'declined'};
 plans[plan.id]=plan;
 log(world,plan,'plan_proposed',at,{scheduledAt});
 if (accepted&&newTimeFits) log(world,plan,'plan_rescheduled',at);
 const e=log(world,plan,accepted?'plan_accepted':'plan_declined',at);
 for (const p of [host,guest]) {
  p.lastPlanAt=at;
  if (accepted) p.intention={text:activity.label+' con '+(p===host?guest.name:host.name),at};
 }
 remember(host,{eventId:e.id,kind:accepted?'invitation':'rejection',with:guest.id,at,
  valence:accepted?1:-1,importance:1});
 return plan;
}

function cancelPlan(world,plan,pair,at,reason,absent) {
 plan.status=absent?'missed':'cancelled';
 plan.endedAt=at;
 const conversation=world.conversations?.[plan.conversationId];
 if (conversation) {conversation.finished=true;conversation.cancelled=true;conversation.cancelledAt=at}
 for (const p of pair) {
  if (p?.action?.planId!==plan.id) continue;
  p.action=null;
 }
 for (const key of plan.keys??[]) {
  if (world.reservations[key]?.planId===plan.id) delete world.reservations[key];
 }
 log(world,plan,absent?'plan_missed':'plan_cancelled',at,absent?{reason,absentId:absent.id}:{reason});
 if (absent) recordIncident(world,pair.find(p=>p&&p!==absent),absent,'no_show',at);
}

export function progressPlans(world,at,positionDuring,random) {
 const plans=world.plans??={};
 for (const plan of Object.values(plans)) {
  if (!busyPlan(plan) || at<plan.scheduledAt) continue;
  const pair=plan.participants.map(id=>world.people.find(p=>p.id===id));
  const [host,guest]=pair;
  if (!host||!guest) {cancelPlan(world,plan,pair,at,'falta un vecino');continue}
  if (plan.status==='active') {
   if (pair.some(p=>p.action?.planId!==plan.id)) cancelPlan(world,plan,pair,at,'surgió una urgencia');
   continue;
  }
  if (plan.status==='travelling') {
   if (pair.some(p=>p.action?.planId!==plan.id) || at>plan.arriveBy) {
    for (const p of pair) if (p.action?.planId===plan.id) p.position=positionDuring(p.action,p.position,at);
    cancelPlan(world,plan,pair,at,'se interrumpió el camino');
   } else if (pair.every(p=>at>=p.action.start+p.action.travelMs)) {
    for (const p of pair) {p.position=p.action.route.at(-1);p.action=null}
    const c=openConversation(world,host,guest,at,{plan,minutes:activities[plan.kind].minutes});
    if (!c) {cancelPlan(world,plan,pair,at,'ya hay otra conversación');continue}
    plan.status='active';
    plan.conversationId=c.id;
    for (const [i,p] of pair.entries()) {
     p.action.planId=plan.id;
     p.action.activity=plan.kind;
     if (plan.seats) p.action.seat=plan.seats[i];
    }
    for (const key of plan.keys) world.reservations[key].until=c.end;
    log(world,plan,'plan_started',at);
   }
   continue;
  }
  const unavailable=pair.filter(p=>!free(p)||!available(p)||!awake(p,at));
  if (unavailable.length) {
   if (at>=plan.scheduledAt+12*MIN) {
    const absent=unavailable.length===1&&available(unavailable[0])&&awake(unavailable[0],at)?unavailable[0]:null;
    cancelPlan(world,plan,pair,at,absent?'siguió con otra actividad':'necesitaban atender otra cosa',absent);
   }
   continue;
  }
  const venue=venueFor(host,plan.kind);
  const blocked=venue.keys.some(key=>world.reservations[key]?.until>at
   && !pair.some(p=>p.id===world.reservations[key].personId))
   || (plan.kind==='anime'&&world.reservations[host.homeId+':sofa']?.until>at);
  if (blocked) {
   if (at>=plan.scheduledAt+12*MIN) cancelPlan(world,plan,pair,at,'el sitio seguía ocupado');
   continue;
  }
  const routes=pair.map((p,i)=>findRoute(positionDuring(p.action??{},p.position,at),venue.spots[i]));
  if (routes.some(route=>!route.length) || Math.hypot(routes[0].at(-1).x-routes[1].at(-1).x,
   routes[0].at(-1).z-routes[1].at(-1).z)<.65) {cancelPlan(world,plan,pair,at,'no encontraron sitio');continue}
  const travel=routes.map(route=>Math.round(route.slice(1).reduce((sum,p,i)=>
   sum+Math.hypot(p.x-route[i].x,p.z-route[i].z),0)*1500*DAY_RATE));
  const arriveBy=at+Math.max(...travel)+5*MIN;
  if (pair.some(p=>!awake(p,arriveBy+activities[plan.kind].minutes*MIN))) {
   cancelPlan(world,plan,pair,at,'se acercaba la hora de dormir');continue;
  }
  plan.status='travelling';
  plan.arriveBy=arriveBy;
  plan.keys=venue.keys;
  if(venue.seats)plan.seats=venue.seats;
  for (const [i,p] of pair.entries()) {
   const key=p.action?.resource;
   if (key&&world.reservations[key]?.personId===p.id) delete world.reservations[key];
   p.position=routes[i][0];
   p.lastSocialAt=at;
   p.action={id:'pasear',label:'yendo a '+activities[plan.kind].label,start:at,until:arriveBy+MIN,
    travelMs:travel[i],route:routes[i],planId:plan.id,resource:null};
  }
  for (const key of plan.keys) world.reservations[key]={personId:host.id,planId:plan.id,until:arriveBy+MIN};
  log(world,plan,'plan_travelling',at);
 }
 if (at<(world.nextPlanCheck??-Infinity)) return;
 world.nextPlanCheck=at+10*MIN;
 const historical=Object.values(plans).filter(p=>!busyPlan(p));
 for (const p of historical.slice(0,Math.max(0,historical.length-50))) delete plans[p.id];
 const availablePeople=world.people.filter(p=>p.position&&free(p)&&available(p)&&awake(p,at)
  && at-(p.lastPlanAt??-Infinity)>=4*HOUR&&!hasGroupCommitment(world,p.id,at,Infinity)
  && !Object.values(plans).some(plan=>busyPlan(plan)&&plan.participants.includes(p.id)));
 for (const host of availablePeople) {
  const goal=activeGoal(host,at);
  const wantsPlan=goal?.kind==='plan';
  if (host.needs.compania>(wantsPlan?88:78)||random()>(wantsPlan?.20:.14))continue;
  const goalScore=p=>goal?.kind==='plan'&&goal.with===p.id?goal.priority*3:0;
  const guest=availablePeople.filter(p=>p!==host).sort((a,b)=>
   affinity(host,b,at)-affinity(host,a,at)+goalScore(b)-goalScore(a)+.4*(Number(hasAgreement(world,host,'keep_plan',b))-Number(hasAgreement(world,host,'keep_plan',a)))
   +.12*(Number(b.homeId===host.homeId)-Number(a.homeId===host.homeId)))[0];
  if (!guest) break;
  const shared=Object.entries(activities).filter(([,activity])=>activity.interest
   &&[host,guest].every(p=>p.profile.interests.includes(activity.interest)));
  const options=['cooking',...shared.map(([kind])=>kind)];
  const kind=goal?.kind==='plan'&&goal.with===guest.id&&Object.hasOwn(activities,goal.activity)
   ?goal.activity:options.map(kind=>({kind,score:planPreference(host,kind,guest.id)+random()*.16}))
    .sort((a,b)=>b.score-a.score)[0].kind;
  if (proposePlan(world,host,guest,kind,at,random)) break;
 }
}

export function completePlan(world,conversation,at) {
 const plan=world.plans?.[conversation.planId];
 if (plan?.status!=='active') return;
 plan.status='completed';
 plan.endedAt=at;
 const pair=plan.participants.map(id=>world.people.find(p=>p.id===id));
 for (const key of plan.keys??[]) if (world.reservations[key]?.planId===plan.id) delete world.reservations[key];
 const entry=log(world,plan,'plan_completed',at);
 for (const [i,p] of pair.entries()) {
  const other=pair[1-i];
  const interest=activities[plan.kind].interest;
  const skill={cooking:'cocina',games:'juegos',gym:'aficiones'}[plan.kind];
  const tension=p.relationships?.[other.id]?.tension??0;
  const reward=tension>=25?-.25:interest&&!p.profile.interests.includes(interest)?.25:.65;
  recordExperience(p,{activity:'plan:'+plan.kind,skill,minutes:(conversation.end-conversation.start)/MIN,
   reward,context:'plan:'+plan.kind+':'+other.id});
  remember(p,{eventId:entry.id,kind:'plan_completed',activity:plan.kind,with:other.id,at,
   valence:reward>0?1:-1,importance:2});
  advanceGoal(p,'plan',{activity:plan.kind,with:other.id},at);
  p.needs.diversion=Math.min(100,p.needs.diversion+15);
  honorAgreement(world,p,'keep_plan',at,pair[1-i]);
 }
 if (plan.kind==='cooking') {
  const home=world.households[pair[0].homeId];
  home.mess=Math.min(100,home.mess+12);
  releaseKitchen(world,pair[0],at);
 }
}

export function pausePlans(world,now) {
 for (const plan of Object.values(world.plans??{})) {
  if (!busyPlan(plan)) continue;
  if (plan.status==='scheduled'&&plan.scheduledAt>=now) continue;
  plan.status='cancelled';
  plan.endedAt=now;
 }
}
