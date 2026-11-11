import {relevantMemories} from './memory.js';
import {RECIPES,recipeFor} from './recipes.js';

const HOUR=3600000;
const DAY=24*HOUR;
const personalActivities={estudiar:'estudiar dos veces',jugar:'jugar dos partidas',practicar:'practicar mi afición dos veces',limpiar:'dejar la cocina recogida'};
const planActivities={cooking:'cocinar',games:'jugar',anime:'ver anime',gym:'entrenar'};

export function activeGoal(person,at){
 const goal=person.goal;
 return goal?.status==='active'&&at<goal.expiresAt?goal:null;
}

function chooseGoal(world,person,at){
 const conflict=Object.values(world.conflicts??{}).filter(c=>c.state!=='resolved'&&c.participants.includes(person.id))
  .sort((a,b)=>b.severity-a.severity||b.lastIncidentAt-a.lastIncidentAt)[0];
 if(conflict&&at-conflict.lastIncidentAt<2*DAY){
  return {kind:'repair',conflictId:conflict.id,with:conflict.participants.find(id=>id!==person.id),target:1,priority:.17};
 }
 const shared=relevantMemories(person,at).find(({memory})=>memory.kind==='plan_completed'&&memory.valence>0)?.memory;
 if(shared&&world.people.some(p=>p.id===shared.with)){
  return {kind:'plan',activity:shared.activity,with:shared.with,target:1,priority:.15};
 }
 const {interests,traits}=person.profile;
 if(interests.includes('estudio'))return {kind:'practice',activity:'estudiar',target:2,priority:.13};
 if((world.households[person.homeId]?.mess??0)>=35&&traits.orden>=.55){
  return {kind:'practice',activity:'limpiar',target:1,priority:.12};
 }
 const choice=(Math.floor(at/DAY)+(Number(person.id.replace(/\D/g,''))||0))%3;
 if(choice===0)return {kind:'recipe',recipe:recipeFor(person,Math.floor(at/DAY)).id,target:2,priority:.09};
 return {kind:'practice',activity:interests.includes('ordenador')&&choice===1?'jugar':'practicar',target:2,priority:.11};
}

export function reflectAtNight(world,from,to){
 const day=Math.floor((to-23*HOUR)/DAY);
 if(day===Math.floor((from-23*HOUR)/DAY)||world.lastReflectionDay===day)return;
 const at=day*DAY+23*HOUR;
 world.lastReflectionDay=day;
 for(const person of world.people){
  const memories=relevantMemories(person,at).map(({memory})=>memory);
  const positive=memories.find(m=>m.valence>0);
  const open=Object.values(world.conflicts??{}).find(c=>c.state!=='resolved'&&c.participants.includes(person.id));
  if(!activeGoal(person,at)){
   person.goal={...chooseGoal(world,person,at),id:person.id+':goal:'+day,
    progress:0,status:'active',createdAt:at,expiresAt:at+2*DAY};
  }
  person.reflection={at,positive:positive?{...positive}:null,concern:open?.cause??null,goalId:person.goal.id};
 }
}

export function expireGoals(world,at){
 for(const person of world.people){
  const goal=person.goal;
  if(goal?.status!=='active')continue;
  if(at>=goal.expiresAt)goal.status='expired';
  else if((goal.with&&!world.people.some(p=>p.id===goal.with))
   ||(goal.kind==='repair'&&!world.conflicts?.[goal.conflictId]))goal.status='cancelled';
 }
}

export function goalBonus(person,activity,at){
 const goal=activeGoal(person,at);
 if(goal?.kind==='recipe'&&activity==='comer')return goal.priority;
 return goal?.kind==='practice'&&goal.activity===activity?goal.priority:0;
}

export function advanceGoal(person,kind,details,at){
 const goal=activeGoal(person,at);
 if(goal?.kind!==kind)return;
 if(kind==='practice'&&goal.activity!==details.activity)return;
 if(kind==='recipe'&&goal.recipe!==details.recipe)return;
 if(kind==='plan'&&(goal.activity!==details.activity||goal.with!==details.with))return;
 if(kind==='repair'&&goal.conflictId!==details.conflictId)return;
 goal.progress++;
 if(goal.progress>=goal.target){
  goal.status='completed';
  goal.completedAt=at;
 }
}

export function goalLabel(goal,names){
 if(!goal)return null;
 if(goal.kind==='repair')return 'Resolver el desacuerdo con '+(names.get(goal.with)??'un vecino');
 if(goal.kind==='plan')return 'Volver a '+(planActivities[goal.activity]??'quedar')+' con '+(names.get(goal.with)??'un vecino');
 if(goal.kind==='recipe')return 'Practicar la receta de '+(RECIPES.find(recipe=>recipe.id===goal.recipe)?.name??goal.recipe)+' dos veces';
 return personalActivities[goal.activity]??goal.activity;
}
