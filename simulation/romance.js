// Romance optativo para personajes ficticios: desactivado en todos los perfiles provisionales.
const DAY=86400000;
function log(world,type,at,extra){world.events.push({id:world.worldId+':'+(++world.eventSequence),type,at,...extra});if(world.events.length>500)world.events.shift()}
const pairKey=(a,b)=>[a.id,b.id].sort().join(':');
export function proposeRelationship(world,a,b,at){
 if(a.id===b.id||!a.profile.romanceEnabled||!b.profile.romanceEnabled)return null;
 if(a.homeId!==b.homeId||!a.position||!b.position||Math.hypot(a.position.x-b.position.x,a.position.z-b.position.z)>3)return null;
 const ar=a.relationships?.[b.id],br=b.relationships?.[a.id];
 if(!ar||!br||ar.romanticInterest<60||br.familiarity<20)return null;
 world.romance ??={offers:{},couples:{},cooldowns:{}};
 const key=pairKey(a,b);if(world.romance.couples[key]?.status==='together'||(world.romance.cooldowns[key]??0)>at)return null;
 if(Object.values(world.romance.offers).some(o=>o.key===key&&o.status==='pending'))return null;
 const id=world.worldId+':proposal:'+(++world.eventSequence);
 const offer={id,key,from:a.id,to:b.id,at,status:'pending'};world.romance.offers[id]=offer;
 log(world,'romance_proposed',at,{offerId:id,participants:[a.id,b.id]});return offer;
}
export function respondToProposal(world,id,responderId,accept,at){
 const offer=world.romance?.offers?.[id];if(!offer||offer.status!=='pending'||offer.to!==responderId||typeof accept!=='boolean'||at<offer.at)return false;
 const a=world.people.find(p=>p.id===offer.from),b=world.people.find(p=>p.id===offer.to);
 if(!a||!b||!a.profile.romanceEnabled||!b.profile.romanceEnabled)return false;
 // El motor no permite una aceptación sin interés recíproco.
 if(accept&&(b.relationships?.[a.id]?.romanticInterest??0)<60)return false;
 offer.status=accept?'accepted':'rejected';offer.respondedAt=at;
 if(accept)world.romance.couples[offer.key]={participants:[a.id,b.id],status:'together',since:at};
 else world.romance.cooldowns[offer.key]=at+DAY;
 log(world,accept?'romance_accepted':'romance_rejected',at,{offerId:id,participants:[a.id,b.id]});return true;
}
