import test from 'node:test';
import assert from 'node:assert/strict';
import { separatePeople } from '../simulation/separation.js';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
test('separa vecinos coincidentes de forma determinista sin alterar los originales',()=>{
 const input=[{x:0,z:0},{x:0,z:0},{x:0,z:0}];
 const result=separatePeople(input,()=>true);
 assert.deepEqual(result,separatePeople(input,()=>true));
 assert.deepEqual(input,[{x:0,z:0},{x:0,z:0},{x:0,z:0}]);
 for(let i=0;i<result.length;i++)for(let j=i+1;j<result.length;j++)assert.ok(distance(result[i],result[j])>=.848);
});
test('quien duerme permanece en su cama mientras el otro se aparta',()=>{
 const result=separatePeople([{x:0,z:0,fixed:true},{x:0,z:0}],()=>true);
 assert.equal(result[0].x,0);assert.equal(result[0].z,0);assert.ok(distance(...result)>=.85);
});
test('no desplaza a través de una pared y sigue buscando espacio',()=>{
 const free=(x,z)=>x>=0&&z>=0;
 const result=separatePeople([{x:.1,z:.1},{x:.1,z:.1}],free);
 assert.ok(result.every(p=>free(p.x,p.z)));assert.ok(distance(...result)>=.84);
});
