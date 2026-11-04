const clock=document.querySelector('#world-clock'), list=document.querySelector('#world-activities'), events=document.querySelector('#world-events');
let lastVersion=-1;
async function refresh(){
 try{
  const response=await fetch('/api/world',{cache:'no-store'});
  if(!response.ok)throw new Error('No disponible');
  const data=await response.json(),world=data.world;
  if(world.worldVersion<lastVersion)return;
  lastVersion=world.worldVersion;
  window.sharedWorld=data;window.dispatchEvent(new CustomEvent('shared-world',{detail:data}));
  const date=new Intl.DateTimeFormat('es-ES',{timeZone:'UTC',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(world.lastSimulatedAt);
  const hour=new Date(world.lastSimulatedAt).getUTCHours();
  clock.textContent=(hour>=7&&hour<23?'☀ Día':'🌙 Noche')+' · '+date+' · ciclo de 30 minutos';
  const fragment=document.createDocumentFragment(),names=new Map(world.people.map(p=>[p.id,p.name]));
  const open=new Set([...list.querySelectorAll('details[open]')].map(item=>item.dataset.personId));
  const labels={saciedad:'Saciedad',energia:'Energía',higiene:'Higiene',compania:'Compañía',diversion:'Diversión',bano:'Baño'};
  for(const person of world.people){
   const card=document.createElement('details');card.dataset.personId=person.id;card.open=open.has(person.id);card.style.margin='7px 0';
   const title=document.createElement('summary'),name=document.createElement('strong');name.textContent=person.name+': ';
   title.append(name,document.createTextNode(person.action?.label||'descansando'));card.append(title);
   const home=document.createElement('p');home.textContent='Hogar: '+person.homeId.replace('piso-','piso ')+' · Ánimo: '+(person.mood?.label??'sin datos');card.append(home);
   const needs=document.createElement('p');needs.textContent=Object.entries(person.needs).map(([k,v])=>(labels[k]||k)+' '+Math.round(v)).join(' · ');card.append(needs);
   const relations=Object.entries(person.relationships||{}).sort((a,b)=>b[1].friendship-a[1].friendship).slice(0,3);
   const friends=document.createElement('p');friends.textContent=relations.length?'Relaciones: '+relations.map(([id,r])=>(names.get(id)||'Vecino')+' (amistad '+Math.round(r.friendship)+', tensión '+Math.round(r.tension)+')').join(' · '):'Todavía no tiene relaciones registradas.';card.append(friends);
   const memories=(person.memories||[]).slice(-2).reverse(),memory=document.createElement('p');
   memory.textContent=memories.length?'Recuerdos: '+memories.map(m=>'charló con '+(names.get(m.with)||'un vecino')).join(' · '):'Todavía no hay recuerdos.';card.append(memory);fragment.append(card);
  }
  list.replaceChildren(fragment);
  const diary=document.createDocumentFragment();
  const recent=world.events.filter(e=>['conversation_finished','kitchen_wait','repair_accepted','repair_declined','agreement_fulfilled'].includes(e.type)).slice(-5).reverse();
  if(!recent.length){const row=document.createElement('p');row.textContent='Todavía no hay encuentros registrados.';diary.append(row)}
  for(const event of recent){const row=document.createElement('p'),who=event.participants.map(id=>names.get(id)||'Un vecino').join(' y ');const messages={conversation_finished:who+' hablaron sobre '+event.topic+'.',kitchen_wait:who+' tuvieron que organizarse con la cocina.',repair_accepted:who+' hablaron y acordaron respetar el turno.',repair_declined:who+' necesitan más tiempo para resolver el desacuerdo.',agreement_fulfilled:who+' cumplieron el acuerdo de la cocina.'};row.textContent=messages[event.type];diary.append(row)}
  events?.replaceChildren(diary);
 }catch{clock.textContent='No se ha podido conectar con el mundo compartido. Reintentando…'}
}
refresh();setInterval(refresh,5000);
