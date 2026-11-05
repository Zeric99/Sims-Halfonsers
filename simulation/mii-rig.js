import * as THREE from 'three';

// Cuerpo articulado: cada malla cuelga de su articulación, no de su centro.
export function createMii({color=0x648cc4,faceUrl=null}={}){
 const root=new THREE.Group(),skin=new THREE.MeshStandardMaterial({color:0xe8b899}),shirt=new THREE.MeshStandardMaterial({color}),pants=new THREE.MeshStandardMaterial({color:0x515b68}),shoe=new THREE.MeshStandardMaterial({color:0x30383d});
 function part(parent,name,x,y,z){const p=new THREE.Group();p.name=name;p.position.set(x,y,z);parent.add(p);return p}
 function capsule(parent,r,length,material,x,y,z){const mesh=new THREE.Mesh(new THREE.CapsuleGeometry(r,length,4,10),material);mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh}
 const torso=part(root,'torso',0,.72,0);
 capsule(torso,.26,.46,shirt,0,0,0);
 const head=part(torso,'head',0,.78,0);
 const sphere=new THREE.Mesh(new THREE.SphereGeometry(.43,24,16),skin);head.add(sphere);
 if(faceUrl){new THREE.TextureLoader().load(faceUrl,texture=>{texture.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false,depthTest:false}));sprite.scale.set(1.15,1.15,1);sprite.position.z=.12;head.add(sprite);sphere.visible=false})}
 else {const hair=new THREE.Mesh(new THREE.SphereGeometry(.435,24,16,0,Math.PI*2,0,Math.PI*.48),new THREE.MeshStandardMaterial({color:0x49372e}));hair.position.y=.02;head.add(hair);for(const x of [-.14,.14]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),new THREE.MeshStandardMaterial({color:0x302b28}));eye.position.set(x,0,.4);head.add(eye)}}
 const weights=[];
 for(const [side,label] of [[-1,'left'],[1,'right']]){
  const shoulder=part(torso,label+'Shoulder',side*.32,.18,0);
  capsule(shoulder,.075,.20,shirt,0,-.16,0);
  const elbow=part(shoulder,label+'Elbow',0,-.31,0);
  capsule(elbow,.065,.16,skin,0,-.13,0);
  const weight=new THREE.Group(),metal=new THREE.MeshStandardMaterial({color:0x424e54});
  const bar=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.38,10),metal);
  bar.rotation.z=Math.PI/2;weight.add(bar);
  for(const x of [-.17,.17]){const disk=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.075,12),metal);disk.rotation.z=Math.PI/2;disk.position.x=x;weight.add(disk)}
  weight.position.set(0,-.25,.05);weight.visible=false;elbow.add(weight);weights.push(weight);
  const hip=part(root,label+'Hip',side*.14,.55,0);
  capsule(hip,.1,.18,pants,0,-.14,0);
  const knee=part(hip,label+'Knee',0,-.28,0);
  capsule(knee,.09,.16,pants,0,-.12,0);
  const foot=new THREE.Mesh(new THREE.BoxGeometry(.19,.12,.32),shoe);foot.position.set(0,-.25,.08);foot.castShadow=true;knee.add(foot);
 }
 // Los accesorios pertenecen al personaje y solo aparecen durante la actividad.
 const plate=new THREE.Group();plate.name='plate';
 const dish=new THREE.Mesh(new THREE.CylinderGeometry(.23,.21,.035,24),new THREE.MeshStandardMaterial({color:0xf4f1e3}));plate.add(dish);
 const food=new THREE.Mesh(new THREE.SphereGeometry(.12,12,8),new THREE.MeshStandardMaterial({color:0xc78851}));food.scale.y=.5;food.position.y=.04;plate.add(food);plate.position.set(-.22,.78,.42);root.add(plate);
 const book=new THREE.Group(),page=new THREE.MeshStandardMaterial({color:0xfff4d7});
 for(const side of [-1,1]){const sheet=new THREE.Mesh(new THREE.BoxGeometry(.23,.035,.31),page);sheet.position.x=side*.12;sheet.rotation.z=side*.12;book.add(sheet)}
 book.position.set(0,.96,.46);root.add(book);
 const cigarette=new THREE.Group();
 const stick=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.19,8),new THREE.MeshStandardMaterial({color:0xf3eddf}));stick.rotation.x=Math.PI/2;cigarette.add(stick);
 const tip=new THREE.Mesh(new THREE.SphereGeometry(.023,8,6),new THREE.MeshBasicMaterial({color:0xe7753d}));tip.position.z=.10;cigarette.add(tip);
 cigarette.position.set(0,-.25,.08);root.getObjectByName('rightElbow').add(cigarette);
 plate.visible=book.visible=cigarette.visible=false;
 const times=[0,.25,.5,.75,1];
 const track=(name,values)=>new THREE.NumberKeyframeTrack(name+'.rotation[x]',times,values);
 const clip=(name,tracks)=>new THREE.AnimationClip(name,1,tracks.map(([joint,values])=>track(joint,values)));
 const still=[0,0,0,0,0],sitting=[-1.1,-1.1,-1.1,-1.1,-1.1],knees=[1.1,1.1,1.1,1.1,1.1];
 const clips=[
  clip('idle',[]),
  clip('walk',[
   ['leftHip',[.55,0,-.55,0,.55]],['rightHip',[-.55,0,.55,0,-.55]],
   ['leftKnee',[0,.25,.42,.08,0]],['rightKnee',[.42,.08,0,.25,.42]],
   ['leftShoulder',[-.42,0,.42,0,-.42]],['rightShoulder',[.42,0,-.42,0,.42]]
  ]),
  clip('sit',[['leftHip',sitting],['rightHip',sitting],['leftKnee',knees],['rightKnee',knees]]),
  clip('eat',[['leftHip',sitting],['rightHip',sitting],['leftKnee',knees],['rightKnee',knees],['rightShoulder',[-.6,-.8,-.6,-.35,-.6]],['rightElbow',[-.8,-1.45,-.8,-.4,-.8]]]),
  clip('gym',[['leftShoulder',[-.35,-.8,-1.2,-.8,-.35]],['rightShoulder',[-.35,-.8,-1.2,-.8,-.35]],['leftElbow',[-.15,-.45,-.7,-.45,-.15]],['rightElbow',[-.15,-.45,-.7,-.45,-.15]]]),
  clip('smoke',[['rightShoulder',[-.35,-.75,-.8,-.4,-.35]],['rightElbow',[-.4,-1.3,-1.4,-.5,-.4]]]),
  clip('eatStanding',[['rightShoulder',[-.4,-.9,-.4,-.2,-.4]],['rightElbow',[-.4,-1.35,-.4,-.2,-.4]]]),
  clip('study',[['leftHip',sitting],['rightHip',sitting],['leftKnee',knees],['rightKnee',knees],['leftShoulder',[-.7,-.7,-.7,-.7,-.7]],['rightShoulder',[-.7,-.76,-.7,-.64,-.7]],['rightElbow',[-.5,-.65,-.5,-.35,-.5]],['head',[.12,.14,.12,.10,.12]]]),
  clip('computer',[['leftHip',sitting],['rightHip',sitting],['leftKnee',knees],['rightKnee',knees],['leftShoulder',[-.75,-.8,-.75,-.7,-.75]],['rightShoulder',[-.75,-.7,-.75,-.8,-.75]],['leftElbow',[-.65,-.55,-.65,-.75,-.65]],['rightElbow',[-.65,-.75,-.65,-.55,-.65]]])
 ];
 // Levantar el tronco en la postura sentada evita que atraviese el asiento.
 for(const animation of clips.filter(c=>['sit','eat','study','computer'].includes(c.name)))animation.tracks.push(new THREE.NumberKeyframeTrack('torso.position[y]',[0,1],[.94,.94]));
 const mixer=new THREE.AnimationMixer(root),actions=Object.fromEntries(clips.map(c=>[c.name,mixer.clipAction(c)]));let current=null;
 function play(name){plate.visible=name==='eatStanding'||name==='eat';book.visible=name==='study';cigarette.visible=name==='smoke';for(const weight of weights)weight.visible=name==='gym';const next=actions[name]??actions.idle;if(next===current)return;if(current)current.fadeOut(.2);next.reset().setEffectiveWeight(1).fadeIn(.2).play();current=next}
 play('idle');return {root,mixer,play};
}
