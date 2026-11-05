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
 if(!Array.isArray(world.people)||!Array.isArray(world.events)||!world.reservations||typeof world.reservations!=='object')
  throw new TypeError('Estado de habitantes o reservas inválido');
 const ids=new Set();
 for(const person of world.people){
  if(!person||typeof person.id!=='string'||!person.id||ids.has(person.id))throw new TypeError('Identificador de habitante inválido o duplicado');
  if(!person.profile||!person.needs)throw new TypeError('Perfil o necesidades ausentes');
  ids.add(person.id);
 }
 return true;
}
