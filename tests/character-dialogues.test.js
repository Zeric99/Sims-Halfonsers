import test from 'node:test';
import assert from 'node:assert/strict';
import {characterDialogueOptions,chooseCharacterDialogue,footballTeams,meiNeedsBreak} from '../simulation/character-dialogues.js';
import {createWorld} from '../simulation/world.js';
import {openConversation} from '../simulation/social.js';
import {conversationMessages} from '../simulation/speech.js';
test('equipos correctos, Delos solo comenta TikToks y los indiferentes no hacen de hinchas',()=>{
 assert.deepEqual(footballTeams,{Eric:'Madrid',Adrián:'Madrid',Pablo:'Madrid',Arian:'Barça',Aisuke:'Barça',David:'Barça'});
 const options=(a,b)=>characterDialogueOptions({name:a},{name:b});
 assert.ok(options('Eric','David').some(o=>o.topic==='fútbol'));
 assert.ok(options('Delos','Arian').some(o=>o.topic==='fútbol en TikTok'));
 assert.ok(!options('Catalán','Yaiza').some(o=>o.topic==='fútbol'));
 assert.ok(!options('Mei','Eric').some(o=>o.topic==='fútbol'));
});
test('el guion respeta quién cuenta la anécdota en ambos órdenes',()=>{
 const direct=characterDialogueOptions({name:'Snow'},{name:'Eric'}).find(o=>o.key==='personal:Snow:0');
 const reverse=characterDialogueOptions({name:'Eric'},{name:'Snow'}).find(o=>o.key===direct.key);
 assert.deepEqual(reverse.lines.slice(1),direct.lines);
 assert.equal(reverse.lines[0],'¿Qué te cuentas?');
 const conspiracy=characterDialogueOptions({name:'Eric'},{name:'Linkal'}).find(o=>o.key==='conspiracion:0');
 assert.match(conspiracy.lines[1],/^Eric,/);
});
test('evita los últimos guiones y la elección se reconstruye igual para todos',()=>{
 const a={name:'Eric'},b={name:'Linkal'},recent=[];
 for(let i=0;i<30;i++){
  const c={id:'test:'+i},copy={...c};
  const dialogue=chooseCharacterDialogue(c,a,b,recent);
  assert.deepEqual(chooseCharacterDialogue(copy,a,b,recent),dialogue);
  assert.ok(!recent.slice(0,Math.min(18,characterDialogueOptions(a,b).length-1)).some(old=>old.dialogueKey===c.dialogueKey));
  recent.unshift(c);
 }
});
test('las conversaciones personalizadas se guardan y todos sus turnos caben en la duración',()=>{
 const world=createWorld({now:0});
 const a=world.people.find(p=>p.name==='Snow'),b=world.people.find(p=>p.name==='Eric');
 const c=openConversation(world,a,b,0);
 assert.ok(c.dialogueKey);
 const messages=conversationMessages(c,c.end-1,0);
 assert.equal(messages.length,c.dialogue.length);
 assert.deepEqual(conversationMessages(JSON.parse(JSON.stringify(c)),c.end-1,0),messages);
 assert.equal(world.events.at(-1).topic,c.topic);
});
test('la pausa de Mei depende de saturación, no se aplica a todos ni siempre',()=>{
 assert.equal(meiNeedsBreak({name:'Mei',needs:{diversion:20}}),true);
 assert.equal(meiNeedsBreak({name:'Mei',needs:{diversion:80}}),false);
 assert.equal(meiNeedsBreak({name:'Mei',needs:{diversion:80},relationships:{x:{tension:15}}}),true);
 assert.equal(meiNeedsBreak({name:'Yaiza',needs:{diversion:20}}),false);
});
