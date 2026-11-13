import {isDay,snapshotTime,clockRateAt} from './clock.js';
import {describeMemory,relevantMemories} from './memory.js';
import {activities} from './plans.js';
import {groupBeat,groupKinds} from './group-events.js';
import {describeStory} from './stories.js';
import { neighbourhoodHighlights } from './highlights.js';
import { describeResident } from './resident-details.js';
import {mountChronicle} from './chronicle-panel.js';
import {mountLiveGuide} from './live-guide.js';
const panel=document.querySelector('#resident-panel'),details=document.querySelector('#resident-details'),residentTitle=document.querySelector('#resident-title');
let selectedResident=null,followed=null;
const query=new URLSearchParams(location.search),local=['127.0.0.1','localhost'].includes(location.hostname),qa=local&&query.has('qa');
if(qa){document.querySelector('.live-badge').textContent='ESCENA DE PRUEBA LOCAL';document.querySelector('.scene-label small').textContent='ESCENA AISLADA'}
const renderChronicle=mountChronicle({recap:document.querySelector('#visit-recap'),archive:document.querySelector('#chronicle'),isQA:qa});
const renderLiveGuide=mountLiveGuide(document.querySelector('#live-guide'));
window.addEventListener('watch-scene',()=>{panel.hidden=true;selectedResident=null;document.querySelector('#world').scrollIntoView({block:'nearest'})});
const followButton=document.querySelector('#resident-follow');
window.addEventListener('resident-follow',event=>{
 followed=event.detail.name;
 followButton.textContent=followed&&followed===selectedResident?'Dejar de seguir':'Seguir con la cámara';
});
followButton.addEventListener('click',()=>{followed=followed===selectedResident?null:selectedResident;followButton.textContent=followed?'Dejar de seguir':'Seguir con la cámara';window.dispatchEvent(new CustomEvent('resident-follow',{detail:{name:followed}}))});
document.querySelector('#watch-story').addEventListener('click',()=>{const world=window.sharedWorld?.world;if(!world)return;const person=world.people.find(p=>p.action?.id==='charlar')||world.people.find(p=>p.action?.meetingId||p.action?.planId);if(person){window.dispatchEvent(new CustomEvent('resident-select',{detail:{name:person.name}}));followed=person.name;followButton.textContent='Dejar de seguir';window.dispatchEvent(new CustomEvent('resident-follow',{detail:{name:followed}}))}});

function showResident(){
 if(!selectedResident||!window.sharedWorld)return;
 const data=window.sharedWorld,info=describeResident(data.world,selectedResident,data.serverTime);
 if(!info){panel.hidden=true;return}
 panel.hidden=false;residentTitle.textContent=info.name;
 const fragment=document.createDocumentFragment();
 function row(label,value){const p=document.createElement('p'),b=document.createElement('strong');b.textContent=label+': ';p.append(b,document.createTextNode(value));fragment.append(p)}
 followButton.textContent=followed===info.name?'Dejar de seguir':'Seguir con la cámara';
 row('Ahora',info.current);row('Estado',({IDLE:'Sin actividad',MOVING:'En camino',WAITING:'Esperando',SLEEPING:'Durmiendo',ACTING:'Realizando actividad'})[info.execution]);row('Después',info.next);
 const person=data.world.people.find(p=>p.name===info.name);
 if(person.intention)row('Intención reciente',person.intention.text);
 row('Recuerdos',info.memories.map(memory=>memory.text+(memory.emotion?' · '+memory.emotion:''))
  .join(' / ')||'Todavía no hay recuerdos recientes.');
 if(info.goal){
  const status={active:'en curso',completed:'cumplido',expired:'caducado',cancelled:'cancelado'}[info.goal.status];
  row('Objetivo',info.goal.label+' · '+info.goal.progress+'/'+info.goal.target+' · '+status);
 }
 if(info.reflection){
  row('Reflexión de anoche',[
   info.reflection.positive?'Me quedo con '+info.reflection.positive+'.':null,
   info.reflection.concern?'Me preocupa '+info.reflection.concern+'.':null
  ].filter(Boolean).join(' ')||'Quiero dedicar un rato a mi objetivo.');
 }
 const skills={cocina:'Cocina',estudio:'Estudio',juegos:'Juegos',aficiones:'Aficiones'};
 const levels=Object.entries(info.skills).map(([id,value])=>(skills[id]??id)+' '+value.toLocaleString('es-ES',{maximumFractionDigits:2})+'/100');
 if(levels.length)row('Habilidades',levels.join(' · '));
 row('Hogar y ánimo',info.home.replace('piso-','Piso ')+' · '+info.mood);
 const labels={saciedad:'Saciedad',energia:'Energía',higiene:'Higiene',compania:'Compañía',diversion:'Diversión',bano:'Baño'};
 row('Necesidades',Object.entries(info.needs||{}).map(([k,v])=>(labels[k]||k)+' '+Math.round(v)).join(' · '));
 const formatTime=at=>new Intl.DateTimeFormat('es-ES',{timeZone:'UTC',hour:'2-digit',minute:'2-digit'}).format(at);
 for(const plan of info.commitments)row('Plan',plan.label+' con '+plan.other+' · '+formatTime(plan.at)
  +' · '+({scheduled:'acordado',travelling:'en camino',active:'en curso'}[plan.status]));
 if(info.relationship)row('Pareja',info.relationship);
 if(info.relationships.length)row('Relaciones',info.relationships.slice(0,4).map(r=>
  r.name+' · '+r.status+' · amistad '+r.friendship+' · confianza '+r.trust+' · tensión '+r.tension).join(' / '));
 row('Tensión',info.tensions.length?info.tensions.map(r=>r.name+' ('+r.tension+'/100)').join(', '):'No hay tensión elevada registrada.');
 row('Desacuerdos',info.conflicts.length?info.conflicts.map(c=>c.name+' · '+c.cause+(c.state==='repair_pending'?' · Acuerdo pendiente: '+(c.request||'respetar el turno'):c.state==='cooling'?' · Necesita tiempo':'')).join('; '):'No hay conflictos abiertos registrados.');
 const header=document.createElement('strong');header.textContent='Actividad reciente';fragment.append(header);
 if(!info.history.length){const p=document.createElement('p');p.textContent='Todavía no hay actividades anteriores en el historial disponible.';fragment.append(p)}
 for(const item of info.history){const p=document.createElement('p'),time=new Intl.DateTimeFormat('es-ES',{timeZone:'UTC',hour:'2-digit',minute:'2-digit'}).format(item.at);p.textContent=time+' · '+item.text;fragment.append(p)}
 if(info.socialHistory.length){
  const title=document.createElement('strong');title.textContent='Historia reciente';fragment.append(title);
  for(const item of info.socialHistory){const p=document.createElement('p');p.textContent=formatTime(item.at)+' · '+item.text;fragment.append(p)}
 }
 details.replaceChildren(fragment);
}
window.addEventListener('resident-select',event=>{selectedResident=event.detail.name;showResident();panel.scrollIntoView({block:'nearest',behavior:'smooth'})});
document.querySelector('#resident-close').addEventListener('click',()=>{selectedResident=null;panel.hidden=true});
const clock=document.querySelector('#world-clock'), list=document.querySelector('#world-activities'), events=document.querySelector('#world-events');
let lastVersion=-1;
let connectionLost=false;
const clockFormat=new Intl.DateTimeFormat('es-ES',{timeZone:'UTC',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
function paintClock(){
 const reading=window.sharedWorld;
 if(!reading)return;
 const at=snapshotTime(reading,performance.now()-reading.receivedAt);
 const value=(isDay(at)?'☀ Día':'🌙 Noche')+' · '+clockFormat.format(at)+' · ciclo de 30 minutos';
 const label=connectionLost?clock.dataset.lastTime+' · Reconectando…':value;
 if(!connectionLost)clock.dataset.lastTime=value;
 if(clock.textContent!==label)clock.textContent=label;
}
function paintLiveGuide(){
 const reading=window.sharedWorld;
 if(!reading)return;
 const at=snapshotTime(reading,performance.now()-reading.receivedAt);
 renderLiveGuide(reading.world,at,reading.world.simulationClock?clockRateAt(reading.world.simulationClock,at):reading.clockRate);
}
async function refresh(){
 try{
  const response=await fetch(qa?'/api/qa-world?'+query:'/api/world',{cache:'no-store',signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error('No disponible');
  const data=await response.json(),world=data.world;
  if(world.worldVersion<lastVersion)return;
  lastVersion=world.worldVersion;
  data.receivedAt=performance.now();
  connectionLost=false;
  window.sharedWorld=data;
  showResident();
  window.dispatchEvent(new CustomEvent('shared-world',{detail:data}));
  paintClock();
  const storyNames=new Map(world.people.map(p=>[p.id,p.name]));
  renderChronicle(world);
  paintLiveGuide();
  document.querySelector('#watch-story').disabled=!world.people.some(p=>p.action?.id==='charlar'||p.action?.meetingId||p.action?.planId);
  const agenda=document.querySelector('#neighbourhood-agenda');
  const plans=Object.values(world.plans??{}).filter(p=>['scheduled','travelling','active'].includes(p.status))
   .sort((a,b)=>a.scheduledAt-b.scheduledAt);
  const groups=Object.values(world.groupEvents??{}).filter(g=>['scheduled','travelling','active'].includes(g.status));
  agenda.hidden=!plans.length&&!groups.length;
  const entries=plans.map(plan=>{
   const li=document.createElement('li');
   const time=new Intl.DateTimeFormat('es-ES',{timeZone:'UTC',hour:'2-digit',minute:'2-digit'}).format(plan.scheduledAt);
   const phase={scheduled:'Acordado',travelling:'En camino',active:'En curso'}[plan.status];
   li.textContent=phase+' · '+time+' · '+plan.participants.map(id=>storyNames.get(id)).join(' y ')+' · '+activities[plan.kind].label;
   return li;
  });
  const groupEntries=groups.map(group=>{
   const li=document.createElement('li');li.className='group-agenda';
   const title=document.createElement('strong'),status=document.createElement('span'),names=document.createElement('span');
   const time=new Intl.DateTimeFormat('es-ES',{timeZone:'UTC',hour:'2-digit',minute:'2-digit'}).format(group.scheduledAt);
   title.textContent=groupKinds[group.kind].title;
   status.textContent=groupBeat(group,data.serverTime)?.label??(group.status==='scheduled'?'A las '+time:group.status==='travelling'?'De camino al jardín':'En curso');
   names.textContent=group.attending.filter(id=>group.status!=='active'||world.people.find(p=>p.id===id)?.action?.groupId===group.id).map(id=>storyNames.get(id)).join(', ');
   li.append(title,status,names);
   if(group.status!=='scheduled'){
    const button=document.createElement('button');button.className='follow-button';button.textContent='Ver encuentro de grupo';
    button.addEventListener('click',()=>{panel.hidden=true;selectedResident=null;window.dispatchEvent(new CustomEvent('watch-group',{detail:{id:group.id}}))});
    li.append(button);
   }
   return li;
  });
  agenda.querySelector('ul').replaceChildren(...groupEntries,...entries);
  const gossip=document.querySelector('#gossip-highlights');
  if(gossip){const wasOpen=Boolean(gossip.querySelector('details')?.open),stats=neighbourhoodHighlights(world),cards=document.createDocumentFragment();
   for(const [icon,title,entry,unit,empty] of [['✦','MEJOR ROLLO',stats.friendship,'amistad','Todavía no hay amistades registradas.'],['⚡','TENSIÓN',stats.tension,'tensión','Por ahora, reina la paz.']]){
    const row=document.createElement('div'),badge=document.createElement('span'),body=document.createElement('div'),label=document.createElement('small'),value=document.createElement('strong'),detail=document.createElement('span');
    row.className='gossip-row';badge.className='gossip-badge';badge.textContent=icon;label.textContent=title;
    value.textContent=entry?entry.from+' → '+entry.to:empty;detail.textContent=entry?Math.round(entry[unit==='amistad'?'friendship':'tension'])+' de '+unit:'';
    body.append(label,value,detail);row.append(badge,body);cards.append(row);
   }
   const chatter=document.createElement('div'),label=document.createElement('small'),value=document.createElement('strong'),note=document.createElement('span');
   chatter.className='gossip-chatter';label.textContent='💬 QUIÉN MÁS CHARLA';value.textContent=stats.chatter?stats.chatter.name:'Aún no hay conversaciones terminadas';note.textContent=stats.chatter?stats.chatter.count+' conversaciones del historial reciente':'';chatter.append(label,value,note);cards.append(chatter);
   const ranking=document.createElement('details'),summary=document.createElement('summary'),hint=document.createElement('p');ranking.className='gossip-rankings';ranking.open=wasOpen;summary.textContent='Ver el ranking del barrio';hint.textContent='La flecha muestra cómo se siente el primero hacia el segundo.';ranking.append(summary,hint);
   for(const [title,key,entries] of [['Más amistad','friendship',stats.friendshipRanking],['Más tensión','tension',stats.tensionRanking]]){
    const heading=document.createElement('strong'),ordered=document.createElement('ol');heading.textContent=title;ranking.append(heading);
    if(!entries.length){const empty=document.createElement('p');empty.textContent='Todavía no hay datos.';ranking.append(empty)}
    for(const entry of entries){const item=document.createElement('li');item.textContent=entry.from+' → '+entry.to+' · '+Math.round(entry[key]);ordered.append(item)}
    ranking.append(ordered);
   }
   cards.append(ranking);gossip.replaceChildren(cards);
  }
  const fragment=document.createDocumentFragment(),names=new Map(world.people.map(p=>[p.id,p.name]));
  const open=new Set([...list.querySelectorAll('details[open]')].map(item=>item.dataset.personId));
  const labels={saciedad:'Saciedad',energia:'Energía',higiene:'Higiene',compania:'Compañía',diversion:'Diversión',bano:'Baño'};
  for(const person of world.people){
   const card=document.createElement('details');card.dataset.personId=person.id;card.open=open.has(person.id);card.style.margin='7px 0';
   const title=document.createElement('summary'),name=document.createElement('strong');name.textContent=person.name+': ';
   const action=person.action;let activity=action?.label||'descansando';
   if(action?.id==='comer'&&action.meal)activity=describeResident(world,person.name,data.serverTime).current;
   title.append(name,document.createTextNode(activity));card.append(title);const inspect=document.createElement('button');inspect.type='button';inspect.className='follow-button';inspect.textContent='Ver ficha de '+person.name;inspect.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('resident-select',{detail:{name:person.name}})));card.append(inspect);
   const home=document.createElement('p');home.textContent='Hogar: '+person.homeId.replace('piso-','piso ')+' · Ánimo: '+(person.mood?.label??'sin datos');card.append(home);
   const mess=world.households?.[person.homeId]?.mess;
   if(Number.isFinite(mess)){const homeState=document.createElement('p');homeState.textContent='Cocina: '+(mess<20?'recogida':mess<50?'algo desordenada':'necesita limpieza');card.append(homeState)}
   const needs=document.createElement('p');needs.textContent=Object.entries(person.needs).map(([k,v])=>(labels[k]||k)+' '+Math.round(v)).join(' · ');card.append(needs);
   const relations=Object.entries(person.relationships||{}).sort((a,b)=>b[1].friendship-a[1].friendship).slice(0,3);
   const friends=document.createElement('p');friends.textContent=relations.length?'Relaciones: '+relations.map(([id,r])=>(names.get(id)||'Vecino')+' (amistad '+Math.round(r.friendship)+', tensión '+Math.round(r.tension)+')').join(' · '):'Todavía no tiene relaciones registradas.';card.append(friends);
   const memories=relevantMemories(person,data.serverTime,{limit:2}),memory=document.createElement('p');
   memory.textContent=memories.length?'Recuerdos: '+memories.map(({memory})=>describeMemory(memory,names)).join(' · '):'Todavía no hay recuerdos recientes.';
   card.append(memory);fragment.append(card);
  }
  list.replaceChildren(fragment);
  const diary=document.createDocumentFragment();
  const routineTypes=['conversation_started','conversation_finished','cleaning_finished'];
  const recent=world.events.filter(e=>describeStory(e,names)||routineTypes.includes(e.type)).slice(-80).reverse();
  if(!recent.length){const row=document.createElement('p');row.textContent='Todavía no hay interacciones registradas.';diary.append(row)}
  for(const event of recent){
   const row=document.createElement('p'),who=(event.participants||[]).map(id=>names.get(id)||'Un vecino').join(' y ');
   const messages={conversation_started:who+' empiezan a hablar sobre '+event.topic+'.',conversation_finished:who+' terminaron de hablar sobre '+event.topic+'.',kitchen_wait:who+' tuvieron que organizarse con la cocina.',repair_accepted:who+' acordaron respetar el turno de cocina.',repair_declined:who+' necesitan más tiempo para resolver el desacuerdo.',agreement_fulfilled:who+' cumplieron el acuerdo de la cocina.',romance_proposed:who+' están hablando de su relación.',romance_accepted:who+' han decidido empezar una relación.',romance_rejected:who+' han decidido no empezar una relación.',relationship_ended:who+' han terminado su relación.',cleaning_finished:(names.get(event.personId)||'Un vecino')+' ha limpiado la cocina del '+(event.homeId||'piso').replace('piso-','piso ')+'.'};
   const time=new Intl.DateTimeFormat('es-ES',{timeZone:'UTC',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(event.at);
   row.textContent=time+' · '+(describeStory(event,names)||messages[event.type]);diary.append(row);
  }
  events?.replaceChildren(diary);
 }catch{
  connectionLost=true;
  if(window.sharedWorld)paintClock();
  else clock.textContent='No se ha podido conectar con el mundo compartido. Reintentando…';
 }
}
async function pollWorld(){
 await refresh();
 if(!qa)setTimeout(pollWorld,5000);
}
pollWorld();
setInterval(paintClock,250);
setInterval(paintLiveGuide,1000);
if(local&&query.has('inspector')){
 import('./inspector.js').then(({mountInspector})=>mountInspector(document.querySelector('.scene-column'),window.sharedWorld));
}

if(local&&!qa){
 import('./profile-editor.js').then(({mountProfileEditor})=>mountProfileEditor(panel));
}
