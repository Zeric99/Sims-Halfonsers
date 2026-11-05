const form=document.querySelector('#phrase-form'),input=document.querySelector('#phrase-text'),list=document.querySelector('#phrase-list'),status=document.querySelector('#phrase-status');
let selected=null,busy=false;
function render(){
 const entries=(window.residentPhrases||[]).filter(p=>p.personId===selected);const fragment=document.createDocumentFragment();
 if(!entries.length){const li=document.createElement('li');li.textContent='Todavía no tiene frases guardadas.';fragment.append(li)}
 for(const entry of entries){const li=document.createElement('li');li.textContent=entry.text;fragment.append(li)}list.replaceChildren(fragment);
}
async function refresh(){
 try{const response=await fetch('/api/phrases',{cache:'no-store'});if(!response.ok)throw new Error();const data=await response.json();window.residentPhrases=data.phrases;render();window.dispatchEvent(new Event('resident-phrases-updated'));}
 catch{if(selected)status.textContent='No se pueden cargar las frases. Reintentando…'}
}
window.addEventListener('resident-select',event=>{
 selected=window.sharedWorld?.world.people.find(p=>p.name===event.detail.name)?.id||null;input.value='';status.textContent='';render();refresh();
});
form.addEventListener('submit',async event=>{
 event.preventDefault();if(busy||!selected)return;const personId=selected,text=input.value.trim();if(!text)return;
 busy=true;form.querySelector('button').disabled=true;status.textContent='Guardando…';
 try{const response=await fetch('/api/phrases',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({personId,text})});const data=await response.json();if(!response.ok)throw new Error(data.error||'No se pudo guardar');if(selected===personId){input.value='';status.textContent='Frase guardada.'}await refresh();}
 catch(error){status.textContent=error.message||'No se pudo guardar la frase.'}
 finally{busy=false;form.querySelector('button').disabled=false}
});
refresh();setInterval(refresh,10000);
