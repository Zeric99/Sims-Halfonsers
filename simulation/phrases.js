import { residents } from './profiles.js';
const ids=new Set(residents.map(r=>r.identity.id));
export function normalizePhrase(body){
 if(!body||!ids.has(body.personId)||typeof body.text!=='string')return null;
 const text=body.text.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim();
 const kind=body.kind??'phrase';
 if(!['phrase','filler'].includes(kind)||!text||text.length>(kind==='filler'?40:100))return null;
 return kind==='filler'?{personId:body.personId,text,kind}:{personId:body.personId,text};
}
export function phraseForConversation(conversation,personId,phrases){
 if(!conversation||!conversation.participants?.includes(personId))return null;
 const list=phrases.filter(p=>p.personId===personId&&p.kind!=='filler');if(!list.length)return null;
 let hash=2166136261;for(const ch of conversation.id+':'+personId)hash=Math.imul(hash^ch.charCodeAt(0),16777619)>>>0;
 return hash%2===0?list[(hash>>>1)%list.length].text:null;
}
export function fillerForConversation(conversation,personId,catalog){
 const list=catalog.filter(p=>p.personId===personId&&p.kind==='filler');
 if(!list.length)return null;
 let hash=2166136261;
 for(const ch of conversation.id+':'+personId+':filler')hash=Math.imul(hash^ch.charCodeAt(0),16777619)>>>0;
 if(hash%3===0)return null;
 return {text:list[(hash>>>3)%list.length].text,position:(hash&4)?'prefix':'suffix',turn:conversation.participants.indexOf(personId)};
}

export function applyFiller(text,filler,turn){
 if(!text||!filler?.text||turn!==filler.turn)return text;
 const tail=filler.text.trim().replace(/[,.;:!?…]+$/u,'');
 if(!tail||text.toLocaleLowerCase('es').includes(tail.toLocaleLowerCase('es')))return text;
 if(filler.position==='prefix'){
  const [first,...rest]=tail;
  return first.toLocaleUpperCase('es')+rest.join('')+', '+text.replace(/^(Vale|Bueno|Pues|Sí|No|Me|Te|Yo|Hoy|Luego|Ya|Eso|Así|Mira|Creo|Quiero)\b/u,word=>word.toLocaleLowerCase('es'));
 }
 return text.replace(/([.!?…]+)?$/u,(_,punct)=>', '+tail+(punct||'.'));
}
