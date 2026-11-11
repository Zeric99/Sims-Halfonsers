import test from 'node:test';import assert from 'node:assert/strict';import {speechAt,conversationMessages} from '../simulation/speech.js';
test('los bocadillos alternan sobre el hablante y desaparecen al terminar',()=>{
 const c={start:0,end:24*60000,participants:['a','b'],topic:'cine',lines:{a:'Hola',b:'Qué tal'}};
 assert.equal(speechAt(c,'a',1),'Hola');assert.equal(speechAt(c,'b',1),'');
 assert.equal(speechAt(c,'a',8*60000),'');assert.equal(speechAt(c,'b',8*60000),'Qué tal');
 assert.notEqual(speechAt(c,'a',16*60000),'Hola');assert.equal(speechAt(c,'a',24*60000),'');
});
test('si no hay frases guardadas usan diálogos comprensibles y compartidos',()=>{
 const c={id:'conversacion-1',start:0,end:24*60000,participants:['a','b'],topic:'música',lines:{}};
 const first=speechAt(c,'a',1),second=speechAt(c,'b',8*60000);
 assert.match(first,/música/);assert.ok(second.length>0);assert.equal(first,speechAt(c,'a',1));
});

test('el historial conserva los turnos y desaparece en orden aunque el servidor ya haya cerrado la charla',()=>{
 const c={start:0,end:24*60000,participants:['a','b'],lines:{a:'Hola',b:'Qué tal'}};
 const active=conversationMessages(c,16*60000,0);
 assert.deepEqual(active.map(m=>[m.speaker,m.opacity]),[['a',1],['b',1],['a',1]]);
 assert.equal(new Set(active.map(m=>m.text)).size,3);
 c.finished=true;
 const fading=conversationMessages(c,c.end,300);
 assert.ok(fading[0].opacity<1&&fading[1].opacity===1);
 assert.deepEqual(conversationMessages(c,c.end,900).map(m=>m.turn),[1,2]);
 assert.deepEqual(conversationMessages(c,c.end,1500).map(m=>m.turn),[2]);
 assert.deepEqual(conversationMessages(c,c.end,2100),[]);
});

test('una charla interrumpida solo conserva los mensajes que llegaron a decirse',()=>{
 const c={start:0,end:24*60000,cancelled:true,cancelledAt:9*60000,participants:['a','b']};
 assert.deepEqual(conversationMessages(c,12*60000,0).map(m=>m.turn),[0,1]);
 delete c.cancelledAt;
 assert.deepEqual(conversationMessages(c,12*60000,0),[]);
});

test('un plan de anime tiene cinco intervenciones distintas y cambia al repetirlo',async()=>{
 const {createWorld}=await import('../simulation/world.js');
 const {openConversation,finishConversation}=await import('../simulation/social.js');
 const world=createWorld({now:0}),[a,b]=world.people;
 const options={plan:{id:'plan',kind:'anime'},minutes:35};
 const first=openConversation(world,a,b,0,options);
 const messages=conversationMessages(first,first.end-1,0);
 assert.equal(messages.length,5);
 assert.equal(new Set(messages.map(m=>m.text)).size,5);
 assert.deepEqual(conversationMessages(JSON.parse(JSON.stringify(first)),first.end-1,0),messages);
 finishConversation(world,first.id,first.end);
 a.action=b.action=null;
 const second=openConversation(world,a,b,first.end,options);
 assert.notDeepEqual(second.dialogue,first.dialogue);
});

test('una frase personalizada seleccionada aparece una vez dentro del diálogo completo',()=>{
 const c={start:0,end:35*60000,participants:['a','b'],
  dialogue:['Uno','Dos','Tres','Cuatro','Cinco'],lines:{a:'Mi frase'}};
 const messages=conversationMessages(c,c.end-1,0);
 assert.equal(messages.filter(m=>m.text==='Mi frase').length,1);
 assert.equal(messages.at(-1).speaker,'a');
});
