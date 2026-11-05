// Reloj ficticio: 48 minutos simulados por minuto real.
// Así 16 horas de día duran 20 minutos y 8 horas de noche duran 10.
export const DEFAULT_RATE = 48;
export const DEFAULT_GAME_START = Date.UTC(2026,0,1,7);
export function createSimulationClock(realAnchor,gameAnchor=DEFAULT_GAME_START,rate=DEFAULT_RATE){
 if(!Number.isFinite(realAnchor)||!Number.isFinite(gameAnchor)||!Number.isFinite(rate)||rate<=0)
  throw new RangeError('Reloj inválido');
 return {realAnchor,gameAnchor,rate};
}
export function simulationTime(clock,wallNow){
 if(!clock||!Number.isFinite(clock.realAnchor)||!Number.isFinite(clock.gameAnchor)||!Number.isFinite(clock.rate)||clock.rate<=0||!Number.isFinite(wallNow))
  throw new RangeError('Reloj inválido');
 return clock.gameAnchor+(wallNow-clock.realAnchor)*clock.rate;
}
export function isDay(gameTime){
 const hour=new Date(gameTime).getUTCHours();
 if(!Number.isFinite(hour))throw new RangeError('Hora inválida');
 return hour>=7&&hour<23;
}
