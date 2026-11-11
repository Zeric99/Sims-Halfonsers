const HOUR=3600000;
const LIMIT=50;

export function memoryWeight(memory,at){
 const age=at-memory.at;
 const lifetime=memory.lifetimeMs??24*HOUR;
 if(!Number.isFinite(age)||age<0||age>=lifetime)return 0;
 return (memory.importance??1)*(1-age/lifetime);
}

export function remember(person,memory){
 const memories=person.memories??=[];
 if(memories.some(m=>m.eventId===memory.eventId&&m.kind===memory.kind))return;
 const importance=Math.max(1,Math.min(3,memory.importance??1));
 memories.push({...memory,importance,
  emotion:memory.emotion??(memory.valence<0?'molestia':memory.valence>0?'alegría':'calma'),
  lifetimeMs:memory.lifetimeMs??24*HOUR*importance});
 if(memories.length<=LIMIT)return;
 let weakest=0;
 for(let i=1;i<memories.length;i++){
  if(memoryWeight(memories[i],memory.at)<memoryWeight(memories[weakest],memory.at))weakest=i;
 }
 memories.splice(weakest,1);
}

export function relevantMemories(person,at,{withId,activity,limit=5}={}){
 return (person.memories??[])
  .filter(m=>(withId==null||m.with===withId)&&(activity==null||m.activity===activity))
  .map(memory=>({memory,weight:memoryWeight(memory,at)}))
  .filter(entry=>entry.weight>0)
  .sort((a,b)=>b.weight-a.weight||b.memory.at-a.memory.at)
  .slice(0,limit);
}

export function socialBias(person,otherId,at){
 return relevantMemories(person,at,{withId:otherId}).reduce((sum,{memory,weight})=>
  sum+(memory.valence??0)*weight,0);
}

const memoryLabels={
 invitation:'una invitación aceptada',rejection:'una invitación rechazada',plan_completed:'un plan completado',
 prank:'una broma',repair:'una conversación para arreglar las cosas',shared_interest:'una afición compartida',
 catch_up:'una charla',conversation:'una charla',plan:'un plan juntos',
 kitchen:'una espera en la cocina',noise:'una molestia por el volumen',noise_feedback:'una queja por la tele alta',
 dishes:'unos platos sin recoger',no_show:'un plantón',agreement_fulfilled:'un acuerdo cumplido'
};
export function describeMemory(memory,names){
 const other=names.get(memory.with);
 const label=memoryLabels[memory.kind]??'un encuentro';
 return label+(other?' con '+other:'');
}
