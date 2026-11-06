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
 const validPoint=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.z);
 const actions=new Set(['esperar','practicar','ver_tv','fumar','pasear','dormir','comer','usar_bano','asearse','jugar','estudiar','limpiar','descansar','leer','charlar']);
 for(const person of world.people){
  if(!person||typeof person.id!=='string'||!person.id||ids.has(person.id))throw new TypeError('Identificador de habitante inválido o duplicado');
  if(!person.profile||!person.needs||typeof person.needs!=='object')throw new TypeError('Perfil o necesidades ausentes');
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
   if(action.route!=null&&(!Array.isArray(action.route)||action.route.some(point=>!validPoint(point))))throw new TypeError('Trayecto inválido');
  }
  ids.add(person.id);
 }
 return true;
}
