import {proposePlan,activities} from './plans.js';
import {createWorld,advanceWorld} from './world.js';
// Solo lo sirve dev-server; nunca escribe en el mundo del usuario.
export function qaScenario(kind='meal',phase='eating',personIndex=0){
 if(kind==='evolution'){
  const {world}=qaScenario('social','result');
  const at=Date.UTC(2026,0,2,7,1);
  advanceWorld(world,at,{maxMinutes:1440});
  return {world,serverTime:at,clockRate:1,mode:'escenario_local'};
 }
 const start=Date.UTC(2026,0,1,12),world=createWorld({seed:42,now:start});
 for(const p of world.people){p.needs={saciedad:100,energia:100,higiene:100,compania:100,diversion:100,bano:100};p.action={id:'esperar',label:'prueba de postura',start,until:start+86400000,resource:null,travelMs:0,route:[]}}
 if(kind==='social'){
  const [host,guest]=world.people;
  host.position={x:-14.5,z:-9.5};
  guest.position={x:-11,z:-9.5};
  host.action.route=[host.position];
  guest.action.route=[guest.position];
  world.nextPlanCheck=start+86400000;
  const activity=Object.hasOwn(activities,phase)?phase:'anime';
  const plan=proposePlan(world,host,guest,activity,start,()=>0);
  let at=start;
  while(plan.status!=='active'&&at<start+3*3600000){
   at+=60000;
   advanceWorld(world,at);
  }
  if(plan.status==='active'&&['stack','fade'].includes(phase)){
   at=host.action.until-(phase==='fade'?10000:2*60000);
   advanceWorld(world,at);
  }
  if(plan.status==='active'&&phase==='result'){
   at=host.action.until+60000;
   advanceWorld(world,at);
  }
  return {world,serverTime:at,clockRate:1,mode:'escenario_local'};
 }
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
