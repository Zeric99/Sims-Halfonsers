import test from 'node:test';import assert from 'node:assert/strict';
import {normalizePhrase,phraseForConversation} from '../simulation/phrases.js';
test('valida personaje, limpia espacios y limita la longitud',()=>{
 assert.deepEqual(normalizePhrase({personId:'mii-1',text:' Hola\n amigos  '}),{personId:'mii-1',text:'Hola amigos'});
 for(const value of [{personId:'mii-99',text:'hola'},{personId:'mii-1',text:'  '},{personId:'mii-1',text:'a'.repeat(101)}])assert.equal(normalizePhrase(value),null);
});
test('elige frases del personaje de forma determinista y solo en algunas conversaciones',()=>{
 const phrases=[{personId:'mii-1',text:'Hola'},{personId:'mii-2',text:'Otra'}],outcomes=[];
 for(let i=0;i<20;i++){const c={id:'conversation:'+i,participants:['mii-1','mii-2']},first=phraseForConversation(c,'mii-1',phrases);assert.equal(first,phraseForConversation(c,'mii-1',phrases));assert.notEqual(first,'Otra');outcomes.push(first)}
 assert.ok(outcomes.includes('Hola'));assert.ok(outcomes.includes(null));assert.equal(phraseForConversation({id:'x',participants:['mii-2']},'mii-1',phrases),null);
});
