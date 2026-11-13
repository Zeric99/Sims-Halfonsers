// Un día de juego: 16 horas diurnas en 29 minutos reales y 8 nocturnas en uno.
export const DAY_RATE=960/29, NIGHT_RATE=480, DEFAULT_RATE=DAY_RATE;
export const DEFAULT_GAME_START=Date.UTC(2026,0,1,7);
const HOUR=3600000, DAY=24*HOUR, CYCLE=30*60000, DAY_REAL=29*60000, DAY_GAME=16*HOUR;
export function createSimulationClock(realAnchor,gameAnchor=DEFAULT_GAME_START,rate){
 if(!Number.isFinite(realAnchor)||!Number.isFinite(gameAnchor)||(rate!==undefined&&(!Number.isFinite(rate)||rate<=0)))throw new RangeError('Reloj inválido');
 return rate===undefined?{realAnchor,gameAnchor,mode:'cycle29'}:{realAnchor,gameAnchor,rate};
}
function coordinate(game){const delta=game-DEFAULT_GAME_START,days=Math.floor(delta/DAY),within=delta-days*DAY;return days*CYCLE+(within<DAY_GAME?within/DAY_RATE:DAY_REAL+(within-DAY_GAME)/NIGHT_RATE)}
export function simulationTime(clock,wallNow){
 if(!clock||!Number.isFinite(clock.realAnchor)||!Number.isFinite(clock.gameAnchor)||!Number.isFinite(wallNow))throw new RangeError('Reloj inválido');
 if(clock.mode!=='cycle29'){
  if(!Number.isFinite(clock.rate)||clock.rate<=0)throw new RangeError('Reloj inválido');
  return clock.gameAnchor+(wallNow-clock.realAnchor)*clock.rate;
 }
 const coordinateNow=coordinate(clock.gameAnchor)+wallNow-clock.realAnchor,days=Math.floor(coordinateNow/CYCLE),within=coordinateNow-days*CYCLE;
 return DEFAULT_GAME_START+days*DAY+(within<DAY_REAL?within*DAY_RATE:DAY_GAME+(within-DAY_REAL)*NIGHT_RATE);
}
export function isDay(gameTime){const hour=new Date(gameTime).getUTCHours();if(!Number.isFinite(hour))throw new RangeError('Hora inválida');return hour>=7&&hour<23}
export function clockRateAt(clock,gameTime){return clock.mode==='cycle29'?(isDay(gameTime)?DAY_RATE:NIGHT_RATE):clock.rate}

export function realElapsed(clock,from,to){
 return clock.mode==='cycle29'?coordinate(to)-coordinate(from):(to-from)/clock.rate;
}

// Proyecta la última lectura del servidor con el reloj monotónico del navegador.
export function snapshotTime(snapshot,elapsedMs){
 const {world,serverTime,serverWallTime,clockRate}=snapshot;
 return world.simulationClock&&Number.isFinite(serverWallTime)
  ?simulationTime(world.simulationClock,serverWallTime+elapsedMs)
  :serverTime+elapsedMs*clockRate;
}
