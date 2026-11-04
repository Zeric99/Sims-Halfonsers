// Conflictos de convivencia vinculados a incidentes observables.
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function event(world,type,at,extra){world.events.push({id:world.worldId+':'+(++world.eventSequence),type,at,...extra});if(world.events.length>500)world.events.shift()}
export function recordKitchenWait(world,waiting,occupant,at){
 if(!waiting||!occupant||waiting.id===occupant.id||waiting.homeId!==occupant.homeId)return null;
 world.conflicts ??={};const key=[waiting.id,occupant.id].sort().join(':')+':kitchen';
 let c=world.conflicts[key];
 if(c&&at-c.lastIncidentAt<3600000)return c;
 if(!c)c=world.conflicts[key]={id:key,participants:[waiting.id,occupant.id],cause:'esperar la cocina',state:'open',incidents:[],severity:0,attempts:[],lastIncidentAt:0};
 if(c.state==='resolved')c.state='open';
 c.lastIncidentAt=at;c.severity=clamp(c.severity+1,0,10);
 const incident={id:world.worldId+':incident:'+(++world.eventSequence),at,waiting:waiting.id,occupant:occupant.id};c.incidents.push(incident);if(c.incidents.length>20)c.incidents.shift();
 waiting.relationships ??={};const r=waiting.relationships[occupant.id]??={friendship:0,trust:20,tension:0,familiarity:0,romanticInterest:0,lastEncounter:null};
 r.tension=clamp(r.tension+2,0,100);
 event(world,'kitchen_wait',at,{conflictId:key,participants:c.participants});return c;
}
export function attemptKitchenRepair(world,conversation,at,randomValue){
 if(!conversation||!conversation.finished)return false;
 const c=Object.values(world.conflicts??{}).find(x=>x.state==='open'&&x.participants.every(id=>conversation.participants.includes(id))&&at-x.lastIncidentAt>=1800000);
 if(!c)return false;
 const waiting=world.people.find(p=>p.id===c.incidents.at(-1).waiting),occupant=world.people.find(p=>p.id===c.incidents.at(-1).occupant);
 if(!waiting||!occupant)return false;
 const trust=waiting.relationships?.[occupant.id]?.trust??20;
 const probability=clamp(.25+trust/200+waiting.profile.traits.paciencia*.3-c.severity*.03,.05,.9);
 const accepted=randomValue<probability;
 c.attempts.push({at,accepted});if(c.attempts.length>20)c.attempts.shift();
 c.state=accepted?'repair_pending':'cooling';c.reconsiderAt=at+2*3600000;
 if(accepted)c.agreement={kind:'release_kitchen',responsible:occupant.id,acceptedAt:at,fulfilledAt:null};
 event(world,accepted?'repair_accepted':'repair_declined',at,{conflictId:c.id,participants:c.participants});return accepted;
}
export function releaseKitchen(world,person,at){
 for(const c of Object.values(world.conflicts??{})){
  if(c.state!=='repair_pending'||c.agreement?.responsible!==person.id||at<=c.agreement.acceptedAt)continue;
  c.agreement.fulfilledAt=at;c.state='resolved';
  const waiting=world.people.find(p=>p.id===c.incidents.at(-1).waiting),r=waiting?.relationships?.[person.id];
  if(r){r.tension=clamp(r.tension-5,0,100);r.trust=clamp(r.trust+1,0,100)}
  event(world,'agreement_fulfilled',at,{conflictId:c.id,participants:c.participants});
 }
}
export function coolConflicts(world,at){
 for(const c of Object.values(world.conflicts??{}))if(c.state==='cooling'&&at>=c.reconsiderAt)c.state='open';
}
