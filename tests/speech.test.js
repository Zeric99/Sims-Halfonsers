import test from 'node:test';import assert from 'node:assert/strict';import {speechAt} from '../simulation/speech.js';
test('los bocadillos alternan sobre el hablante y desaparecen al terminar',()=>{
 const c={start:0,end:24*60000,participants:['a','b'],topic:'cine',lines:{a:'Hola',b:'Qué tal'}};
 assert.equal(speechAt(c,'a',1),'Hola');assert.equal(speechAt(c,'b',1),'');
 assert.equal(speechAt(c,'a',8*60000),'');assert.equal(speechAt(c,'b',8*60000),'Qué tal');
 assert.equal(speechAt(c,'a',16*60000),'Hola');assert.equal(speechAt(c,'a',24*60000),'');
});
