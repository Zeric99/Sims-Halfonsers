import * as THREE from 'three';

// Cuerpo articulado: cada malla cuelga de su articulación, no de su centro.
export function createMii({color=0x648cc4,faceUrl=null}={}){
 const root=new THREE.Group(),skin=new THREE.MeshStandardMaterial({color:0xe8b899}),shirt=new THREE.MeshStandardMaterial({color}),pants=new THREE.MeshStandardMaterial({color:0x515b68}),shoe=new THREE.MeshStandardMaterial({color:0x30383d});
 function part(parent,name,x,y,z){const p=new THREE.Group();p.name=name;p.position.set(x,y,z);parent.add(p);return p}
 function capsule(parent,r,length,material,x,y,z){const mesh=new THREE.Mesh(new THREE.CapsuleGeometry(r,length,4,10),material);mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh}
 const torso=part(root,'torso',0,.72,0);
 capsule(torso,.26,.46,shirt,0,0,0);
 const head=part(torso,'head',0,.66,0);
 const sphere=new THREE.Mesh(new THREE.SphereGeometry(.43,24,16),skin);head.add(sphere);
 if(faceUrl){new THREE.TextureLoader().load(faceUrl,texture=>{texture.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));sprite.scale.set(1.15,1.15,1);sprite.position.z=.12;head.add(sprite);sphere.visible=false})}
 else {const hair=new THREE.Mesh(new THREE.SphereGeometry(.435,24,16,0,Math.PI*2,0,Math.PI*.48),new THREE.MeshStandardMaterial({color:0x49372e}));hair.position.y=.02;head.add(hair)}
 for(const [side,label] of [[-1,'left'],[1,'right']]){
  const shoulder=part(torso,label+'Shoulder',side*.32,.18,0);
  capsule(shoulder,.075,.20,shirt,0,-.16,0);
  const elbow=part(shoulder,label+'Elbow',0,-.31,0);
  capsule(elbow,.065,.16,skin,0,-.13,0);
  const hip=part(root,label+'Hip',side*.14,.55,0);
  capsule(hip,.1,.18,pants,0,-.14,0);
  const knee=part(hip,label+'Knee',0,-.28,0);
  capsule(knee,.09,.16,pants,0,-.12,0);
  const foot=new THREE.Mesh(new THREE.BoxGeometry(.19,.12,.32),shoe);foot.position.set(0,-.25,.08);foot.castShadow=true;knee.add(foot);
 }
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
  clip('study',[['leftHip',sitting],['rightHip',sitting],['leftKnee',knees],['rightKnee',knees],['leftShoulder',[-.7,-.7,-.7,-.7,-.7]],['rightShoulder',[-.7,-.76,-.7,-.64,-.7]],['rightElbow',[-.5,-.65,-.5,-.35,-.5]],['head',[.12,.14,.12,.10,.12]]]),
  clip('computer',[['leftHip',sitting],['rightHip',sitting],['leftKnee',knees],['rightKnee',knees],['leftShoulder',[-.75,-.8,-.75,-.7,-.75]],['rightShoulder',[-.75,-.7,-.75,-.8,-.75]],['leftElbow',[-.65,-.55,-.65,-.75,-.65]],['rightElbow',[-.65,-.75,-.65,-.55,-.65]]])
 ];
 const mixer=new THREE.AnimationMixer(root),actions=Object.fromEntries(clips.map(c=>[c.name,mixer.clipAction(c)]));let current=null;
 function play(name){const next=actions[name]??actions.idle;if(next===current)return;if(current)current.fadeOut(.2);next.reset().setEffectiveWeight(1).fadeIn(.2).play();current=next}
 play('idle');return {root,mixer,play};
}
