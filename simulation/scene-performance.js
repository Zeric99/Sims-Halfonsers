import {speakingTurn} from './speech.js';

export function conversationGesture(conversation,id,now){
 const active=speakingTurn(conversation,now);
 if(!active||!conversation.participants.includes(id))return null;
 const speaking=active.speaker===id;
 if(conversation.story==='repair')return speaking?'explain':'listenCareful';
 if(conversation.story==='prank'){
  if(active.turn===0)return speaking?'joke':'listen';
  if(id===conversation.participants[1])return conversation.prankOffended?'offended':'laugh';
  return conversation.prankOffended?(speaking?'explain':'listenCareful'):(speaking?'joke':'laugh');
 }
 return speaking?'talk':'listen';
}

export function cookingStage(conversation,action,meal,now){
 if(!action||now>=action.until)return null;
 if(action.activity==='cooking'&&speakingTurn(conversation,now)){
  const q=(now-conversation.start)/(conversation.end-conversation.start);
  return q<.25?'prep':q<.74?'cook':'serve';
 }
 return {fridge:'fridge',to_stove:'carryIngredients',cooking:'cook',to_table:'carryPlate',eating:'eat'}[meal?.kind]??null;
}

const overlap=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*
 Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));

export function placeSpeech({x,y,w,h,width,height,heads=[],occupied=[]}){
 const margin=7,gap=11;
 const clamp=(n,limit)=>Math.max(margin,Math.min(n,limit-margin));
 const candidates=[];
 for(const dy of [-h-gap,0,-h/2,gap,-h-gap-38,gap+50]){
  for(const dx of [-w/2,gap+30,-w-gap-30,60-w/2,-60-w/2]){
   const box={x:clamp(x+dx,width-w),y:clamp(y+dy,height-h),w,h};
   const score=100*heads.reduce((s,b)=>s+overlap(box,b),0)+
    30*occupied.reduce((s,b)=>s+overlap(box,b),0)+Math.hypot(box.x+w/2-x,box.y+h-y)+(dy>=0?20:0);
   candidates.push({box,score});
  }
 }
 return candidates.reduce((best,current)=>current.score<best.score?current:best).box;
}
