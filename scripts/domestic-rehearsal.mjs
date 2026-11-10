import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createWorld,advanceWorld} from '../simulation/world.js';
const reports=[];
for(const seed of [19,42,73184]){
 const start=Date.UTC(2026,0,1,7),world=createWorld({seed,now:start}),seen=new Set(),counts={},critical={saciedad:0,energia:0,bano:0};let samples=0;
 for(let minute=15;minute<=10080;minute+=15){
  advanceWorld(world,start+minute*60000);
  const resources=world.people.map(p=>p.action?.resource).filter(Boolean);assert.equal(new Set(resources).size,resources.length);
  for(const p of world.people){samples++;for(const [need,value] of Object.entries(p.needs)){assert.ok(Number.isFinite(value)&&value>=0&&value<=100);if(need in critical&&value<10)critical[need]++}}
  for(const e of world.events){if(seen.has(e.id))continue;seen.add(e.id);if(e.type==='action_started')counts[e.action]=(counts[e.action]||0)+1}
 }
 const fractions=Object.fromEntries(Object.entries(critical).map(([k,v])=>[k,+(v/samples).toFixed(4)]));
 assert.ok(fractions.saciedad<.05,'Hambre crítica sostenida');assert.ok(fractions.energia<.05,'Sueño crítico sostenido');assert.ok(fractions.bano<.05,'Baño crítico sostenido');
 for(const activity of ['comer','dormir','usar_bano','asearse','limpiar','jugar','estudiar'])assert.ok(counts[activity]>0,activity+' ausente');
 const restored=JSON.parse(JSON.stringify(world)),copy=structuredClone(world);
 advanceWorld(copy,copy.lastSimulatedAt+3600000);advanceWorld(restored,restored.lastSimulatedAt+3600000);assert.deepEqual(copy,restored);
 reports.push({seed,days:7,samples,criticalFractions:fractions,activities:counts,restoredDeterministically:true});
}
await mkdir('.local-data',{recursive:true});await writeFile('.local-data/domestic-report.json',JSON.stringify(reports,null,2));console.log(JSON.stringify(reports,null,2));
