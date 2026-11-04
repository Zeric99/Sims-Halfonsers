// Ánimo temporal derivado del estado actual; no modifica la personalidad base.
export function moodFrom(person){
 const n=person.needs,values=['saciedad','energia','higiene','compania','diversion','bano'].map(k=>n[k]??75);
 const base=values.reduce((a,b)=>a+b,0)/values.length;
 const tensions=Object.values(person.relationships??{}).map(r=>r.tension??0);
 const recentTension=tensions.length?Math.max(...tensions):0;
 const score=Math.max(0,Math.min(100,Math.round(base-recentTension*.15)));
 return {score,label:score<30?'agotado':score<50?'incómodo':score<75?'tranquilo':'a gusto'};
}
