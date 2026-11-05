import { residents } from './profiles.js';
const ids=new Set(residents.map(r=>r.identity.id));
export function normalizePhrase(body){
 if(!body||!ids.has(body.personId)||typeof body.text!=='string')return null;
 const text=body.text.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim();
 if(!text||text.length>100)return null;
 return {personId:body.personId,text};
}
export function phraseForConversation(conversation,personId,phrases){
 if(!conversation||!conversation.participants?.includes(personId))return null;
 const list=phrases.filter(p=>p.personId===personId);if(!list.length)return null;
 let hash=2166136261;for(const ch of conversation.id+':'+personId)hash=Math.imul(hash^ch.charCodeAt(0),16777619)>>>0;
 return hash%2===0?list[(hash>>>1)%list.length].text:null;
}
