import {QUESTIONNAIRE_VERSION} from './profiles.js';

const questions=[
 ['prefiereSoledad','Después de un día largo, prefiero estar a solas.'],
 ['disfrutaReuniones','Me gusta pasar tiempo con los demás vecinos.'],
 ['proponePlanes','Suelo proponer planes al grupo.'],
 ['esperaInvitacion','Prefiero esperar a que me inviten.'],
 ['ayudaOtros','Me ofrezco a ayudar cuando alguien lo necesita.'],
 ['respondeConCortesia','Intento responder con calma si algo me molesta.'],
 ['pierdePaciencia','Pierdo la paciencia con facilidad.'],
 ['toleraDemoras','Puedo esperar mi turno sin enfadarme.'],
 ['ordenHabitacion','Me gusta tener mi habitación recogida.'],
 ['dejaCosasFuera','Suelo dejar las cosas donde las usé.'],
 ['pruebaCosasNuevas','Me apetece probar actividades nuevas.'],
 ['prefiereLoConocido','Prefiero las actividades que ya conozco.'],
 ['terminaTareas','Suelo terminar lo que empiezo.'],
 ['cambiaDeTarea','A menudo cambio de tarea antes de acabarla.'],
 ['necesitaEspacio','Necesito tener momentos para mí.'],
 ['ruidoConcentracion','El ruido me desconcentra.'],
 ['ruidoNoMolesta','Puedo concentrarme aunque haya ruido.']
];

export function mountProfileEditor(panel){
 const open=document.createElement('button');
 open.type='button';
 open.className='follow-button';
 open.textContent='Editar personalidad';
 panel.querySelector('#resident-follow').after(open);

 const dialog=document.createElement('dialog');
 dialog.className='profile-editor';
 const title=document.createElement('h2');
 title.id='profile-editor-title';
 dialog.setAttribute('aria-labelledby',title.id);
 const form=document.createElement('form');
 const guide=document.createElement('p');
 guide.textContent='Responde como el personaje. Las preguntas que dejes en blanco conservan los rasgos que no hayas valorado.';
 const fields=document.createElement('fieldset');
 const legend=document.createElement('legend');
 legend.textContent='Cuestionario del personaje';
 fields.append(legend);
 for(const [id,text] of questions){
  const label=document.createElement('label');
  label.textContent=text;
  const select=document.createElement('select');
  select.name=id;
  for(const [value,name] of [
   ['','Sin responder'],['1','1 · Muy en desacuerdo'],['2','2 · En desacuerdo'],
   ['3','3 · Neutral'],['4','4 · De acuerdo'],['5','5 · Muy de acuerdo']
  ])select.add(new Option(name,value));
  label.append(select);
  fields.append(label);
 }
 const status=document.createElement('p');
 status.setAttribute('role','status');
 const controls=document.createElement('div');
 controls.className='profile-editor-actions';
 const close=document.createElement('button');
 close.type='button';
 close.textContent='Cerrar';
 const save=document.createElement('button');
 save.type='submit';
 save.textContent='Guardar personalidad';
 controls.append(close,save);
 form.append(guide,fields,status,controls);
 dialog.append(title,form);
 document.body.append(dialog);

 let editing=null;
 let saving=false;
 let saved=false;
 open.addEventListener('click',()=>{
  const world=window.sharedWorld?.world;
  const person=world?.people.find(p=>p.name===panel.querySelector('#resident-title').textContent);
  if(!person)return;
  editing={personId:person.id,revision:person.profileRevision??0};
  saved=false;
  fields.disabled=false;
  save.disabled=false;
  form.reset();
  title.textContent='Personalidad de '+person.name;
  status.textContent='';
  dialog.showModal();
 });
 close.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('cancel',event=>{if(saving)event.preventDefault()});
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(saving||saved||!editing)return;
  const answers=Object.fromEntries([...new FormData(form)]
   .filter(([,value])=>value!=='').map(([id,value])=>[id,Number(value)]));
  if(!Object.keys(answers).length){
   status.textContent='Responde al menos una pregunta.';
   return;
  }
  saving=true;
  fields.disabled=close.disabled=save.disabled=true;
  status.textContent='Guardando…';
  try{
   const response=await fetch('/api/local-profile',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({...editing,version:QUESTIONNAIRE_VERSION,answers}),
    signal:AbortSignal.timeout(10000)
   });
   const result=await response.json();
   if(!response.ok){status.textContent=result.error;return}
   saved=true;
   status.textContent='Personalidad guardada en la partida local.';
  }catch{
   status.textContent='No se pudo confirmar el guardado. Cierra el editor y vuelve a abrirlo.';
   saved=true;
  }finally{
   saving=false;
   close.disabled=false;
   fields.disabled=save.disabled=saved;
  }
 });
}
