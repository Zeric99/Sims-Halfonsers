import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeChatMessage } from '../simulation/chat-validation.js';

test('normaliza mensajes y rechaza nombres o contenido vacíos y demasiado largos',()=>{
 assert.deepEqual(normalizeChatMessage({name:'  Eric  ',message:'  Hola\nvecinos  '}),{name:'Eric',message:'Hola\nvecinos'});
 for(const body of [null,{}, {name:'\u0001',message:'hola'}, {name:'Eric',message:'\u0000'}, {name:'x'.repeat(33),message:'hola'}, {name:'Eric',message:'x'.repeat(501)}])assert.equal(normalizeChatMessage(body),null);
});
