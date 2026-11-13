import * as THREE from 'three';

export function mountResidentPov(element,people,controls){
 const camera=new THREE.PerspectiveCamera(65,1,.045,85);
 const banner=document.querySelector('#pov-banner');
 const label=document.querySelector('#pov-name');
 const hint=document.querySelector('#camera-hint');
 const mapHint=hint.closest('.hint');
 const eye=new THREE.Vector3();
 const direction=new THREE.Vector3();
 let resident=null,drag=null,lookYaw=0,lookPitch=0,heading=null,previousHint='';

 function select(name){
  const next=people.find(person=>person.name===name)??null;
  if(next===resident)return;
  if(resident)resident.g.visible=true;
  if(!resident&&next)previousHint=hint.textContent;
  resident=next;
  drag=null;
  heading=null;
  lookYaw=lookPitch=0;
  controls.enabled=!resident;
  banner.hidden=!resident;
  mapHint.classList.toggle('pov-hint',Boolean(resident));
  label.textContent=resident?'POV de '+resident.name:'';
  hint.textContent=resident?'Arrastra para mirar alrededor':previousHint;
  if(resident)resident.g.visible=false;
 }
 function stop(){select(null)}
 window.addEventListener('resident-pov',event=>{
  if(!people.some(person=>person.name===event.detail.name))return;
  window.dispatchEvent(new Event('manual-camera-view'));
  select(event.detail.name);
 });
 window.addEventListener('manual-camera-view',stop);
 window.addEventListener('spectator-start',stop);
 window.addEventListener('resident-follow',event=>{if(event.detail.name)stop()});
 document.querySelector('#pov-exit').addEventListener('click',stop);
 window.addEventListener('keydown',event=>{if(event.key==='Escape'&&resident){stop();event.preventDefault()}});
 element.addEventListener('pointerdown',event=>{
  if(!resident||event.button!==0)return;
  drag={id:event.pointerId,x:event.clientX,y:event.clientY};
  element.setPointerCapture(event.pointerId);
 });
 element.addEventListener('pointermove',event=>{
  if(!drag||drag.id!==event.pointerId)return;
  lookYaw-=(event.clientX-drag.x)*.006;
  lookPitch=THREE.MathUtils.clamp(lookPitch+(event.clientY-drag.y)*.005,-.85,.85);
  drag.x=event.clientX;
  drag.y=event.clientY;
 });
 for(const type of ['pointerup','pointercancel','lostpointercapture']){
  element.addEventListener(type,event=>{if(drag?.id===event.pointerId)drag=null});
 }

 function resize(aspect){
  camera.aspect=aspect;
  camera.updateProjectionMatrix();
 }
 function update(dt){
  if(!resident)return;
  resident.rig.head.getWorldPosition(eye);
  eye.y+=.07;
  const yaw=resident.g.rotation.y;
  const difference=heading===null?0:Math.atan2(Math.sin(yaw-heading),Math.cos(yaw-heading));
  heading=heading===null?yaw:heading+difference*(1-Math.exp(-12*dt));
  const pitch=lookPitch+(resident.avatar.rotation.x<-.7?.26:-.10);
  direction.set(Math.sin(heading+lookYaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(heading+lookYaw)*Math.cos(pitch));
  camera.position.copy(eye);
  camera.lookAt(eye.add(direction));
 }
 return {camera,resize,update,get resident(){return resident}};
}
