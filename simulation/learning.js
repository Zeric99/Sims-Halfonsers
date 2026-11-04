// Aprendizaje acotado: se actualiza al completar una experiencia, no por frame.
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export function recordExperience(person,{activity,skill,minutes,reward}){
 if(!activity||!Number.isFinite(minutes)||minutes<0||!Number.isFinite(reward))throw new TypeError('Experiencia inválida');
 person.learned ??={};person.learned.skills ??={};person.learned.preferences ??={};
 const observed=clamp(reward,-1,1),old=person.learned.preferences[activity]??0;
 person.learned.preferences[activity]=clamp(old*.95+observed*.05,-1,1);
 if(skill){const current=person.learned.skills[skill]??0;
  person.learned.skills[skill]=clamp(current+(Math.min(minutes,120)/60)*.5*(1-current/150),0,100)}
 return person.learned;
}
export function preferenceBonus(person,activity){return clamp((person.learned?.preferences?.[activity]??0)*.08,-.08,.08)}
