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

test('congela las frases al comenzar la conversación para todos los espectadores',async()=>{
 const {createWorld}=await import('../simulation/world.js');const {openConversation}=await import('../simulation/social.js');
 const world=createWorld({now:0}),a=world.people[0],b=world.people[1];world.phraseCatalog=[{personId:a.id,text:'Primera frase'}];
 let conversation;for(let i=0;i<20;i++){a.action=b.action=null;world.conversations={};conversation=openConversation(world,a,b,0);if(conversation.lines[a.id])break}
 assert.equal(conversation.lines[a.id],'Primera frase');const persisted=JSON.parse(JSON.stringify(conversation));world.phraseCatalog.push({personId:a.id,text:'Nueva frase'});
 assert.equal(conversation.lines[a.id],persisted.lines[a.id]);assert.equal(persisted.lines[a.id],'Primera frase');
});
