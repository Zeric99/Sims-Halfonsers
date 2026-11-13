import {buildDialogue} from './dialogues.js';
import {applyFiller} from './phrases.js';

const TURN_MS=8*60000;
const FADE_MS=900;
const FADE_STEP_MS=600;

function baseMessageAt(conversation,personId,turn){
 const dialogue=conversation.dialogue;
 if(conversation.speakers)return dialogue[turn]??'';
 const phrase=conversation.lines?.[personId];
 const total=Math.ceil((conversation.end-conversation.start)/TURN_MS);
 const scripted=dialogue?.length>=3;
 if(phrase && (scripted?turn+2>=total:turn<2))return phrase;
 if(dialogue?.[turn])return dialogue[turn];
 if(!dialogue?.length&&!Object.values(conversation.lines??{}).some(Boolean)){
  const generated=buildDialogue({...conversation});
  if(generated[turn])return generated[turn];
 }
 return [
  'Bueno, seguimos un rato más.',
  'Vale, yo todavía tengo tiempo.',
  'Me alegro de que hayamos coincidido.',
  'Luego seguimos, ¿te parece?'
 ][turn%4];
}

const messageAt=(conversation,personId,turn)=>
 applyFiller(baseMessageAt(conversation,personId,turn),conversation.fillers?.[personId],turn);

// Un mismo historial se reconstruye a partir del reloj y los turnos compartidos.
export function conversationMessages(conversation,now,elapsedAfterEnd){
 if(!conversation||(!conversation.speakers&&conversation.participants?.length!==2)||now<conversation.start)return [];
 if(conversation.cancelled&&conversation.cancelledAt==null)return [];
 const end=conversation.cancelledAt??conversation.end;
 const duration=end-conversation.start;
 if(duration<=0)return [];
 const interval=conversation.turnMs??TURN_MS;
 const turns=Math.min(conversation.speakers?.length??Infinity,Math.ceil(duration/interval),Math.floor((now-conversation.start)/interval)+1);
 if(now>=end&&elapsedAfterEnd>=(turns-1)*FADE_STEP_MS+FADE_MS)return [];
 const messages=[];
 for(let turn=0;turn<turns;turn++){
  const speaker=conversation.speakers?.[turn]??conversation.participants[turn%2];
  const opacity=now<end?1:Math.min(1,Math.max(0,1-(elapsedAfterEnd-turn*FADE_STEP_MS)/FADE_MS));
  if(opacity>0)messages.push({turn,speaker,text:messageAt(conversation,speaker,turn),opacity});
 }
 return messages;
}

export function speakingTurn(conversation,now){
 if(!conversation||(!conversation.speakers&&conversation.participants?.length!==2)||conversation.finished||conversation.cancelled||
    now<conversation.start||now>=(conversation.cancelledAt??conversation.end))return null;
 const turn=Math.floor((now-conversation.start)/(conversation.turnMs??TURN_MS));
 return {turn,speaker:conversation.speakers?.[turn]??conversation.participants[turn%2]};
}

// Devuelve el texto del turno actual, si le corresponde a este vecino.
export function speechAt(conversation,personId,now){
 const active=speakingTurn(conversation,now);
 return active?.speaker===personId?messageAt(conversation,personId,active.turn):'';
}
