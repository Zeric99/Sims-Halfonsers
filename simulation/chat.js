const form=document.querySelector('#chat-form'),nameInput=document.querySelector('#chat-name'),textInput=document.querySelector('#chat-text'),messages=document.querySelector('#chat-messages'),status=document.querySelector('#chat-status'),send=document.querySelector('#chat-send');
let lastKey=null,busy=false;
async function readResponse(res){const type=res.headers.get('content-type')||'';if(!type.includes('application/json'))throw new Error('No se pudo conectar con el chat. Abre sims-halfonsers.vercel.app y vuelve a intentarlo.');return res.json()}
async function refresh(){
 try{
  const res=await fetch('/api/chat',{cache:'no-store'});if(!res.ok)throw new Error();
  const data=await readResponse(res),key=data.messages.map(m=>m.id).join(',');
  const mode=document.querySelector('#chat-mode');if(mode){mode.hidden=data.mode!=='prueba_local_temporal';mode.textContent=mode.hidden?'':'Prueba local: mensajes temporales compartidos entre pestañas.'}
  if(status.textContent==='No se puede cargar el chat. Reintentando…')status.textContent='';if(key===lastKey)return;
  const nearBottom=messages.scrollHeight-messages.scrollTop-messages.clientHeight<50||!lastKey,fragment=document.createDocumentFragment();
  for(const item of data.messages){const row=document.createElement('p'),author=document.createElement('strong'),time=document.createElement('small');author.textContent=item.name+': ';time.textContent=' · '+new Intl.DateTimeFormat('es-ES',{hour:'2-digit',minute:'2-digit'}).format(new Date(item.created_at));row.append(author,document.createTextNode(item.message),time);fragment.append(row)}
  if(!data.messages.length){const row=document.createElement('p');row.textContent='Todavía no hay mensajes. ¡Di hola!';fragment.append(row)}
  messages.replaceChildren(fragment);lastKey=key;if(nearBottom)messages.scrollTop=messages.scrollHeight;
 }catch{status.textContent='No se puede cargar el chat. Reintentando…'}
}
form.addEventListener('submit',async event=>{
 event.preventDefault();if(busy)return;const name=nameInput.value.trim(),message=textInput.value.trim();
 if(!name||!message){status.textContent='Escribe un nombre y un mensaje.';return}
 busy=true;send.disabled=true;status.textContent='Enviando…';
 try{const res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,message})});const data=await readResponse(res);if(!res.ok)throw new Error(data.error||'No se pudo enviar');
  textInput.value='';status.textContent='Mensaje enviado.';await refresh();messages.scrollTop=messages.scrollHeight;
 }catch(error){status.textContent=error.message||'No se pudo enviar el mensaje.'}
 finally{busy=false;send.disabled=false}
});
refresh();setInterval(refresh,10000);
