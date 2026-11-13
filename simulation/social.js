import {remember,socialBias} from './memory.js';
import {buildDialogue} from './dialogues.js';
import {fillerForConversation,phraseForConversation} from './phrases.js';
import {clamp, relation, relationshipLabel} from './relationships.js';
import {hasAgreement, honorAgreement, recordIncident} from './conflicts.js';

export {relation};
const DAY=86400000;
const pranksters=['Eric','Aisuke','Snow','Delos','Lolo'];
const planLabels={games:'jugando',cooking:'cocinando',anime:'viendo anime',gym:'entrenando'};

function addEvent(world,type,at,details){
 world.events.push({id:world.worldId+':'+(++world.eventSequence),type,at,...details});
 if(world.events.length>500)world.events.splice(0,world.events.length-500);
}

export function openConversation(world,a,b,at,{plan,minutes=24}={}){
 if(a.id===b.id||a.action||b.action)return null;
 const conversations=world.conversations??={};
 const finished=Object.values(conversations).filter(c=>c.finished).sort((a,b)=>a.end-b.end);
 for(const c of finished.slice(0,Math.max(0,finished.length-100)))delete conversations[c.id];
 if(Object.values(conversations).some(c=>!c.finished&&c.participants.some(id=>id===a.id||id===b.id)))return null;
 const shared=a.profile.interests.filter(x=>b.profile.interests.includes(x));
 const recent=Object.values(conversations).filter(c=>c.finished&&!c.cancelled
  &&c.participants.includes(a.id)&&c.participants.includes(b.id)).reverse();
 const lastTopic=recent.find(c=>shared.includes(c.topic))?.topic;
 const topic=plan?planLabels[plan.kind]:(shared.find(interest=>interest!==lastTopic)??shared[0]??'el día');
 const id=world.worldId+':conversation:'+(++world.eventSequence);
 const conflict=Object.values(world.conflicts??{}).find(c=>c.state==='open'
  && c.participants.includes(a.id)&&c.participants.includes(b.id)&&at-c.lastIncidentAt>=1800000);
 const tension=Math.max(a.relationships?.[b.id]?.tension??0,b.relationships?.[a.id]?.tension??0);
 const canJoke=pranksters.includes(a.name)&&!hasAgreement(world,a,'respect_joke',b);
 const prank=canJoke&&world.eventSequence%5===0;
 const story=plan?'plan':conflict||tension>=8?'repair':prank?'prank':shared.length?'shared_interest':'catch_up';
 const c={id,participants:[a.id,b.id],topic,start:at,end:at+minutes*60000,finished:false,
  outcome:shared.length?'shared_interest':'pleasant',story};
 if(conflict)c.conflictId=conflict.id;
 if(plan)c.planId=plan.id;
 c.lines=Object.fromEntries([a,b].map(p=>[p.id,phraseForConversation(c,p.id,world.phraseCatalog||[])]));
 c.fillers=Object.fromEntries([a,b].map(p=>[p.id,fillerForConversation(c,p.id,world.phraseCatalog||[])]).filter(([,filler])=>filler));
 if(story==='prank')c.prankOffended=b.profile.traits.paciencia<.55||tension>=5;
 c.dialogue=buildDialogue(c,{plan,conflict,recent,uneasy:socialBias(a,b.id,at)<0});
 conversations[id]=c;
 for(const [person,other] of [[a,b],[b,a]]){
  const pos=person.position??{x:0,z:0};
  person.action={id:'charlar',label:(plan?planLabels[plan.kind]:'hablando')+' con '+other.name,
   start:at,until:c.end,resource:null,route:[pos],travelMs:0,conversationId:id};
 }
 if(!plan)addEvent(world,'conversation_started',at,{conversationId:id,participants:c.participants,topic});
 return c;
}

export function finishConversation(world,id,at){
 const c=world.conversations?.[id];
 if(!c||c.finished)return false;
 const [a,b]=c.participants.map(id=>world.people.find(p=>p.id===id));
 if(!a||!b)return false;
 c.finished=true;
 const offended=c.story==='prank'&&(c.prankOffended??true);
 for(const [person,other] of [[a,b],[b,a]]){
  const r=relation(person,other);
  const repeated=r.lastEncounter!=null&&at-r.lastEncounter<DAY;
  const repeats=r.lastTopic===c.topic&&repeated?(r.topicRepeats??1)+1:1;
  const novelty=(repeated?.65:1)/Math.sqrt(repeats);
  const enthusiasm=person.profile.traits.amabilidad*.5+.75;
  const base=c.planId?3:c.outcome==='shared_interest'?2:1;
  if(!offended&&(!c.conflictId||c.planId)){
   r.friendship=clamp(r.friendship+base*enthusiasm*novelty,-100,100);
   r.trust=clamp(r.trust+(c.planId?1.4:.4)*enthusiasm*novelty,0,100);
  }
  if(c.story==='repair'&&!c.conflictId)r.tension=clamp(r.tension-5,0,100);
  r.familiarity=clamp(r.familiarity+novelty,0,100);
  r.lastEncounter=at;
  r.lastTopic=c.topic;
  r.topicRepeats=Math.min(30,repeats);
  r.status=relationshipLabel(r);
  const compatible=person.profile.romanceEnabled&&other.profile.romanceEnabled
   &&person.profile.romancePartners?.includes(other.id)&&other.profile.romancePartners?.includes(person.id);
  if(compatible&&!offended&&!c.conflictId&&r.familiarity>=10&&r.friendship>=10&&r.tension<30){
   const gain=(c.planId?3:1.2)*novelty*(.6+person.profile.traits.sociabilidad);
   r.romanticInterest=clamp(r.romanticInterest+gain,0,100);
  }
  remember(person,{eventId:id,kind:c.story||'conversation',with:other.id,at,
   importance:offended?2:1,valence:offended&&person===b?-2:c.story==='repair'?0:1});
 }
 if(offended)recordIncident(world,b,a,'prank',at);
 else if(!c.conflictId&&c.story!=='repair'){
  honorAgreement(world,a,'respect_joke',at,b);
  honorAgreement(world,b,'respect_joke',at,a);
 }
 if(!c.planId){
  if(c.story&&!c.conflictId)addEvent(world,'story_finished',at,{participants:c.participants,story:c.story,
   harmless:c.story==='prank'&&!offended});
  addEvent(world,'conversation_finished',at,{conversationId:id,participants:c.participants,topic:c.topic,outcome:c.outcome});
 }
 return true;
}
