import {goalLabel} from './goals.js';
import {describeMemory,relevantMemories} from './memory.js';
import {activities} from './plans.js';
import {describeStory} from './stories.js';
import {relationshipLabel} from './relationships.js';
import { executionState } from './execution.js';
import { mealStage } from './meal-stage.js';
import {groupKinds} from './group-events.js';
// Información derivada únicamente del último estado compartido.
export function describeResident(world,name,now){
 const p=world.people.find(x=>x.name===name);if(!p)return null;
 const a=p.action,names=new Map(world.people.map(x=>[x.id,x.name]));
 const arrive=a?a.start+(a.travelMs||0):0,travel=a&&now<arrive;
 let current=a?.label||'Sin actividad en curso',next='Todavía no ha decidido qué hará después.';
 const stage=mealStage(a,now),mealLabels={to_fridge:['Yendo a la nevera','Coger los ingredientes.'],fridge:['Cogiendo ingredientes','Ir a los fogones.'],to_stove:['Yendo a los fogones','Preparar la comida.'],cooking:['Preparando la comida','Ir a la mesa.'],to_table:['Llevando la comida a la mesa','Sentarse a comer.'],eating:['Comiendo en la mesa','Todavía no ha decidido qué hará después.']};
 if(a?.id==='usar_bano'&&travel){
  current=a.bathroomRush?'Corriendo al baño':'Yendo al baño';
  next='Sentarse en el váter.';
 }
 else if(stage&&mealLabels[stage.kind]){[current,next]=mealLabels[stage.kind];if(a.meal.recipeName&&['cooking','eating'].includes(stage.kind))current+=(stage.kind==='cooking'?': ':': ')+a.meal.recipeName}
 else if(travel){current='Yendo a: '+(a.label||a.id);next=a.id==='comer'&&a.meal?'Al llegar: preparar la comida.':'Al llegar: '+(a.label||a.id)+'.'}
 else if(a?.id==='comer'&&a.meal&&now<arrive+a.meal.prepareMs){current='Preparando la comida';next='Comer cuando termine de prepararla.'}
 const labels={esperar:'esperó un camino libre',practicar:'disfrutó de su afición',ver_tv:'vio la tele',pasear:'dio un paseo',dormir:'durmió',comer:'comió',usar_bano:'usó el baño',asearse:'se aseó',jugar:'jugó al ordenador',estudiar:'estudió',limpiar:'limpió la cocina',descansar:'descansó',leer:'leyó',charlar:'charló',fumar:'fumó'};
 const history=(world.events||[]).filter(e=>e.personId===p.id&&['action_finished','activity_interrupted'].includes(e.type)).slice(-5).reverse().map(e=>({at:e.at,text:(labels[e.action]||e.action||'hizo una actividad')+(e.type==='activity_interrupted'?' (interrumpido)':'')}));
 const tensions=Object.entries(p.relationships||{}).filter(([,r])=>(r.tension??0)>=20).sort((a,b)=>b[1].tension-a[1].tension).map(([id,r])=>({name:names.get(id)||'Otro vecino',tension:Math.round(r.tension)}));
 const conflicts=Object.values(world.conflicts||{}).filter(c=>c.state!=='resolved'&&c.participants?.includes(p.id)).map(c=>({name:names.get(c.participants.find(id=>id!==p.id))||'Otro vecino',cause:c.cause||'convivencia',state:c.state,request:c.request}));
 const commitments=Object.values(world.plans??{}).filter(plan=>plan.participants.includes(p.id)
  &&['scheduled','travelling','active'].includes(plan.status)).map(plan=>({
   label:activities[plan.kind]?.label,other:names.get(plan.participants.find(id=>id!==p.id)),
   at:plan.scheduledAt,status:plan.status
  }));
 if(commitments.length&&next.startsWith('Todavía')){
  next=commitments[0].label+' con '+commitments[0].other+'.';
  if(commitments[0].status==='active')next='Terminar el plan con '+commitments[0].other+'.';
 }
 const group=Object.values(world.groupEvents??{}).find(g=>g.attending.includes(p.id)&&['scheduled','travelling','active'].includes(g.status));
 if(group&&(a?.groupId===group.id||next.startsWith('Todavía')))next=group.status==='active'?'Seguir en el encuentro del jardín.':'Ir al jardín: '+groupKinds[group.kind].title+'.';
 const relationships=Object.entries(p.relationships??{}).map(([id,r])=>({
  name:names.get(id)||'Otro vecino',status:relationshipLabel(r),friendship:Math.round(r.friendship??0),
  trust:Math.round(r.trust??20),tension:Math.round(r.tension??0)
 })).sort((a,b)=>Math.abs(b.friendship)+b.tension-Math.abs(a.friendship)-a.tension);
 const couple=Object.values(world.romance?.couples??{}).find(c=>c.status==='together'&&c.participants.includes(p.id));
 const relationship=couple?names.get(couple.participants.find(id=>id!==p.id)):null;
 const socialHistory=(world.events??[]).filter(e=>e.participants?.includes(p.id)&&describeStory(e,names))
  .slice(-5).reverse().map(e=>({at:e.at,text:describeStory(e,names)}));
 const memories=relevantMemories(p,now,{limit:4}).map(({memory})=>({
  text:describeMemory(memory,names),emotion:memory.emotion
 }));
 const goal=p.goal?{...p.goal,label:goalLabel(p.goal,names)}:null;
 const reflection=p.reflection?{
  at:p.reflection.at,positive:p.reflection.positive?describeMemory(p.reflection.positive,names):null,
  concern:p.reflection.concern
 }:null;
 return {memories,goal,reflection,skills:p.learned?.skills??{},commitments,relationships,relationship,socialHistory,name:p.name,home:p.homeId,mood:p.mood?.label||'sin datos',needs:p.needs,current,next,history,tensions,conflicts,execution:executionState(a,now)};
}
