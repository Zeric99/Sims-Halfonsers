import test from 'node:test';
import assert from 'node:assert/strict';
import { createSimulationClock, simulationTime, isDay } from '../simulation/clock.js';

test('el ciclo tiene 29 minutos de día y 1 de noche',()=>{
 const start=1700000000000,clock=createSimulationClock(start);
 assert.equal(isDay(simulationTime(clock,start)),true);
 assert.equal(isDay(simulationTime(clock,start+29*60000-1)),true);
 assert.equal(isDay(simulationTime(clock,start+29*60000)),false);
 assert.equal(isDay(simulationTime(clock,start+30*60000-1)),false);
 assert.equal(isDay(simulationTime(clock,start+30*60000)),true);
 assert.equal(simulationTime(clock,start+30*60000)-simulationTime(clock,start),24*3600000);
});
test('el reloj se puede inyectar y rechaza velocidades o instantes inválidos',()=>{
 const c=createSimulationClock(1000,5000,2);
 assert.equal(simulationTime(c,1500),6000);
 assert.throws(()=>createSimulationClock(0,0,0),RangeError);
 assert.throws(()=>simulationTime(c,NaN),RangeError);
 assert.throws(()=>isDay(NaN),RangeError);
});
test('al reanclar de madrugada respeta el minuto restante de noche',()=>{
 const wall=1700000000000,game=Date.UTC(2026,0,1,23,0),clock=createSimulationClock(wall,game);
 assert.equal(isDay(simulationTime(clock,wall+59999)),false);
 assert.equal(simulationTime(clock,wall+60000),Date.UTC(2026,0,2,7));
});
