import { advanceWorld, resumeAfterAbsence, ENGINE_VERSION, SCHEMA_VERSION } from './world.js';
import { createSimulationClock, simulationTime, clockRateAt } from './clock.js';
import { validateWorldEnvelope } from './world-schema.js';

// El almacén aporta lectura y escritura condicional por versión.
// Ante una colisión se vuelve a leer el estado ganador antes de reintentar.
export async function advanceSharedWorld({read,write,now=Date.now,maxAttempts=5}){
 for(let attempt=0;attempt<maxAttempts;attempt++){
  const row=await read();
  if(!row)throw new Error('Mundo no disponible');
  const world=row.state;
  validateWorldEnvelope(world,{schemaVersion:SCHEMA_VERSION,simulationVersion:ENGINE_VERSION});
  const wallNow=now(),isNewClock=!world.simulationClock;
  if(isNewClock)world.simulationClock=createSimulationClock(wallNow);
  // Migrar relojes antiguos conservando exactamente la hora alcanzada.
  if(!isNewClock&&world.simulationClock.mode!=='cycle29'){
   const current=simulationTime(world.simulationClock,wallNow);
   world.simulationClock=createSimulationClock(wallNow,current);
  }
  const target=simulationTime(world.simulationClock,wallNow);
  const returned=resumeAfterAbsence(world,target,{wallNow,force:isNewClock});
  const result=advanceWorld(world,Math.max(target,world.lastSimulatedAt),{maxMinutes:2880});
  world.lastObservedAt=wallNow;
  if(await write(row.version,result.world))return {world:result.world,recovering:!result.complete,serverTime:target,clockRate:clockRateAt(world.simulationClock,target),serverWallTime:wallNow,mode:'activo_con_visitantes',returned};
 }
 return null;
}
