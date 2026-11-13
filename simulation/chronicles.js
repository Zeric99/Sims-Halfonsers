import {describeStory} from './stories.js';
import {groupKinds} from './group-events.js';

const DAY=86400000;
const rules={
 conflict_incident:['conflict','Giro',8],kitchen_wait:['conflict','Inicio',3],
 repair_accepted:['conflict','Giro',7],repair_declined:['conflict','Giro',5],
 agreement_broken:['conflict','Giro',8],agreement_fulfilled:['conflict','Desenlace',10],
 plan_accepted:['plan','Inicio',3],plan_rescheduled:['plan','Giro',4],plan_started:['plan','Giro',2],
 plan_completed:['plan','Desenlace',5],plan_missed:['plan','Giro',9],plan_cancelled:['plan','Desenlace',4],
 group_invited:['group','Inicio',3],group_started:['group','Giro',4],group_finished:['group','Desenlace',8],
 group_cancelled:['group','Desenlace',3],
 romance_proposed:['romance','Inicio',5],romance_accepted:['romance','Desenlace',10],romance_rejected:['romance','Desenlace',7],
 relationship_ended:['romance','Desenlace',10],story_finished:['prank','Momento',7]
};
function rule(event){
 return event.type==='story_finished'&&event.story!=='prank'?null:Object.hasOwn(rules,event.type)?rules[event.type]:null;
}
const order=(a,b)=>a.at-b.at||(Number(a.id.split(':').at(-1))||0)-(Number(b.id.split(':').at(-1))||0);
export const eventSequence=event=>Number(event.id.split(':').at(-1))||0;

// Guarda solo hitos; el diario normal rota mucho antes que una historia.
export function collectChronicle(world,now){
 const old=world.chronicle??{events:[],sequence:0};
 const threshold=now-21*DAY;
 const additions=world.events.filter(event=>eventSequence(event)>old.sequence&&event.at>=threshold&&rule(event));
 world.chronicle={sequence:world.eventSequence,
  events:[...old.events.filter(event=>event.at>=threshold),...additions].sort(order).slice(-900)};
}

export function chronicleEpisodes(world){
 const names=new Map(world.people.map(p=>[p.id,p.name]));
 const timeline=[...new Map([...(world.chronicle?.events??[]),...world.events].filter(rule).map(e=>[e.id,e])).values()].sort(order);
 const episodes=new Map(),aliases=new Map(),missed=new Map(),romance=new Map(),conflicts=new Map();
 for(const event of timeline){
  const [kind,stage,weight]=rule(event);
  const pair=(event.participants??[]).slice().sort().join(':');
  const titleNames=(event.participants??[]).map(id=>names.get(id)).filter(Boolean).join(' y ');
  let id={conflict:event.conflictId,plan:event.planId,group:event.groupId,romance:event.offerId,prank:event.id}[kind]??event.id;
  if(kind==='romance'){
   if(event.type==='romance_accepted')romance.set(pair,id);
   if(event.type==='relationship_ended')id=romance.get(pair)??id;
  }
  const previous=kind==='plan'?missed.get(pair):null;
  if(previous&&event.type==='plan_accepted'&&event.at-previous.at<=3*DAY){
   aliases.set(id,previous.id);missed.delete(pair);
  }
  id=aliases.get(id)??id;
  if(event.type==='plan_missed')missed.set(pair,{id,at:event.at});
  let key=kind+':'+id;
  if(kind==='group'&&event.type==='group_finished'&&event.conflictId&&!episodes.get(conflicts.get(event.conflictId))?.open)
   conflicts.set(event.conflictId,key);
  if(kind==='conflict'&&event.conflictId){
   const current=conflicts.get(event.conflictId);
   key=current&&!episodes.get(current)?.open&&['conflict_incident','kitchen_wait'].includes(event.type)
    ?key+':'+event.id:current??key;
   conflicts.set(event.conflictId,key);
  }
  const episode=episodes.get(key)??{id:key,kind,title:{
   conflict:'Un desacuerdo entre '+titleNames,plan:'Una quedada de '+titleNames,
   group:groupKinds[event.groupKind]?.title??'Una quedada de grupo',
   romance:'La historia de '+titleNames,prank:'Una broma entre '+titleNames
  }[kind],chapters:[],sources:[],open:true};
  let tag=stage;
  if(kind==='group'&&event.conflictId)tag='Giro';
  if(kind==='conflict'&&!episode.chapters.length&&stage==='Giro')tag='Inicio';
  if(kind==='plan'&&previous?.id===id&&event.type==='plan_accepted'){
   episode.title='Una segunda oportunidad para '+titleNames;
   tag='Giro';
  }
  const text=describeStory(event,names);
  if(!text)continue;
  const sourceId={conflict:event.conflictId,plan:event.planId,group:event.groupId}[kind];
  if(sourceId&&!episode.sources.includes(kind+':'+sourceId))episode.sources.push(kind+':'+sourceId);
  const rank=event.outcome==='cleanup_dispute'||event.outcome==='tournament_win'?10:weight;
  episode.chapters.push({id:event.id,sequence:eventSequence(event),at:event.at,tag,text,rank});
  episode.open=tag!=='Desenlace'&&kind!=='prank';
  episode.updatedAt=event.at;
  episode.startAt??=event.at;
  episodes.set(key,episode);
 }
 return [...episodes.values()].sort((a,b)=>b.updatedAt-a.updatedAt||a.id.localeCompare(b.id));
}

export function visitHighlights(episodes,previous,limit=4){
 return episodes.flatMap(episode=>{
  const unseen=episode.chapters.filter(chapter=>previous==null||chapter.sequence>previous);
  unseen.sort((a,b)=>b.rank-a.rank||b.at-a.at||b.sequence-a.sequence);
  return unseen.length?[{episode,chapter:unseen[0],count:unseen.length}]:[];
 }).sort((a,b)=>b.chapter.rank-a.chapter.rank||b.chapter.at-a.chapter.at||b.chapter.sequence-a.chapter.sequence).slice(0,limit);
}
