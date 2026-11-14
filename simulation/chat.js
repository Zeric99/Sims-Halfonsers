import {pollWhileActive} from './active-poll.js';
const form=document.querySelector('#chat-form'),nameInput=document.querySelector('#chat-name'),textInput=document.querySelector('#chat-text'),messages=document.querySelector('#chat-messages'),status=document.querySelector('#chat-status'),send=document.querySelector('#chat-send');
let cursor='0',busy=false,inFlight;
const chatVisible=()=>!document.hidden&&document.body.dataset.panel==='chat';
const chatTime=new Intl.DateTimeFormat('es-ES',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
async function readResponse(res){const type=res.headers.get('content-type')||'';if(!type.includes('application/json'))throw new Error('No se pudo conectar con el chat. Abre sims-halfonsers.vercel.app y vuelve a intentarlo.');return res.json()}
function refresh(){
 if(inFlight)return inFlight;
 inFlight=readNewMessages().finally(()=>{inFlight=null});
 return inFlight;
}
async function readNewMessages(){
 try{
  const res=await fetch('/api/chat?after='+cursor,{signal:AbortSignal.timeout(10000)});
  if(!res.ok)throw new Error();
  const {messages:items,mode:chatMode}=await readResponse(res);
  const mode=document.querySelector('#chat-mode');
  if(mode){mode.hidden=chatMode!=='prueba_local_temporal';mode.textContent=mode.hidden?'':'Prueba local: mensajes temporales compartidos entre pestañas.'}
  if(status.textContent==='No se puede cargar el chat. Reintentando…')status.textContent='';
  if(!items.length){
   if(!messages.childElementCount){
    const placeholder=document.createElement('p');
    placeholder.dataset.empty='true';
    placeholder.textContent='Todavía no hay mensajes. ¡Di hola!';
    messages.append(placeholder);
   }
   return true;
  }
  const nearBottom=messages.scrollHeight-messages.scrollTop-messages.clientHeight<50||cursor==='0';
  messages.querySelector('[data-empty]')?.remove();
  const fragment=document.createDocumentFragment();
  for(const item of items){
   const row=document.createElement('p'),author=document.createElement('strong'),time=document.createElement('small');
   author.textContent=item.name+': ';
   time.textContent=' · '+chatTime.format(new Date(item.created_at));
   row.append(author,document.createTextNode(item.message),time);
   fragment.append(row);
  }
  messages.append(fragment);
  cursor=items.at(-1).id;
  while(messages.childElementCount>100)messages.firstElementChild.remove();
  if(nearBottom)messages.scrollTop=messages.scrollHeight;
  return true;
 }catch{
  status.textContent='No se puede cargar el chat. Reintentando…';
  return false;
 }
}
form.addEventListener('submit',async event=>{
 event.preventDefault();if(busy)return;const name=nameInput.value.trim(),message=textInput.value.trim();
 if(!name||!message){status.textContent='Escribe un nombre y un mensaje.';return}
 busy=true;send.disabled=true;status.textContent='Enviando…';
 try{const res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,message})});const data=await readResponse(res);if(!res.ok)throw new Error(data.error||'No se pudo enviar');
  textInput.value='';status.textContent='Mensaje enviado.';if(inFlight)await inFlight;if(chatVisible())await refresh();messages.scrollTop=messages.scrollHeight;
 }catch(error){status.textContent=error.message||'No se pudo enviar el mensaje.'}
 finally{busy=false;send.disabled=false}
});
pollWhileActive(refresh,{active:chatVisible,delay:10000,events:['community-panel-change']});
