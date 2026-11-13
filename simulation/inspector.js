import {executionState} from './execution.js';

const executionLabels={IDLE:'sin actividad',MOVING:'en camino',WAITING:'esperando',SLEEPING:'durmiendo',ACTING:'realizando actividad'};

const formatTime=new Intl.DateTimeFormat('es-ES',{
 timeZone:'UTC',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',second:'2-digit'
});

export function mountInspector(container,initial){
 const panel=document.createElement('details');
 panel.className='box dev-inspector';
 const title=document.createElement('summary');
 title.textContent='Inspector del barrio';
 const scenarios=document.createElement('nav');
 scenarios.setAttribute('aria-label','Escenas de prueba');
 for(const [label,query] of [
  ['Partida',''],['Noche','qa=night'],['Diálogo','qa=social&phase=stack'],
  ['Cocina','qa=meal&phase=cooking'],['Evolución','qa=evolution']
 ]){
  const link=document.createElement('a');
  link.textContent=label;
  link.href='/?inspector'+(query?'&'+query:'');
  scenarios.append(link);
 }
 const label=document.createElement('label');
 label.textContent='Vecino ';
 const select=document.createElement('select');
 select.setAttribute('aria-label','Vecino del inspector');
 label.append(select);
 const state=document.createElement('pre');
 panel.append(title,scenarios,label,state);
 container.append(panel);

 let reading=initial;
 function render(){
  if(!panel.open||!reading)return;
  const {world,serverTime,mode,returned,recovering}=reading;
  if(!select.options.length){
   for(const person of world.people)select.add(new Option(person.name,person.id));
  }
  const person=world.people.find(p=>p.id===select.value);
  const reservations=Object.entries(world.reservations);
  const lines=[
   'Partida: '+mode+' · '+world.worldId,
   'Versión: '+world.worldVersion+' · esquema '+world.schemaVersion+' · motor '+world.simulationVersion,
   'Hora de la lectura: '+formatTime.format(serverTime),
   'Último paso: '+formatTime.format(world.lastSimulatedAt),
   'Recuperación: '+(recovering?'en curso':returned?'reanudada tras ausencia':'al día'),
   'Eventos: '+world.events.length+' · última secuencia '+world.eventSequence
  ];
  if(person){
   const {action}=person;
   lines.push('',person.name+' · '+person.homeId,
    'Actividad: '+(action?.label??'Sin actividad')+' · '+executionLabels[executionState(action,serverTime)],
    'Trayecto: '+(action?.route?.length??0)+' puntos',
    'Necesidades: '+Object.entries(person.needs).map(([key,value])=>key+' '+Math.round(value)).join(' · '),
    'Recuerdos: '+(person.memories?.length??0)+' · objetivo '+(person.goal?.status??'sin objetivo'));
  }
  lines.push('','Reservas activas');
  const names=new Map(world.people.map(p=>[p.id,p.name]));
  const active=reservations.filter(([,entry])=>entry.until>serverTime);
  for(const [key,entry] of active){
   lines.push(key+' · '+(names.get(entry.personId)??entry.personId)+' · hasta '+formatTime.format(entry.until));
  }
  if(!active.length)lines.push('Sin reservas');
  state.textContent=lines.join('\n');
 }
 select.addEventListener('change',render);
 panel.addEventListener('toggle',render);
 window.addEventListener('shared-world',event=>{reading=event.detail;render()});
}
