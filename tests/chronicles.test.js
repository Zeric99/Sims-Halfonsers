import test from 'node:test';
import assert from 'node:assert/strict';
import {collectChronicle,chronicleEpisodes,visitHighlights} from '../simulation/chronicles.js';
import {qaScenario} from '../simulation/qa-scenarios.js';
import {createWorld} from '../simulation/world.js';

const DAY=86400000;

test('el conflicto dura tres fechas y al volver solo destaca el acuerdo cumplido',()=>{
 const {world,serverTime}=qaScenario('chronicle');
 const episodes=chronicleEpisodes(world),story=episodes.find(e=>e.kind==='conflict');
 assert.deepEqual(story.chapters.map(c=>c.tag),['Inicio','Giro','Desenlace']);
 assert.equal(story.chapters.at(-1).at-story.chapters[0].at,2*DAY);
 assert.equal(story.open,false);
 assert.deepEqual(visitHighlights(episodes,world.qaPreviousVisit).map(item=>item.chapter.id),[story.chapters.at(-1).id]);
 assert.deepEqual(visitHighlights(episodes,world.eventSequence),[]);
 world.events=[];
 collectChronicle(world,serverTime+10*DAY);
 assert.deepEqual(chronicleEpisodes(world),episodes);
 collectChronicle(world,serverTime+22*DAY);
 assert.equal(chronicleEpisodes(world).length,0);
});

test('una segunda quedada enlaza con el plantón sin mezclar a otros vecinos',()=>{
 const at=Date.UTC(2026,0,1,12),world=createWorld({now:at});
 const [a,b,c]=world.people.map(p=>p.id);
 const add=(type,planId,offset,participants=[a,b])=>world.events.push({id:'casa:'+ ++world.eventSequence,type,at:at+offset*DAY,participants,activity:'anime',planId,absentId:b});
 add('plan_accepted','plan-a',0);add('plan_missed','plan-a',.1);
 add('plan_accepted','plan-b',1,[a,c]);add('plan_completed','plan-b',1.1,[a,c]);
 add('plan_accepted','plan-c',2,[b,a]);add('plan_completed','plan-c',2.1,[b,a]);
 const episodes=chronicleEpisodes(world);
 assert.equal(episodes.length,2);
 assert.match(episodes[0].title,/segunda oportunidad/);
 assert.deepEqual(episodes[0].chapters.map(ch=>ch.tag),['Inicio','Giro','Giro','Desenlace']);
 assert.equal(episodes[0].open,false);
});

test('un conflicto de la cena conserva su historia hasta el acuerdo y un nuevo incidente abre otra',()=>{
 const at=Date.UTC(2026,0,1,12),world=createWorld({now:at});
 const participants=world.people.slice(0,3).map(p=>p.id),[a,b]=participants;
 const add=(type,offset,extra)=>world.events.push({id:'casa:'+ ++world.eventSequence,type,at:at+offset*DAY,participants:[a,b],conflictId:'dishes',...extra});
 add('group_invited',0,{participants,groupId:'g',groupKind:'dinner',hostId:a});
 add('group_finished',.1,{participants,groupId:'g',groupKind:'dinner',affectedId:a,otherId:b,outcome:'cleanup_dispute'});
 add('conflict_incident',.1,{cause:'dejar los platos'});
 add('agreement_fulfilled',1,{request:'recoger los platos'});
 add('conflict_incident',3,{cause:'dejar los platos'});
 const [newStory,dinner]=chronicleEpisodes(world);
 assert.equal(newStory.kind,'conflict');
 assert.equal(dinner.kind,'group');
 assert.equal(dinner.open,false);
 assert.equal(dinner.chapters.at(-1).tag,'Desenlace');
});
