// Turnos compartidos: reloj de simulación y conversación son iguales para todos.
export function speechAt(conversation,personId,now){
 if(!conversation||conversation.finished||now<conversation.start||now>=conversation.end)return '';
 const participants=conversation.participants||[];if(participants.length!==2)return '';
 const turn=Math.floor((now-conversation.start)/(8*60000))%2;
 if(participants[turn]!==personId)return '';
 if(conversation.lines?.[personId])return conversation.lines[personId];
 if(conversation.dialogue?.[turn])return conversation.dialogue[turn];
 const topic=conversation.topic||'el día';
 const dialogues=[
  ['¿Qué tal te va con '+topic+'?','¡Bastante bien! ¿Y a ti?'],
  ['Oye, ¿qué opinas de '+topic+'?','Pues me interesa, cuéntame más.'],
  ['El otro día me acordé de '+topic+'.','¿Ah, sí? ¿Qué pasó?'],
  ['Tenemos que hablar de '+topic+'.','¡Claro! Te escucho.']
 ];
 let hash=0;for(const ch of String(conversation.id||''))hash=(Math.imul(hash,31)+ch.charCodeAt(0))>>>0;
 return dialogues[hash%dialogues.length][turn];
}
