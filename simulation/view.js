import { neighbourhoodHighlights } from './highlights.js';
import { describeResident } from './resident-details.js';
const panel=document.querySelector('#resident-panel'),details=document.querySelector('#resident-details'),residentTitle=document.querySelector('#resident-title');
let selectedResident=null;
function showResident(){
 if(!selectedResident||!window.sharedWorld)return;
 const data=window.sharedWorld,info=describeResident(data.world,selectedResident,data.serverTime);
 if(!info){panel.hidden=true;return}
 panel.hidden=false;residentTitle.textContent=info.name;
 const fragment=document.createDocumentFragment();
 function row(label,value){const p=document.createElement('p'),b=document.createElement('strong');b.textContent=label+': ';p.append(b,document.createTextNode(value));fragment.append(p)}
 row('Ahora',info.current);row('Estado',({IDLE:'Sin actividad',MOVING:'En camino',WAITING:'Esperando',SLEEPING:'Durmiendo',ACTING:'Realizando actividad'})[info.execution]);row('Después',info.next);
 row('Hogar y ánimo',info.home.replace('piso-','Piso ')+' · '+info.mood);
 const labels={saciedad:'Saciedad',energia:'Energía',higiene:'Higiene',compania:'Compañía',diversion:'Diversión',bano:'Baño'};
 row('Necesidades',Object.entries(info.needs||{}).map(([k,v])=>(labels[k]||k)+' '+Math.round(v)).join(' · '));
 row('Tensión',info.tensions.length?info.tensions.map(r=>r.name+' ('+r.tension+'/100)').join(', '):'No hay tensión elevada registrada.');
 row('Desacuerdos',info.conflicts.length?info.conflicts.map(c=>c.name+' · '+c.cause).join('; '):'No hay conflictos abiertos registrados.');
 const header=document.createElement('strong');header.textContent='Actividad reciente';fragment.append(header);
 if(!info.history.length){const p=document.createElement('p');p.textContent='Todavía no hay actividades anteriores en el historial disponible.';fragment.append(p)}
 for(const item of info.history){const p=document.createElement('p'),time=new Intl.DateTimeFormat('es-ES',{timeZone:'UTC',hour:'2-digit',minute:'2-digit'}).format(item.at);p.textContent=time+' · '+item.text;fragment.append(p)}
 details.replaceChildren(fragment);
}
window.addEventListener('resident-select',event=>{selectedResident=event.detail.name;showResident();panel.scrollIntoView({block:'nearest',behavior:'smooth'})});
document.querySelector('#resident-close').addEventListener('click',()=>{selectedResident=null;panel.hidden=true});
const clock=document.querySelector('#world-clock'), list=document.querySelector('#world-activities'), events=document.querySelector('#world-events');
let lastVersion=-1;
async function refresh(){
 try{
  const response=await fetch('/api/world',{cache:'no-store'});
  if(!response.ok)throw new Error('No disponible');
  const data=await response.json(),world=data.world;
  if(world.worldVersion<lastVersion)return;
  lastVersion=world.worldVersion;
  window.sharedWorld=data;showResident();window.dispatchEvent(new CustomEvent('shared-world',{detail:data}));
  const date=new Intl.DateTimeFormat('es-ES',{timeZone:'UTC',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(world.lastSimulatedAt);
  const hour=new Date(world.lastSimulatedAt).getUTCHours();
  clock.textContent=(hour>=7&&hour<23?'☀ Día':'🌙 Noche')+' · '+date+' · ciclo de 30 minutos';
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
   title.append(name,document.createTextNode(activity));card.append(title);
   const home=document.createElement('p');home.textContent='Hogar: '+person.homeId.replace('piso-','piso ')+' · Ánimo: '+(person.mood?.label??'sin datos');card.append(home);
   const mess=world.households?.[person.homeId]?.mess;
   if(Number.isFinite(mess)){const homeState=document.createElement('p');homeState.textContent='Cocina: '+(mess<20?'recogida':mess<50?'algo desordenada':'necesita limpieza');card.append(homeState)}
   const needs=document.createElement('p');needs.textContent=Object.entries(person.needs).map(([k,v])=>(labels[k]||k)+' '+Math.round(v)).join(' · ');card.append(needs);
   const relations=Object.entries(person.relationships||{}).sort((a,b)=>b[1].friendship-a[1].friendship).slice(0,3);
   const friends=document.createElement('p');friends.textContent=relations.length?'Relaciones: '+relations.map(([id,r])=>(names.get(id)||'Vecino')+' (amistad '+Math.round(r.friendship)+', tensión '+Math.round(r.tension)+')').join(' · '):'Todavía no tiene relaciones registradas.';card.append(friends);
   const memories=(person.memories||[]).slice(-2).reverse(),memory=document.createElement('p');
   memory.textContent=memories.length?'Recuerdos: '+memories.map(m=>'charló con '+(names.get(m.with)||'un vecino')).join(' · '):'Todavía no hay recuerdos.';card.append(memory);fragment.append(card);
  }
  list.replaceChildren(fragment);
  const diary=document.createDocumentFragment();
  const types=['conversation_started','conversation_finished','kitchen_wait','repair_accepted','repair_declined','agreement_fulfilled','romance_proposed','romance_accepted','romance_rejected','relationship_ended','cleaning_finished'];
  const recent=world.events.filter(e=>types.includes(e.type)).slice(-80).reverse();
  if(!recent.length){const row=document.createElement('p');row.textContent='Todavía no hay interacciones registradas.';diary.append(row)}
  for(const event of recent){
   const row=document.createElement('p'),who=(event.participants||[]).map(id=>names.get(id)||'Un vecino').join(' y ');
   const messages={conversation_started:who+' empiezan a hablar sobre '+event.topic+'.',conversation_finished:who+' terminaron de hablar sobre '+event.topic+'.',kitchen_wait:who+' tuvieron que organizarse con la cocina.',repair_accepted:who+' acordaron respetar el turno de cocina.',repair_declined:who+' necesitan más tiempo para resolver el desacuerdo.',agreement_fulfilled:who+' cumplieron el acuerdo de la cocina.',romance_proposed:who+' están hablando de su relación.',romance_accepted:who+' han decidido empezar una relación.',romance_rejected:who+' han decidido no empezar una relación.',relationship_ended:who+' han terminado su relación.',cleaning_finished:(names.get(event.personId)||'Un vecino')+' ha limpiado la cocina del '+(event.homeId||'piso').replace('piso-','piso ')+'.'};
   const time=new Intl.DateTimeFormat('es-ES',{timeZone:'UTC',hour:'2-digit',minute:'2-digit'}).format(event.at);
   row.textContent=time+' · '+messages[event.type];diary.append(row);
  }
  events?.replaceChildren(diary);
 }catch{clock.textContent='No se ha podido conectar con el mundo compartido. Reintentando…'}
}
refresh();setInterval(refresh,5000);
