export function remember(person,memory){
 person.memories??=[];if(person.memories.some(m=>m.eventId===memory.eventId&&m.kind===memory.kind))return;
 person.memories.push(memory);if(person.memories.length>50)person.memories.splice(0,person.memories.length-50);
}
export function socialBias(person,otherId,at){
 return (person.memories||[]).filter(m=>m.with===otherId&&at-m.at>=0&&at-m.at<24*3600000).reduce((sum,m)=>sum+(m.valence||0)*Math.max(0,1-(at-m.at)/(24*3600000)),0);
}
