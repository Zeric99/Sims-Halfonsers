import test from 'node:test';
import assert from 'node:assert/strict';
import { describeResident } from '../simulation/resident-details.js';
const base=()=>({people:[{id:'a',name:'Ana',homeId:'piso-1',needs:{},relationships:{b:{tension:30}},action:null},{id:'b',name:'Beto',homeId:'piso-1',needs:{}}],events:[],conflicts:{}});
test('muestra las etapas conocidas sin inventar la próxima actividad',()=>{
 const w=base(),p=w.people[0];assert.match(describeResident(w,'Ana',0).next,/no ha decidido/);
 p.action={id:'comer',label:'comiendo',start:100,travelMs:100,meal:{prepareMs:50}};
 assert.match(describeResident(w,'Ana',150).next,/preparar/);
 assert.match(describeResident(w,'Ana',220).current,/Preparando/);
 assert.match(describeResident(w,'Ana',220).next,/Comer/);
 assert.match(describeResident(w,'Ana',300).next,/no ha decidido/);
});
test('el historial es propio y se muestran tensión y conflictos abiertos',()=>{
 const w=base();w.events=[{personId:'b',type:'action_finished',action:'leer',at:1},{personId:'a',type:'action_finished',action:'dormir',at:2}];
 w.conflicts.x={participants:['a','b'],cause:'cocina',state:'open'};
 let info=describeResident(w,'Ana',3);assert.equal(info.history.length,1);assert.match(info.history[0].text,/durmió/);assert.equal(info.tensions[0].name,'Beto');assert.equal(info.conflicts[0].name,'Beto');
 assert.equal(describeResident(w,'Nadie',3),null);
});
