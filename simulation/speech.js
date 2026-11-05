// Turnos compartidos: reloj de simulación y conversación son iguales para todos.
export function speechAt(conversation,personId,now){
 if(!conversation||conversation.finished||now<conversation.start||now>=conversation.end)return '';
 const participants=conversation.participants||[];if(participants.length!==2)return '';
 const turn=Math.floor((now-conversation.start)/(8*60000))%2;
 if(participants[turn]!==personId)return '';
 return conversation.lines?.[personId]||(turn===0?'¿Hablamos de '+conversation.topic+'?':'¡Claro, cuéntame!');
}
