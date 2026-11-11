// Romance optativo para personajes ficticios: desactivado en todos los perfiles provisionales.
const DAY=86400000;
function log(world,type,at,extra){world.events.push({id:world.worldId+':'+(++world.eventSequence),type,at,...extra});if(world.events.length>500)world.events.shift()}
const pairKey=(a,b)=>[a.id,b.id].sort().join(':');
export function proposeRelationship(world,a,b,at){
 if(a.id===b.id||!a.profile.romanceEnabled||!b.profile.romanceEnabled)return null;
 if(!a.profile.romancePartners?.includes(b.id)||!b.profile.romancePartners?.includes(a.id))return null;
 if(!a.position||!b.position||Math.hypot(a.position.x-b.position.x,a.position.z-b.position.z)>3)return null;
 if(!Number.isFinite(at))return null;
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
 if(!a||!b||!a.profile.romanceEnabled||!b.profile.romanceEnabled
   ||!a.profile.romancePartners?.includes(b.id)||!b.profile.romancePartners?.includes(a.id))return false;
 // El motor no permite una aceptación sin interés recíproco.
 if(accept&&(b.relationships?.[a.id]?.romanticInterest??0)<60)return false;
 offer.status=accept?'accepted':'rejected';offer.respondedAt=at;
 if(accept)world.romance.couples[offer.key]={participants:[a.id,b.id],status:'together',since:at};
 else world.romance.cooldowns[offer.key]=at+DAY;
 log(world,accept?'romance_accepted':'romance_rejected',at,{offerId:id,participants:[a.id,b.id]});return true;
}

export function endRelationship(world,a,b,at,reason){
 const pair=world.romance?.couples?.[pairKey(a,b)];
 if(!pair||pair.status!=='together'||typeof reason!=='string'||!reason.trim())return false;
 pair.status='separated';pair.endedAt=at;pair.reason=reason;
 world.romance.cooldowns[pairKey(a,b)]=at+DAY;
 log(world,'relationship_ended',at,{participants:[a.id,b.id],reason});return true;
}

export function updateRomance(world,conversation,at,random){
 const [a,b]=conversation.participants.map(id=>world.people.find(p=>p.id===id));
 if(!a?.profile.romanceEnabled||!b?.profile.romanceEnabled
  ||!a.profile.romancePartners?.includes(b.id)||!b.profile.romancePartners?.includes(a.id))return;
 const key=pairKey(a,b),pair=world.romance?.couples[key];
 const ar=a.relationships?.[b.id],br=b.relationships?.[a.id];
 const tension=Math.max(ar?.tension??0,br?.tension??0);
 if(pair?.status==='together'){
  const recent=Object.values(world.conflicts??{}).filter(c=>c.state!=='resolved'
   &&c.participants.every(id=>pair.participants.includes(id)))
   .flatMap(c=>c.incidents).filter(i=>i.at>=pair.since&&at-i.at<=3*DAY);
  if(tension<35||recent.length<3){delete pair.strainedSince;return}
  pair.strainedSince??=at;
  if(at-pair.strainedSince>=DAY/2&&tension>=55){
   endRelationship(world,a,b,at,'varios desacuerdos seguían sin resolverse');
  }
  return;
 }
 if(conversation.story==='prank'||conversation.conflictId||tension>=25||random()>.3)return;
 for(const [from,to] of [[a,b],[b,a]]){
  const offer=proposeRelationship(world,from,to,at);
  if(!offer)continue;
  const r=to.relationships?.[from.id];
  const accept=(r?.romanticInterest??0)>=60&&random()<Math.min(.9,.25+((r?.trust??20)+(r?.romanticInterest??0))/170);
  respondToProposal(world,offer.id,to.id,accept,at);
  const closed=Object.values(world.romance.offers).filter(o=>o.status!=='pending');
  for(const old of closed.slice(0,Math.max(0,closed.length-100)))delete world.romance.offers[old.id];
  break;
 }
}
