import {advanceGoal} from './goals.js';
import {recordNoiseFeedback,tvContext} from './learning.js';
import {clamp, relation} from './relationships.js';
import {remember} from './memory.js';

const HOUR = 3600000;
const rules = {
 kitchen: {cause:'esperar la cocina', request:'respetar el turno de cocina', agreement:'release_kitchen', impact:2},
 noise: {cause:'el volumen de la tele', request:'bajar el volumen', agreement:'quiet_tv', impact:4},
 dishes: {cause:'dejar platos sin recoger', request:'recoger los platos', agreement:'clean_dishes', impact:4},
 prank: {cause:'una broma que sentó mal', request:'respetar el límite con las bromas', agreement:'respect_joke', impact:3},
 no_show: {cause:'no aparecer a un plan', request:'cumplir el próximo plan juntos', agreement:'keep_plan', impact:5}
};

function event(world, type, at, details) {
 const entry = {id:world.worldId+':'+(++world.eventSequence), type, at, ...details};
 world.events.push(entry);
 if (world.events.length > 500) world.events.shift();
 return entry;
}

export function recordIncident(world, affected, responsible, kind, at) {
 const rule = rules[kind];
 if (!rule || !affected || !responsible || affected.id === responsible.id) return null;
 const conflicts = world.conflicts ??= {};
 const id = [affected.id, responsible.id].sort().join(':')+':'+kind;
 let conflict = conflicts[id];
 if (conflict && at - conflict.lastIncidentAt < HOUR) return conflict;
 conflict ??= conflicts[id] = {id, participants:[affected.id,responsible.id], cause:rule.cause,
  kind, request:rule.request, state:'open', incidents:[], severity:0, attempts:[]};
 if (conflict.state === 'repair_pending') {
  event(world, 'agreement_broken', at, {conflictId:id, participants:conflict.participants, request:conflict.request});
 }
 conflict.state = 'open';
 conflict.lastIncidentAt = at;
 conflict.severity = clamp(conflict.severity+1,0,10);
 const entry = event(world, kind==='kitchen'?'kitchen_wait':'conflict_incident', at,
  {conflictId:id, participants:[affected.id,responsible.id], cause:rule.cause});
 conflict.incidents.push({id:entry.id, at, waiting:affected.id, occupant:responsible.id});
 if (conflict.incidents.length > 20) conflict.incidents.shift();
 const r = relation(affected,responsible);
 r.tension = clamp(r.tension+rule.impact,0,100);
 if (kind !== 'kitchen') {
  r.friendship = clamp(r.friendship-1,-100,100);
  r.trust = clamp(r.trust-1,0,100);
 }
 remember(affected,{eventId:entry.id,kind,with:responsible.id,at,valence:-2,
  importance:kind==='kitchen'?1:3,emotion:kind==='no_show'?'decepción':'molestia'});
 if(kind==='noise'){
  recordNoiseFeedback(responsible,tvContext(responsible,world,at));
  remember(responsible,{eventId:entry.id,kind:'noise_feedback',activity:'ver_tv',with:affected.id,at,valence:0,importance:1});
 }
 return conflict;
}

export function recordKitchenWait(world,waiting,occupant,at) {
 if (waiting?.homeId !== occupant?.homeId) return null;
 return recordIncident(world,waiting,occupant,'kitchen',at);
}

export function attemptKitchenRepair(world, conversation, at, randomValue) {
 if (!conversation?.finished) return false;
 const conflict = Object.values(world.conflicts ?? {}).find(c=>c.state==='open'
  && (!conversation.conflictId||c.id===conversation.conflictId)
  && c.participants.every(id=>conversation.participants.includes(id))
  && at-c.lastIncidentAt>=HOUR/2);
 if (!conflict) return false;
 const {waiting,occupant} = conflict.incidents.at(-1);
 const affected = world.people.find(p=>p.id===waiting);
 if (!affected) return false;
 const rule = rules[conflict.kind ?? 'kitchen'];
 const trust = affected.relationships?.[occupant]?.trust ?? 20;
 const probability = clamp(.25+trust/200+affected.profile.traits.paciencia*.3-conflict.severity*.03,.05,.9);
 const accepted = randomValue < probability;
 conflict.attempts.push({at,accepted});
 if (conflict.attempts.length>20) conflict.attempts.shift();
 conflict.state = accepted?'repair_pending':'cooling';
 conflict.reconsiderAt = at+2*HOUR;
 conflict.request = rule.request;
 if (accepted) conflict.agreement = {kind:rule.agreement,responsible:occupant,acceptedAt:at,fulfilledAt:null,deadline:at+36*HOUR};
 event(world,accepted?'repair_accepted':'repair_declined',at,
  {conflictId:conflict.id,participants:conflict.participants,request:rule.request});
 return accepted;
}

export function hasAgreement(world, person, kind, other) {
 return Object.values(world.conflicts??{}).some(c=>c.state==='repair_pending'
  && c.agreement?.kind===kind && c.agreement.responsible===person.id
  && (!other || c.participants.includes(other.id)));
}

export function honorAgreement(world, person, kind, at, other) {
 for (const c of Object.values(world.conflicts??{})) {
  const agreement = c.agreement;
  if (c.state!=='repair_pending' || agreement?.kind!==kind || agreement.responsible!==person.id
    || at<=agreement.acceptedAt || (other && !c.participants.includes(other.id))) continue;
  agreement.fulfilledAt=at;
  c.state='resolved';
  const affected=world.people.find(p=>p.id===c.incidents.at(-1).waiting);
  if (affected) {
   const r=relation(affected,person);
   r.tension=clamp(r.tension-5,0,100);
   r.trust=clamp(r.trust+2,0,100);
  }
  const entry=event(world,'agreement_fulfilled',at,{conflictId:c.id,participants:c.participants,request:c.request});
  advanceGoal(person,'repair',{conflictId:c.id},at);
  if(affected){
   advanceGoal(affected,'repair',{conflictId:c.id},at);
   remember(affected,{eventId:entry.id,kind:'agreement_fulfilled',with:person.id,at,valence:2,importance:3,emotion:'alivio'});
  }
 }
}

export function releaseKitchen(world,person,at) {
 honorAgreement(world,person,'release_kitchen',at);
}

export function coolConflicts(world,at) {
 for (const c of Object.values(world.conflicts??{})) {
  if (c.state==='cooling' && at>=c.reconsiderAt) c.state='open';
  if (c.state!=='repair_pending' || !(at>=c.agreement?.deadline)) continue;
  c.state='open';
  event(world,'agreement_broken',at,{conflictId:c.id,participants:c.participants,request:c.request});
 }
}

export function checkNoise(world,at) {
 if (at < (world.nextNoiseCheck ?? -Infinity)) return;
 world.nextNoiseCheck=at+10*60000;
 for (const viewer of world.people) {
  const a=viewer.action;
  if (a?.id!=='ver_tv' || a.quiet || at<a.start+(a.travelMs??0)) continue;
  const affected=world.people.find(p=>p.homeId===viewer.homeId
   && ['dormir','estudiar'].includes(p.action?.id) && p.profile.traits.sensibilidadRuido>=.5
   && at>=p.action.start+(p.action.travelMs??0));
  if (affected) recordIncident(world,affected,viewer,'noise',at);
 }
}
