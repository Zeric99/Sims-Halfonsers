// El aprendizaje cambia al terminar una experiencia o al observar un incidente.
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

function updatePreference(values,key,reward){
 const previous=Object.hasOwn(values,key)?values[key]:0;
 values[key]=clamp(previous*.95+clamp(reward,-1,1)*.05,-1,1);
}

export function recordExperience(person,{activity,skill,minutes,reward,context,recipe}){
 if(!activity||!Number.isFinite(minutes)||minutes<0||!Number.isFinite(reward))throw new TypeError('Experiencia inválida');
 const learned=person.learned??={};
 const preferences=learned.preferences??={};
 updatePreference(preferences,activity,reward);
 if(context){
  const contexts=learned.contexts??={};
  updatePreference(contexts,context,reward);
 }
 if(skill&&minutes>0){
  const skills=learned.skills??={};
  const previous=skills[skill]??0;
  const practice=Math.min(minutes,120)/60;
  skills[skill]=clamp(previous+practice*.5*(1-previous/100),0,100);
 }
 if(recipe&&minutes>0){
  const recipes=learned.recipes??={};
  recipes[recipe]=Math.min(100,(recipes[recipe]??0)+1);
 }
 return learned;
}

export function recordNoiseFeedback(person,context){
 const learned=person.learned??={};
 const contexts=learned.contexts??={};
 updatePreference(contexts,context,-1);
}

export function tvContext(person,world,at){
 const hour=new Date(at).getUTCHours();
 if(hour>=23||hour<7)return 'tele:noche';
 if(world.people.some(p=>p.homeId===person.homeId&&p.action?.id==='estudiar'))return 'tele:estudio';
 return 'tele:dia';
}

export function learnedQuiet(person,world,at){
 return (person.learned?.contexts?.[tvContext(person,world,at)]??0)<=-.12;
}

export function planPreference(person,kind,otherId){
 const learned=person.learned;
 const reward=(learned?.preferences?.['plan:'+kind]??0)*.06
  +(learned?.contexts?.['plan:'+kind+':'+otherId]??0)*.12;
 return clamp(reward,-.14,.14);
}

export function preferenceBonus(person,activity){
 return clamp((person.learned?.preferences?.[activity]??0)*.08,-.08,.08);
}

export function cookMinutes(person,recipe){
 const repeats=person.learned?.recipes?.[recipe.id]??0;
 const skill=person.learned?.skills?.cocina??0;
 const saved=Math.min(recipe.prepareMinutes*.35,repeats*.35+skill*.02);
 return recipe.prepareMinutes-saved;
}
