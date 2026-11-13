import {spectatorScene} from './spectator.js';

export function mountSpectator({controls,camera,people,Vector3,root}){
 const button=document.querySelector('#spectator-toggle');
 const copy=document.querySelector('#spectator-copy');
 const title=document.querySelector('#spectator-title');
 const context=document.querySelector('#spectator-context');
 const target=new Vector3(), delta=new Vector3(), right=new Vector3(), up=new Vector3(), offset=new Vector3();
 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 const characters=new Map(people.map(person=>[person.name,person]));
 let enabled=false, scene=null, saved=null, returning=null, nextCheck=0,preferred=null;
 const setText=(element,value)=>{if(element.textContent!==value)element.textContent=value};

 function toggle(on,restore=false){
  if(enabled===on)return;
  enabled=on;
  scene=null;
  preferred=null;
  nextCheck=0;
  button.setAttribute('aria-pressed',String(on));
  button.textContent=on?'Cámara libre':'Modo espectador';
  copy.hidden=!on;
  if(on){
   saved={target:controls.target.clone(),zoom:camera.zoom};
   returning=null;
   window.dispatchEvent(new CustomEvent('spectator-start'));
  }else{
   returning=restore?saved:null;
   saved=null;
  }
 }
 button.addEventListener('click',()=>toggle(!enabled,true));
 window.addEventListener('watch-group',event=>{toggle(true);preferred={id:event.detail.id};nextCheck=0});
 window.addEventListener('watch-scene',event=>{toggle(true);preferred={id:event.detail.id};nextCheck=0});
 controls.addEventListener('start',()=>{toggle(false);returning=null});
 window.addEventListener('manual-camera-view',()=>{toggle(false);returning=null});
 window.addEventListener('resident-follow',event=>{
  if(event.detail.name){toggle(false);returning=null}
 });
 if(['127.0.0.1','localhost'].includes(location.hostname)&&['spectator','group'].includes(new URLSearchParams(location.search).get('qa')))toggle(true);

 function move(destination,zoom,seconds){
  const blend=reducedMotion.matches?1:1-Math.exp(-4*seconds);
  delta.copy(destination).sub(controls.target).multiplyScalar(blend);
  controls.target.add(delta);
  camera.position.add(delta);
  camera.zoom+=(zoom-camera.zoom)*blend;
  camera.updateProjectionMatrix();
 }

 return function update(world,now,seconds,time){
  if(!enabled){
   if(returning){
    move(returning.target,returning.zoom,seconds);
    if(controls.target.distanceTo(returning.target)<.02&&Math.abs(camera.zoom-returning.zoom)<.01)returning=null;
   }
   return;
  }
  if(time>=nextCheck){
   scene=spectatorScene(world,now,scene,preferred);
   if(scene?.id!==preferred?.id)preferred=null;
   nextCheck=time+250;
   setText(title,scene?.title??'Vista general del barrio');
   setText(context,scene?.context??'La cámara se acercará cuando empiece una actividad.');
  }
  if(!scene){
   move(saved.target,saved.zoom,seconds);
   return;
  }
  const subjects=scene.names.map(name=>characters.get(name)).filter(Boolean);
  if(!subjects.length)return;
  target.set(0,0,0);
  for(const subject of subjects)target.add(subject.g.position);
  target.divideScalar(subjects.length);
  // Dejar espacio sobre los personajes para los bocadillos.
  target.y+=2.9;
  right.setFromMatrixColumn(camera.matrixWorld,0);
  up.setFromMatrixColumn(camera.matrixWorld,1);
  let width=0,height=0;
  for(const subject of subjects){
   offset.copy(subject.g.position).sub(target);
   width=Math.max(width,Math.abs(offset.dot(right)));
   height=Math.max(height,Math.abs(offset.dot(up)));
  }
  const zoom=Math.min(root.clientWidth<520?2.35:3.4,
   (camera.right-camera.left)/(2*width+7),
   (camera.top-camera.bottom)/(2*height+8));
  move(target,Math.max(controls.minZoom,zoom),seconds);
 };
}
