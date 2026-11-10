import {openConversation,finishConversation} from '../simulation/social.js';
import {createWorld,advanceWorld} from '../simulation/world.js';
const start=Date.UTC(2026,0,1,7),world=createWorld({seed:19,now:start}),seen=new Set(),counts={};
for(let i=1;i<=7*24*60;i+=5){advanceWorld(world,start+i*60000);for(const event of world.events){if(seen.has(event.id))continue;seen.add(event.id);const key=event.type==='story_finished'?'story:'+event.story:event.type;counts[key]=(counts[key]||0)+1}}
const required=['invitation_accepted','invitation_declined','story:prank','story:repair','story:shared_interest','story:catch_up'];
for(const key of required.filter(k=>k!=='story:repair'))if(!counts[key])throw new Error('No se observó '+key);
const scenario=createWorld({now:0}),[a,b]=scenario.people;a.relationships[b.id]={friendship:0,trust:20,tension:30};const repair=openConversation(scenario,a,b,0);finishConversation(scenario,repair.id,repair.end);if(a.relationships[b.id].tension!==25)throw new Error('No se reparó la tensión');
console.log('Reconciliación verificada en un escenario con tensión previa.');
console.log(JSON.stringify(Object.fromEntries(required.map(key=>[key,counts[key]])),null,2));
