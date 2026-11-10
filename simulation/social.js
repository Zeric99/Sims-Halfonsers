import {remember,socialBias} from './memory.js';
import { phraseForConversation } from './phrases.js';
// Relaciones de personajes ficticios; ningún dato se infiere de personas reales.
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export function relation(from,to){
 from.relationships ??={};
 const stored=from.relationships[to.id]??{};
 return from.relationships[to.id]={friendship:0,trust:20,tension:0,familiarity:0,romanticInterest:0,lastEncounter:null,...stored};
}
function addEvent(world,type,at,details){
 world.events.push({id:world.worldId+':'+(++world.eventSequence),type,at,...details});
 if(world.events.length>500)world.events.splice(0,world.events.length-500);
}
export function openConversation(world,a,b,at){
 if(a.id===b.id||a.action||b.action)return null;
 world.conversations ??={};
 const finished=Object.values(world.conversations).filter(c=>c.finished).sort((a,b)=>a.end-b.end);
 while(finished.length>100){const old=finished.shift();delete world.conversations[old.id]}
 if(Object.values(world.conversations).some(c=>!c.finished&&c.participants.some(id=>id===a.id||id===b.id)))return null;
 const shared=a.profile.interests.filter(x=>b.profile.interests.includes(x));
 const topic=shared[0] ?? 'el día';
 const id=world.worldId+':conversation:'+(++world.eventSequence);
 const conversation={id,participants:[a.id,b.id],topic,start:at,end:at+24*60000,finished:false,outcome:shared.length?'shared_interest':'pleasant'};
 // Congelar lo que dirá cada participante en el estado compartido: así una
 // frase añadida durante la charla no cambia el bocadillo de otros visitantes.
 conversation.lines=Object.fromEntries([a,b].map(p=>[p.id,phraseForConversation(conversation,p.id,world.phraseCatalog||[])]));
 const tension=Math.max(a.relationships?.[b.id]?.tension||0,b.relationships?.[a.id]?.tension||0);
 const prank=['Eric','Aisuke','Snow','Delos','Lolo'].includes(a.name)&&world.eventSequence%5===0;
 conversation.story=tension>=8?'repair':prank?'prank':shared.length?'shared_interest':'catch_up';
 conversation.dialogue=conversation.story==='repair'?['Oye, lo de antes me sentó mal. ¿Lo hablamos?','Vale, intentemos llevarnos mejor.']:conversation.story==='prank'?['Dicen que hoy limpias tú toda la casa… ¡Es broma!','Pues la próxima broma la limpias tú.']:socialBias(a,b.id,at)<0?['¿Seguimos bien después de lo de antes?','Podemos hablar, pero hoy estoy a mi aire.']:shared.length?['¿Te apetece hablar de '+topic+' un rato?','¡Sí! Por fin alguien con mis gustos.']:['¿Qué tal llevas el día por aquí?','Bien. Cuéntame qué has estado haciendo.'];
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
  if(c.story==='prank')r.tension=clamp(r.tension+3,0,100);
  if(c.story==='repair')r.tension=clamp(r.tension-5,0,100);
  r.friendship=clamp(r.friendship+(c.outcome==='shared_interest'?2:1)*(repeated?.5:1),-100,100);
  r.trust=clamp(r.trust+(repeated?.1:.4),0,100);
  r.familiarity=clamp(r.familiarity+1,0,100);r.lastEncounter=at;
  const compatible=person.profile.romanceEnabled&&other.profile.romanceEnabled&&person.profile.romancePartners?.includes(other.id)&&other.profile.romancePartners?.includes(person.id);
  if(compatible&&r.familiarity>=10&&r.friendship>=10&&r.tension<30)r.romanticInterest=clamp(r.romanticInterest+(repeated?.05:.2),0,100);
  remember(person,{eventId:id,kind:c.story||'conversation',with:other.id,at,importance:c.story==='prank'?2:1,valence:c.story==='prank'?-2:c.story==='repair'?2:1});
 }
 if(c.story)addEvent(world,'story_finished',at,{participants:c.participants,story:c.story});
 addEvent(world,'conversation_finished',at,{conversationId:id,participants:c.participants,topic:c.topic,outcome:c.outcome});
 return true;
}
