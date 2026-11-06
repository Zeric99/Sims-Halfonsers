// Estadísticas lúdicas calculadas a partir de relaciones dirigidas existentes.
export function neighbourhoodHighlights(world){
 const people=world.people||[],names=new Map(people.map(p=>[p.id,p.name])),rows=[];
 for(const person of people)for(const [otherId,relation] of Object.entries(person.relationships||{})){
  if(otherId===person.id||!names.has(otherId)||!relation)continue;
  rows.push({from:person.name,to:names.get(otherId),friendship:relation.friendship,tension:relation.tension});
 }
 const ranking=key=>rows.filter(r=>Number.isFinite(r[key])&&r[key]>0).sort((a,b)=>b[key]-a[key]||a.from.localeCompare(b.from,'es')||a.to.localeCompare(b.to,'es')).slice(0,3);
 const friendshipRanking=ranking('friendship'),tensionRanking=ranking('tension'),counts=new Map();
 for(const event of world.events||[]){
  if(event.type!=='conversation_finished')continue;
  for(const id of new Set(event.participants||[]))if(names.has(id))counts.set(id,(counts.get(id)||0)+1);
 }
 const chatter=[...counts].map(([id,count])=>({name:names.get(id),count})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'es'))[0]||null;
 return {friendship:friendshipRanking[0]||null,tension:tensionRanking[0]||null,friendshipRanking,tensionRanking,chatter};
}
