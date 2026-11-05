import { advanceWorld, resumeAfterAbsence } from './world.js';

// El almacén aporta lectura y escritura condicional por versión.
// Ante una colisión se vuelve a leer el estado ganador antes de reintentar.
export async function advanceSharedWorld({read,write,now=Date.now,maxAttempts=5}){
 for(let attempt=0;attempt<maxAttempts;attempt++){
  const row=await read();
  if(!row)throw new Error('Mundo no disponible');
  const world=row.state,wallNow=now(),isNewClock=!world.simulationClock;
  if(isNewClock)world.simulationClock={realAnchor:wallNow,gameAnchor:Date.UTC(2026,0,1,7),rate:48};
  const target=world.simulationClock.gameAnchor+(wallNow-world.simulationClock.realAnchor)*world.simulationClock.rate;
  const returned=resumeAfterAbsence(world,target,{wallNow,force:isNewClock});
  const result=advanceWorld(world,Math.max(target,world.lastSimulatedAt),{maxMinutes:2880});
  world.lastObservedAt=wallNow;
  if(await write(row.version,result.world))return {world:result.world,recovering:!result.complete,serverTime:target,clockRate:world.simulationClock.rate,mode:'activo_con_visitantes',returned};
 }
 return null;
}
