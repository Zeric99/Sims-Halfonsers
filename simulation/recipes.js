export const RECIPES=Object.freeze([
 {id:'tortilla',name:'tortilla',prepareMinutes:6,nutrition:55},
 {id:'pasta',name:'pasta con verduras',prepareMinutes:10,nutrition:65},
 {id:'arroz',name:'arroz salteado',prepareMinutes:8,nutrition:60}
]);
export function recipeFor(person,eventSequence,preferred){
 const recipe=RECIPES.find(entry=>entry.id===preferred);
 if(recipe)return recipe;
 const index=Number(person.id.replace(/\D/g,''))||0;
 return RECIPES[(index+eventSequence)%RECIPES.length];
}
