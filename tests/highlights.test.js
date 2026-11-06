import test from 'node:test';import assert from 'node:assert/strict';import {neighbourhoodHighlights} from '../simulation/highlights.js';
test('destaca relaciones dirigidas reales, ignora datos vacíos y resuelve empates de forma estable',()=>{
 const world={people:[{id:'a',name:'Ana',relationships:{b:{friendship:4,tension:0},c:{friendship:2,tension:9},missing:{friendship:99}}},{id:'b',name:'Beto',relationships:{a:{friendship:6,tension:0}}},{id:'c',name:'Cris',relationships:{}}]};
 const stats=neighbourhoodHighlights(world);assert.equal(stats.friendship.from,'Beto');assert.equal(stats.friendship.to,'Ana');assert.equal(stats.tension.from,'Ana');assert.equal(stats.tension.to,'Cris');
 assert.deepEqual(neighbourhoodHighlights({people:[]}),{friendship:null,tension:null,friendshipRanking:[],tensionRanking:[],chatter:null});
});
test('cuenta charlas terminadas del historial sin duplicar participantes',()=>{
 const world={people:[{id:'a',name:'Ana'},{id:'b',name:'Beto'}],events:[{type:'conversation_finished',participants:['a','b','a']},{type:'conversation_started',participants:['b']},{type:'conversation_finished',participants:['b','a']}]};
 const result=neighbourhoodHighlights(world);assert.deepEqual(result.chatter,{name:'Ana',count:2});
});
