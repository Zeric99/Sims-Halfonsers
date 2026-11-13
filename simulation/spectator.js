import {activities} from './plans.js';
import {mealStage} from './meal-stage.js';
import {cookingStage} from './scene-performance.js';
import {groupBeat,groupKinds} from './group-events.js';

const routines={
 comer:{title:'Hora de comer',score:15},
 fumar:{title:'Un rato en el jardín',score:6},
 limpiar:{title:'Turno de limpieza',score:9},
 estudiar:{title:'Un rato de estudio',score:5}
};
const meals={
 to_fridge:'Va a por los ingredientes.',fridge:'Está sacando los ingredientes.',
 to_stove:'Lleva los ingredientes a los fogones.',cooking:'Está preparando la comida.',
 to_table:'Lleva el plato a la mesa.',eating:'Se ha sentado a comer.'
};

export function spectatorScenes(world,now){
 if(!world)return [];
 const residents=new Map(world.people.map(person=>[person.id,person]));
 const namesFor=ids=>ids.map(id=>residents.get(id)?.name).filter(Boolean);
 const scenes=[];
 const active=action=>action&&action.start<=now&&action.until>now;
 for(const event of Object.values(world.groupEvents??{})){
  if(!['travelling','active'].includes(event.status))continue;
  const names=namesFor(event.attending.filter(id=>residents.get(id)?.action?.groupId===event.id));
  if(names.length<3)continue;
  const beat=groupBeat(event,now);
  if(event.status==='active'&&!beat)continue;
  scenes.push({id:event.id,title:groupKinds[event.kind].title,names,storyKey:'group:'+event.id,
   context:(beat?.label??'De camino al jardín')+' · '+names.join(', '),
   start:event.start??event.scheduledAt,score:beat?115:62,kind:'encuentro'});
 }
 for(const conversation of Object.values(world.conversations??{})){
  if(conversation.finished||conversation.cancelled||now<conversation.start||now>=conversation.end)continue;
  const ids=conversation.participants;
  const names=namesFor(ids);
  if(names.length!==2||!ids.every(id=>{
   const action=residents.get(id)?.action;
   return active(action)&&action.conversationId===conversation.id;
  }))continue;
  const pair=names.join(' y ');
  const plan=world.plans?.[conversation.planId];
  const conflict=world.conflicts?.[conversation.conflictId];
  const missed=(world.events??[]).findLast(event=>event.type==='plan_missed'
   &&event.at<conversation.start&&conversation.start-event.at<=86400000
   &&event.participants?.length===ids.length&&ids.every(id=>event.participants.includes(id)));
  const secondChance=plan&&missed;
  let title='Charla entre vecinos';
  let context=pair+' hablan sobre '+(conversation.topic??'el día')+'.';
  let score=30;
  if(plan){
   title=plan.kind==='cooking'?'En la cocina':activities[plan.kind]?.label??'Plan compartido';
   context=secondChance
    ?pair+' vuelven a quedar después de un plantón. Esta vez han llegado los dos.'
    :pair+' han llegado y empiezan a '+(activities[plan.kind]?.label??'pasar un rato juntos')+'.';
   if(plan.kind==='cooking'&&!secondChance){
    const stage=cookingStage(conversation,residents.get(ids[0]).action,null,now);
    context={prep:pair+' preparan los ingredientes.',cook:names[0]+' está con la sartén y '+names[1]+' sigue preparando la guarnición.',serve:pair+' sirven la comida.'}[stage]??context;
   }
   score=secondChance?85:plan.kind==='cooking'?70:55;
  }else if(conversation.story==='repair'){
   title='Hablando para arreglarlo';
   context=conflict?pair+' hablan de su desacuerdo por '+conflict.cause+'.'
    :pair+' intentan rebajar la tensión entre ellos.';
   score=90;
  }else if(conversation.story==='prank'){
   title='Una broma entre vecinos';
   context=names[0]+' le gasta una broma a '+names[1]+'.';
   score=75;
  }
  scenes.push({id:plan?.id??conversation.id,title,context,names,score,start:conversation.start,kind:'encuentro',
   storyKey:plan?'plan:'+plan.id:conflict?'conflict:'+conflict.id:null});
 }

 for(const plan of Object.values(world.plans??{})){
  if(plan.status!=='travelling')continue;
  const names=namesFor(plan.participants);
  if(names.length!==2||!plan.participants.every(id=>{
   const action=residents.get(id)?.action;
   return active(action)&&action.planId===plan.id;
  }))continue;
  const activity=activities[plan.kind]?.label??'pasar un rato juntos';
  scenes.push({id:plan.id,title:'De camino al encuentro',context:names.join(' y ')+' van a '+activity+'.',storyKey:'plan:'+plan.id,
   names,score:40,start:plan.scheduledAt,kind:'encuentro'});
 }

 for(const person of world.people){
  const action=person.action;
  if(!active(action)||!Object.hasOwn(routines,action.id))continue;
  const {title,score}=routines[action.id];
  const stage=mealStage(action,now);
  const detail=stage?meals[stage.kind]:null;
  scenes.push({id:person.id+':'+action.start+':'+action.id,title,
   context:detail?person.name+' · '+detail:person.name+' está '+action.label+'.',
   names:[person.name],score,start:action.start,kind:'rutina'});
 }
 scenes.sort((a,b)=>b.score-a.score||b.start-a.start||a.id.localeCompare(b.id));
 return scenes;
}

export function spectatorScene(world,now,previous,selected){
 const scenes=spectatorScenes(world,now);
 const requested=scenes.find(scene=>scene.id===selected?.id);
 if(requested)return requested;
 const held=scenes.find(scene=>scene.id===previous?.id);
 if(held?.kind==='encuentro')return held;
 return held&&scenes[0]?.kind!=='encuentro'?held:scenes[0]??null;
}
