import test from 'node:test';import assert from 'node:assert/strict';import {speechAt} from '../simulation/speech.js';
test('los bocadillos alternan sobre el hablante y desaparecen al terminar',()=>{
 const c={start:0,end:24*60000,participants:['a','b'],topic:'cine',lines:{a:'Hola',b:'Qué tal'}};
 assert.equal(speechAt(c,'a',1),'Hola');assert.equal(speechAt(c,'b',1),'');
 assert.equal(speechAt(c,'a',8*60000),'');assert.equal(speechAt(c,'b',8*60000),'Qué tal');
 assert.equal(speechAt(c,'a',16*60000),'Hola');assert.equal(speechAt(c,'a',24*60000),'');
});
test('si no hay frases guardadas usan diálogos comprensibles y compartidos',()=>{
 const c={id:'conversacion-1',start:0,end:24*60000,participants:['a','b'],topic:'música',lines:{}};
 const first=speechAt(c,'a',1),second=speechAt(c,'b',8*60000);
 assert.match(first,/música/);assert.ok(second.length>0);assert.equal(first,speechAt(c,'a',1));
});
