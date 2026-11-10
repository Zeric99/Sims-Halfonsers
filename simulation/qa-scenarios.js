import {createWorld,advanceWorld} from './world.js';
// Solo lo sirve dev-server; nunca escribe en el mundo del usuario.
export function qaScenario(kind='meal',phase='eating',personIndex=0){
 const start=Date.UTC(2026,0,1,12),world=createWorld({seed:42,now:start});
 for(const p of world.people){p.needs={saciedad:100,energia:100,higiene:100,compania:100,diversion:100,bano:100};p.action={id:'esperar',label:'prueba de postura',start,until:start+86400000,resource:null,travelMs:0,route:[]}}
 const p=world.people[personIndex];p.action=null;
 if(kind==='meal')p.needs.saciedad=0;
 else if(kind==='sleep')p.needs.energia=0;
 else if(kind==='bath')p.needs.bano=0;
 else if(kind==='wash')p.needs.higiene=0;
 else if(kind==='desk'){p.profile.interests=['estudio'];p.needs.diversion=0}
 else if(kind==='computer'){p.profile.interests=['ordenador'];p.needs.diversion=0}
 else if(kind==='sofa')p.needs.energia=40;
 else if(kind==='clean'){world.households[p.homeId].mess=100;p.profile.traits.orden=1}
 advanceWorld(world,start+60000);
 let at=p.action.start+(p.action.travelMs||0)+180000;
 if(kind==='meal'){const stage=p.action.meal.stages.find(s=>s.kind===phase)||p.action.meal.stages.at(-1);at=stage.start+(stage.end-stage.start)/2}
 return {world,serverTime:at,clockRate:1,mode:'escenario_local'};
}
