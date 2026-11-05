// Fases serializables para que todos los visitantes vean el mismo recorrido.
export function mealStage(action,at){
 const stages=action?.meal?.stages;
 if(!Array.isArray(stages)||!stages.length)return null;
 return stages.find(s=>at<s.end)||stages.at(-1);
}
export function mealPosition(action,at){
 const stage=mealStage(action,at);if(!stage)return null;
 const route=stage.route;if(!route?.length)return null;
 if(route.length===1||stage.end<=stage.start)return {...route.at(-1),walking:false};
 const distances=route.slice(1).map((p,i)=>Math.hypot(p.x-route[i].x,p.z-route[i].z));
 const total=distances.reduce((a,b)=>a+b,0);let left=total*Math.max(0,Math.min(1,(at-stage.start)/(stage.end-stage.start)));
 for(let i=0;i<distances.length;i++){const d=distances[i];if(d&&left<=d){const a=route[i],b=route[i+1],q=left/d;return {x:a.x+(b.x-a.x)*q,z:a.z+(b.z-a.z)*q,angle:Math.atan2(b.x-a.x,b.z-a.z),walking:at<stage.end}}left-=d}
 return {...route.at(-1),walking:false};
}
