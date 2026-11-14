import {pollWhileActive} from './active-poll.js';
const form=document.querySelector('#phrase-form'),input=document.querySelector('#phrase-text'),list=document.querySelector('#phrase-list'),status=document.querySelector('#phrase-status');
const kindField=document.querySelector('#phrase-kind'),fillerList=document.querySelector('#filler-list'),label=document.querySelector('#phrase-label'),button=form.querySelector('button');
let selected=null,busy=false;
function renderList(target,entries,empty){
 const fragment=document.createDocumentFragment();
 if(!entries.length){const li=document.createElement('li');li.textContent=empty;fragment.append(li)}
 for(const entry of entries){const li=document.createElement('li');li.textContent=entry.text;fragment.append(li)}target.replaceChildren(fragment);
}
function render(){
 const entries=(window.residentPhrases||[]).filter(p=>p.personId===selected);
 renderList(list,entries.filter(p=>p.kind!=='filler'),'Todavía no tiene frases guardadas.');
 renderList(fillerList,entries.filter(p=>p.kind==='filler'),'Todavía no tiene muletillas guardadas.');
}
function updateKind(){
 const filler=kindField.value==='filler';
 input.maxLength=filler?40:100;
 input.placeholder=filler?'Ej.: en plan, bro, sabes…':'Escribe una frase…';
 label.textContent=filler?'AÑADIR MULETILLA':'AÑADIR FRASE';
 button.textContent=filler?'Guardar muletilla ↗':'Guardar frase ↗';
}
kindField.addEventListener('change',updateKind);
const panel=document.querySelector('#resident-panel');
const phraseVisible=()=>!document.hidden&&!panel.hidden&&Boolean(selected);
async function refresh(){
 const personId=selected;
 if(!phraseVisible())return true;
 try{
  const response=await fetch('/api/phrases?resident='+encodeURIComponent(personId),{signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error();
  const data=await response.json();
  if(selected===personId){window.residentPhrases=data.phrases;render();}
  return true;
 }catch{
  if(selected===personId&&phraseVisible())status.textContent='No se pueden cargar las frases y muletillas. Reintentando…';
  return false;
 }
}
window.addEventListener('resident-select',event=>{
 const prior=selected;
 selected=window.sharedWorld?.world.people.find(p=>p.name===event.detail.name)?.id||null;
 input.value='';status.textContent='';render();
 if(prior&&prior!==selected&&phraseVisible())void refresh();
});
form.addEventListener('submit',async event=>{
 event.preventDefault();if(busy||!selected)return;const personId=selected,text=input.value.trim(),kind=kindField.value;if(!text)return;
 busy=true;button.disabled=kindField.disabled=input.disabled=true;status.textContent='Guardando…';
 try{const response=await fetch('/api/phrases',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({personId,text,kind})});const data=await response.json();if(!response.ok)throw new Error(data.error||'No se pudo guardar');if(selected===personId){input.value='';status.textContent=kind==='filler'?'Muletilla guardada.':'Frase guardada.'}await refresh();}
 catch(error){if(selected===personId)status.textContent=error.message||'No se pudo guardar.'}
 finally{busy=false;button.disabled=kindField.disabled=input.disabled=false}
});
const visibilityObserver=new MutationObserver(()=>window.dispatchEvent(new Event('phrase-panel-change')));
visibilityObserver.observe(panel,{attributes:true,attributeFilter:['hidden']});
pollWhileActive(refresh,{active:phraseVisible,delay:30000,events:['phrase-panel-change','resident-select']});
