import {spectatorScenes} from './spectator.js';
import {activities} from './plans.js';
import {groupKinds} from './group-events.js';
import {chronicleEpisodes} from './chronicles.js';
import {realElapsed} from './clock.js';

export function liveGuide(world,now,rate){
 const episodes=chronicleEpisodes(world);
 const live=spectatorScenes(world,now).slice(0,4).map(scene=>{
  const episode=scene.storyKey&&episodes.find(e=>e.sources.includes(scene.storyKey));
  const chapter=episode?.chapters.filter(c=>c.at<scene.start).at(-1);
  return {...scene,backstory:chapter?.text,momentId:chapter?.id};
 });
 const upcoming=[...Object.values(world.plans??{}).map(p=>({...p,title:activities[p.kind]?.label,who:p.participants})),
  ...Object.values(world.groupEvents??{}).map(g=>({...g,title:groupKinds[g.kind]?.title,who:g.attending}))]
  .filter(e=>e.status==='scheduled'&&e.scheduledAt>=now).sort((a,b)=>a.scheduledAt-b.scheduledAt).slice(0,3)
  .map(event=>({id:event.id,title:event.title,names:event.who.map(id=>world.people.find(p=>p.id===id)?.name).filter(Boolean),
   seconds:Math.ceil((world.simulationClock?realElapsed(world.simulationClock,now,event.scheduledAt):(event.scheduledAt-now)/rate)/1000)}));
 return {live,upcoming};
}

export function mountLiveGuide(root){
 const liveList=root.querySelector('.guide-live'),upcomingList=root.querySelector('.guide-upcoming');
 let signature=null;
 function el(tag,value,className){
  const node=document.createElement(tag);node.textContent=value;if(className)node.className=className;return node;
 }
 function button(label,action){
  const node=el('button',label,'follow-button');node.type='button';node.addEventListener('click',action);return node;
 }
 function emit(name,detail){window.dispatchEvent(new CustomEvent(name,{detail}))}
 return (world,now,rate)=>{
  const {live,upcoming}=liveGuide(world,now,rate);
  const soon=seconds=>seconds<10?'En unos segundos':seconds<60?'En menos de 1 min':'En unos '+Math.ceil(seconds/60)+' min';
  const key=JSON.stringify([live.map(({id,title,context,momentId})=>[id,title,context,momentId]),upcoming.map(e=>[e.id,soon(e.seconds)])]);
  if(key===signature)return;signature=key;
  liveList.replaceChildren(...(live.length?live.map(scene=>{
   const card=el('article','','live-guide-card');
   card.append(el('strong',scene.title),el('p',scene.context));
   if(scene.backstory)card.append(el('p','Antes: '+scene.backstory,'guide-context'));
   const actions=el('div','','chronicle-actions');
   actions.append(button('Ver en directo',()=>emit('watch-scene',{id:scene.id})));
   if(scene.momentId)actions.append(button('Ver qué pasó antes',()=>emit('open-chronicle',{id:scene.momentId})));
   card.append(actions);return card;
  }):[el('p','Ahora no hay escenas destacadas. Puedes explorar el barrio o ponerte al día con las crónicas.','chronicle-empty')]));
  upcomingList.replaceChildren(...(upcoming.length?upcoming.map(event=>{
   const line=el('li','');line.append(el('strong',event.title),el('span',soon(event.seconds)+' · '+event.names.join(', ')));return line;
  }):[el('li','Todavía no hay nada en la agenda.','chronicle-empty')]));
 };
}
