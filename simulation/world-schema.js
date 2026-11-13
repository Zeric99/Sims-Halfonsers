import {TRAITS} from './profiles.js';
// Validar la envoltura antes de migrar o modificar un mundo persistido.
export function validateWorldEnvelope(world,{schemaVersion,simulationVersion}){
 if(!world||typeof world!=='object'||Array.isArray(world))throw new TypeError('Mundo inválido');
 if(world.schemaVersion!==schemaVersion)throw new RangeError('Versión de esquema no compatible');
 if(!Number.isInteger(world.simulationVersion)||world.simulationVersion<1||world.simulationVersion>simulationVersion)
  throw new RangeError('Versión de simulación no compatible');
 if(typeof world.worldId!=='string'||!world.worldId||!Number.isFinite(world.lastSimulatedAt))
  throw new TypeError('Identidad o reloj del mundo inválidos');
 if(!Number.isInteger(world.worldVersion)||world.worldVersion<0||!Number.isInteger(world.randomState)||world.randomState<0||world.randomState>0xffffffff)
  throw new TypeError('Versión o generador inválidos');
 if(!Array.isArray(world.people)||!Array.isArray(world.events)||!world.reservations||typeof world.reservations!=='object'||Array.isArray(world.reservations))
  throw new TypeError('Estado de habitantes o reservas inválido');
 const ids=new Set();
 const object=value=>value&&typeof value==='object'&&!Array.isArray(value);
 if(!Number.isSafeInteger(world.eventSequence)||world.eventSequence<0)throw new TypeError('Secuencia de eventos inválida');
 const eventIds=new Set();
 for(const event of world.events){if(!object(event)||typeof event.id!=='string'||eventIds.has(event.id)||typeof event.type!=='string'||!Number.isFinite(event.at))throw new TypeError('Evento inválido o duplicado');eventIds.add(event.id)}
 if(world.chronicle!=null&&(!object(world.chronicle)||!Number.isSafeInteger(world.chronicle.sequence)
  ||world.chronicle.sequence<0||world.chronicle.sequence>world.eventSequence
  ||!Array.isArray(world.chronicle.events)||world.chronicle.events.length>900
  ||world.chronicle.events.some(e=>!object(e)||typeof e.id!=='string'||typeof e.type!=='string'||!Number.isFinite(e.at))))
  throw new TypeError('Crónicas inválidas');
 for(const reservation of Object.values(world.reservations))if(!object(reservation)||typeof reservation.personId!=='string'||!Number.isFinite(reservation.until))throw new TypeError('Reserva inválida');
 if(world.simulationVersion>=5)for(const home of ['piso-1','piso-2','piso-3','piso-4'])if(!Number.isFinite(world.households?.[home]?.mess)||world.households[home].mess<0||world.households[home].mess>100)throw new TypeError('Estado doméstico inválido');
 const validPoint=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.z);
 const actions=new Set(['esperar','practicar','ver_tv','fumar','pasear','dormir','comer','usar_bano','asearse','jugar','estudiar','limpiar','descansar','leer','charlar']);
 for(const person of world.people){
  if(!person||typeof person.id!=='string'||!person.id||ids.has(person.id))throw new TypeError('Identificador de habitante inválido o duplicado');
  if(!person.profile||!person.needs||typeof person.needs!=='object')throw new TypeError('Perfil o necesidades ausentes');
  if(!['piso-1','piso-2','piso-3','piso-4'].includes(person.homeId)||typeof person.name!=='string')throw new TypeError('Identidad inválida');
  const profile=person.profile;
  if(!Array.isArray(profile.interests)||profile.interests.some(x=>typeof x!=='string')||!object(profile.traits)||Object.values(profile.traits).some(x=>!Number.isFinite(x)||x<0||x>1)||(world.simulationVersion>=2&&TRAITS.some(key=>!Number.isFinite(profile.traits[key])))||![profile.sleepHour,profile.wakeHour].every(h=>Number.isFinite(h)&&h>=0&&h<24))throw new TypeError('Perfil inválido');
  if(person.learned!=null&&!object(person.learned))throw new TypeError('Aprendizaje inválido');
  for(const field of ['skills','preferences','contexts','recipes'])if(person.learned?.[field]!=null&&!object(person.learned[field]))throw new TypeError('Aprendizaje inválido');
  if(person.learned?.recipes&&Object.values(person.learned.recipes).some(value=>!Number.isInteger(value)))throw new TypeError('Práctica de recetas inválida');
  if(person.memories!=null&&(!Array.isArray(person.memories)||person.memories.some(m=>!object(m))))
   throw new TypeError('Recuerdos inválidos');
  if(person.goal!=null){
   const goal=person.goal;
   if(!object(goal)||typeof goal.id!=='string'||!['recipe','practice','plan','repair'].includes(goal.kind)
    ||!['active','completed','expired','cancelled'].includes(goal.status)||!Number.isInteger(goal.target)||goal.target<1
    ||!Number.isInteger(goal.progress)||goal.progress<0||goal.progress>goal.target
    ||!Number.isFinite(goal.priority)||goal.priority<0||goal.priority>.2
    ||!Number.isFinite(goal.createdAt)||!Number.isFinite(goal.expiresAt)||goal.expiresAt<=goal.createdAt)
    throw new TypeError('Objetivo inválido');
  }
  if(person.reflection!=null&&(!object(person.reflection)||!Number.isFinite(person.reflection.at)))
   throw new TypeError('Reflexión inválida');
  if(person.relationships!=null){if(!object(person.relationships))throw new TypeError('Relaciones inválidas');for(const r of Object.values(person.relationships)){if(!object(r))throw new TypeError('Relación inválida');for(const [key,min] of [['friendship',-100],['trust',0],['tension',0],['familiarity',0],['romanticInterest',0]])if(r[key]!=null&&(!Number.isFinite(r[key])||r[key]<min||r[key]>100))throw new TypeError('Relación inválida')}}
  for(const [key,min,max] of [['skills',0,100],['preferences',-1,1],['contexts',-1,1],['recipes',0,100]])if(person.learned?.[key]&&Object.values(person.learned[key]).some(v=>!Number.isFinite(v)||v<min||v>max))throw new TypeError('Aprendizaje inválido');
  for(const key of ['saciedad','energia','higiene','compania','diversion','bano']){
   if(key==='bano'&&world.simulationVersion<4&&person.needs[key]===undefined)continue;
   const value=person.needs[key];
   if(!Number.isFinite(value)||value<0||value>100)throw new RangeError('Necesidad inválida: '+key);
  }
  if(person.position!=null&&!validPoint(person.position))throw new TypeError('Posición inválida');
  const action=person.action;
  if(action!=null){
   if(!actions.has(action.id)||!Number.isFinite(action.start)||!Number.isFinite(action.until)||action.until<action.start)
    throw new TypeError('Acción inválida');
   if(action.travelMs!=null&&(!Number.isFinite(action.travelMs)||action.travelMs<0))throw new TypeError('Duración de trayecto inválida');
   if(action.resource!=null&&typeof action.resource!=='string')throw new TypeError('Recurso inválido');
   if(action.route!=null&&(!Array.isArray(action.route)||action.route.some(point=>!validPoint(point))))throw new TypeError('Trayecto inválido');
   if(action.seat&&!validPoint(action.seat))throw new TypeError('Asiento inválido');
   if(action.care&&(!Number.isFinite(action.care.durationMs)||action.care.durationMs<=0))throw new TypeError('Aseo inválido');
   if(action.meal){
    const meal=action.meal;
    if(action.id!=='comer'||!Number.isFinite(meal.eatMs)||meal.eatMs<=0)throw new TypeError('Comida inválida');
    if(meal.stages){
     const kinds=['to_fridge','fridge','to_stove','cooking','to_table','eating'];
     if(!Array.isArray(meal.stages)||meal.stages.length!==kinds.length)throw new TypeError('Etapas de comida inválidas');
     let cursor=action.start;
     for(let i=0;i<kinds.length;i++){const stage=meal.stages[i];if(!stage||stage.kind!==kinds[i]||stage.start!==cursor||!Number.isFinite(stage.end)||stage.end<stage.start||!Array.isArray(stage.route)||!stage.route.length||stage.route.some(p=>!validPoint(p)))throw new TypeError('Etapa de comida inválida');cursor=stage.end}
     if(cursor!==action.until||meal.eatingStart!==meal.stages[5].start||meal.eatMs!==meal.stages[5].end-meal.stages[5].start||!validPoint(meal.seat))throw new TypeError('Tiempos de comida inválidos');
    }else if(!Number.isFinite(meal.prepareMs)||meal.prepareMs<0)throw new TypeError('Preparación inválida');
    if(meal.nutrition!=null&&(!Number.isFinite(meal.nutrition)||meal.nutrition<=0||meal.nutrition>100))throw new TypeError('Nutrición inválida');
   }

  }
  ids.add(person.id);
 }
 if(world.plans!=null){
  if(!object(world.plans))throw new TypeError('Agenda inválida');
  for(const [id,plan] of Object.entries(world.plans)){
   if(!object(plan)||plan.id!==id||!['games','anime','cooking','gym'].includes(plan.kind)
    ||!['scheduled','travelling','active','declined','completed','cancelled','missed'].includes(plan.status)
    ||!Number.isFinite(plan.scheduledAt)||!Array.isArray(plan.participants)||plan.participants.length!==2
    ||plan.participants[0]===plan.participants[1]||plan.participants.some(id=>!ids.has(id)))throw new TypeError('Plan inválido');
   if(['travelling','active'].includes(plan.status)&&(!Number.isFinite(plan.arriveBy)
    ||!Array.isArray(plan.keys)||plan.keys.some(key=>typeof key!=='string')
    ||(plan.seats!=null&&(!Array.isArray(plan.seats)||plan.seats.length!==2||plan.seats.some(seat=>!validPoint(seat))))))
    throw new TypeError('Destino del plan inválido');
  }
 }
 if(world.groupEvents!=null){
  if(!object(world.groupEvents))throw new TypeError('Agenda de grupo inválida');
  for(const [id,event] of Object.entries(world.groupEvents)){
   if(!object(event)||event.id!==id||!['dinner','anime','tournament','barbecue'].includes(event.kind)
    ||!['scheduled','travelling','active','completed','cancelled'].includes(event.status)
    ||!ids.has(event.hostId)||!Number.isFinite(event.scheduledAt)
    ||!Array.isArray(event.attending)||event.attending.length>5||new Set(event.attending).size!==event.attending.length
    ||event.attending.some(id=>!ids.has(id))||!object(event.replies)
    ||Object.entries(event.replies).some(([id,reply])=>!ids.has(id)||!['accepted','busy','declined'].includes(reply)))
    throw new TypeError('Evento de grupo inválido');
   if(event.status==='travelling'&&!Number.isFinite(event.arriveBy))throw new TypeError('Trayecto de grupo inválido');
   if(event.status==='active'&&(!Number.isFinite(event.start)||!Number.isFinite(event.end)||event.end<=event.start
    ||(event.kind==='tournament'&&(!Array.isArray(event.ranking)||event.ranking.length!==event.attending.length||new Set(event.ranking).size!==event.ranking.length||event.ranking.some(id=>!event.attending.includes(id))))
    ||!Number.isFinite(event.dialogue?.turnMs)||event.dialogue.turnMs<=0||!Array.isArray(event.dialogue.speakers)
    ||event.dialogue.speakers.length!==6||event.dialogue.speakers.some(id=>!event.attending.includes(id))
    ||!Array.isArray(event.dialogue.dialogue)||event.dialogue.dialogue.length!==6))
    throw new TypeError('Diálogo de grupo inválido');
  }
 }
 return true;
}
