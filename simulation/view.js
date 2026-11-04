const clock=document.querySelector('#world-clock'), list=document.querySelector('#world-activities');
let lastVersion=-1;
async function refresh(){
 try{
  const response=await fetch('/api/world',{cache:'no-store'});
  if(!response.ok)throw new Error('No disponible');
  const data=await response.json(),world=data.world;
  if(world.worldVersion<lastVersion)return;
  lastVersion=world.worldVersion;
  const date=new Intl.DateTimeFormat('es-ES',{timeZone:world.timezone,dateStyle:'medium',timeStyle:'short'}).format(world.lastSimulatedAt);
  clock.textContent=date+(data.recovering?' · recuperando tiempo anterior':' · estado compartido')+'. Los paseos 3D aún son ilustrativos.';
  const fragment=document.createDocumentFragment();
  for(const person of world.people){const row=document.createElement('p');row.style.margin='5px 0';const name=document.createElement('strong');name.textContent=person.name+': ';row.append(name,document.createTextNode(person.action?.label||'descansando'));fragment.append(row)}
  list.replaceChildren(fragment);
 }catch{clock.textContent='No se ha podido conectar con el mundo compartido. Reintentando…'}
}
refresh();setInterval(refresh,30000);
