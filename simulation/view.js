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
  const fragment=document.createDocumentFragment();
  for(const person of world.people){const row=document.createElement('p');row.style.margin='5px 0';const name=document.createElement('strong');name.textContent=person.name+': ';row.append(name,document.createTextNode(person.action?.label||'descansando'));fragment.append(row)}
  list.replaceChildren(fragment);
  const diary=document.createDocumentFragment(),names=new Map(world.people.map(p=>[p.id,p.name]));
  const recent=world.events.filter(e=>e.type==='conversation_finished').slice(-4).reverse();
  if(!recent.length){const row=document.createElement('p');row.textContent='Todavía no hay encuentros registrados.';diary.append(row)}
  for(const event of recent){const row=document.createElement('p');row.textContent=event.participants.map(id=>names.get(id)||'Un vecino').join(' y ')+' hablaron sobre '+event.topic+'.';diary.append(row)}
  events?.replaceChildren(diary);
 }catch{clock.textContent='No se ha podido conectar con el mundo compartido. Reintentando…'}
}
refresh();setInterval(refresh,5000);
