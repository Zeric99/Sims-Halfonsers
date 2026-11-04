// Relaciones de personajes ficticios; ningún dato se infiere de personas reales.
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export function relation(from,to){
 from.relationships ??={};
 return from.relationships[to.id] ??= {friendship:0,trust:20,tension:0,familiarity:0,romanticInterest:0,lastEncounter:null};
}
function addEvent(world,type,at,details){
 world.events.push({id:world.worldId+':'+(++world.eventSequence),type,at,...details});
 if(world.events.length>500)world.events.splice(0,world.events.length-500);
}
export function openConversation(world,a,b,at){
 if(a.id===b.id||a.homeId!==b.homeId||a.action||b.action)return null;
 world.conversations ??={};
 if(Object.values(world.conversations).some(c=>!c.finished&&c.participants.some(id=>id===a.id||id===b.id)))return null;
 const shared=a.profile.interests.filter(x=>b.profile.interests.includes(x));
 const topic=shared[0] ?? 'el día';
 const id=world.worldId+':conversation:'+(++world.eventSequence);
 const conversation={id,participants:[a.id,b.id],topic,start:at,end:at+8*60000,finished:false,outcome:shared.length?'shared_interest':'pleasant'};
 world.conversations[id]=conversation;
 for(const [person,other] of [[a,b],[b,a]]){
  const pos=person.position ?? {x:0,z:0};
  person.action={id:'charlar',label:'hablando con '+other.name,start:at,until:conversation.end,resource:null,route:[pos],travelMs:0,conversationId:id};
 }
 addEvent(world,'conversation_started',at,{conversationId:id,participants:conversation.participants,topic});
 return conversation;
}
export function finishConversation(world,id,at){
 const c=world.conversations?.[id];if(!c||c.finished)return false;
 const [a,b]=c.participants.map(id=>world.people.find(p=>p.id===id));if(!a||!b)return false;
 c.finished=true;
 for(const [person,other] of [[a,b],[b,a]]){
  const r=relation(person,other);
  const repeated=r.lastEncounter!=null&&at-r.lastEncounter<86400000;
  r.friendship=clamp(r.friendship+(c.outcome==='shared_interest'?2:1)*(repeated?.5:1),-100,100);
  r.trust=clamp(r.trust+(repeated?.1:.4),0,100);
  r.familiarity=clamp(r.familiarity+1,0,100);r.lastEncounter=at;
  person.memories ??=[];person.memories.push({eventId:id,kind:'conversation',with:other.id,at,importance:1});
  if(person.memories.length>50)person.memories.shift();
 }
 addEvent(world,'conversation_finished',at,{conversationId:id,participants:c.participants,topic:c.topic,outcome:c.outcome});
 return true;
}
