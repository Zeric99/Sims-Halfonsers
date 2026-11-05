import test from 'node:test';
import assert from 'node:assert/strict';
import {executionState} from '../simulation/execution.js';

test('los estados distinguen viaje, espera, actividad y sueño al llegar',()=>{
 assert.equal(executionState(null,0),'IDLE');
 const sleep={id:'dormir',start:100,travelMs:50};
 assert.equal(executionState(sleep,149),'MOVING');
 assert.equal(executionState(sleep,150),'SLEEPING');
 assert.equal(executionState({id:'esperar',start:0,travelMs:0},1),'WAITING');
 assert.equal(executionState({id:'comer',start:0,travelMs:0},1),'ACTING');
 assert.throws(()=>executionState(null,NaN),RangeError);
});
