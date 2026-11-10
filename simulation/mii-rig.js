import * as THREE from 'three';

// Cuerpo articulado: cada malla cuelga de su articulación, no de su centro.
export function createMii({color=0x648cc4,faceUrl=null,longHair=false}={}){
 const root=new THREE.Group(),skin=new THREE.MeshStandardMaterial({color:0xe8b899}),shirt=new THREE.MeshStandardMaterial({color}),pants=new THREE.MeshStandardMaterial({color:0x515b68}),shoe=new THREE.MeshStandardMaterial({color:0x30383d});
 function part(parent,name,x,y,z){const p=new THREE.Group();p.name=name;p.position.set(x,y,z);parent.add(p);return p}
 function capsule(parent,r,length,material,x,y,z){const mesh=new THREE.Mesh(new THREE.CapsuleGeometry(r,length,4,10),material);mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh}
 const torso=part(root,'torso',0,1.1,0);
 capsule(torso,.20,.38,shirt,0,0,0);
 const head=part(torso,'head',0,.65,0);
 let faceSprite=null,facePlane=null,sleepBlend=0;
 const sphere=new THREE.Mesh(new THREE.SphereGeometry(.43,24,16),skin);head.add(sphere);
 if(faceUrl){new THREE.TextureLoader().load(faceUrl,texture=>{texture.colorSpace=THREE.SRGBColorSpace;const ratio=longHair?texture.image.height/texture.image.width:1,offset=longHair?-.2:0;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false,depthTest:false}));sprite.scale.set(1.15,1.15*ratio,1);sprite.position.set(0,offset,.12);head.add(sprite);faceSprite=sprite;facePlane=new THREE.Mesh(new THREE.PlaneGeometry(1.05,1.05*ratio),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide}));facePlane.position.set(0,offset,.44);head.add(facePlane);facePlane.visible=sleepBlend>.5;sprite.visible=!facePlane.visible;sphere.visible=facePlane.visible})}
 else {const hair=new THREE.Mesh(new THREE.SphereGeometry(.435,24,16,0,Math.PI*2,0,Math.PI*.48),new THREE.MeshStandardMaterial({color:0x49372e}));hair.position.y=.02;head.add(hair);for(const x of [-.14,.14]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),new THREE.MeshStandardMaterial({color:0x302b28}));eye.position.set(x,0,.4);head.add(eye)}}
 const weights=[];
 for(const [side,label] of [[-1,'left'],[1,'right']]){
  const shoulder=part(torso,label+'Shoulder',side*.26,.18,0);
  capsule(shoulder,.065,.23,shirt,0,-.17,0);
  const elbow=part(shoulder,label+'Elbow',0,-.34,0);
  capsule(elbow,.055,.23,skin,0,-.17,0);
  const wrist=part(elbow,label+'Wrist',0,-.34,0);capsule(wrist,.065,.04,skin,0,-.035,0);
  const weight=new THREE.Group(),metal=new THREE.MeshStandardMaterial({color:0x424e54});
  const bar=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.38,10),metal);
  bar.rotation.z=Math.PI/2;weight.add(bar);
  for(const x of [-.17,.17]){const disk=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.075,12),metal);disk.rotation.z=Math.PI/2;disk.position.x=x;weight.add(disk)}
  weight.position.set(0,-.34,.05);weight.visible=false;elbow.add(weight);weights.push(weight);
  const hip=part(root,label+'Hip',side*.12,.82,0);
  capsule(hip,.085,.24,pants,0,-.19,0);
  const knee=part(hip,label+'Knee',0,-.38,0);
  capsule(knee,.075,.24,pants,0,-.19,0);
  const foot=new THREE.Mesh(new THREE.BoxGeometry(.19,.12,.32),shoe);foot.position.set(0,-.38,.08);foot.castShadow=true;knee.add(foot);
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
 cigarette.position.set(0,-.34,.08);root.getObjectByName('rightElbow').add(cigarette);
 plate.visible=book.visible=cigarette.visible=false;
 const smoke=new THREE.Group();root.add(smoke);smoke.visible=false;
 const smokeGeometry=new THREE.SphereGeometry(1,8,6);
 const puffs=Array.from({length:9},(_,i)=>{const mesh=new THREE.Mesh(smokeGeometry,new THREE.MeshBasicMaterial({color:0xdde1e2,transparent:true,opacity:0,depthWrite:false}));smoke.add(mesh);return mesh});
 let smokeTime=0,smoking=false,walking=false,gaitDistance=0;
 const smokeOrigin=new THREE.Vector3();
 function setSleeping(blend){sleepBlend=blend;if(faceSprite){faceSprite.visible=blend<.5;facePlane.visible=blend>=.5;sphere.visible=blend>=.5}}
 function update(dt,distance=null){mixer.update(dt);
  if(walking){
   gaitDistance+=distance??dt*.667;
   for(const [side,offset] of [['left',0],['right',.5]]){
    const phase=(gaitDistance/.84+offset)%1;
    const stance=phase<.5,q=stance?phase*2:(phase-.5)*2;
    const z=stance?.21-.42*q:-.21+.42*q;
    const lift=stance?0:Math.sin(q*Math.PI)*.14;
    const down=.72-lift,length=Math.min(.759,Math.hypot(z,down));
    const bend=Math.acos(length/.76),hip=root.getObjectByName(side+'Hip'),knee=root.getObjectByName(side+'Knee');
    root.getObjectByName(side+'Shoulder').rotation.x=Math.sin(phase*Math.PI*2)*.4;root.getObjectByName(side+'Elbow').rotation.x=-.3-Math.max(0,Math.sin(phase*Math.PI*2))*.25;
    hip.position.y=.8;hip.rotation.x=-Math.atan2(z,down)-bend;knee.rotation.x=2*bend;
    knee.children.at(-1).rotation.x=-(hip.rotation.x+knee.rotation.x);
   }
   torso.rotation.y=Math.sin(gaitDistance/.84*Math.PI*2)*.06;
  }else{for(const side of ['left','right']){root.getObjectByName(side+'Knee').children.at(-1).rotation.x=0;if(!['sit','eat','study','computer'].includes(current?.getClip().name))root.getObjectByName(side+'Hip').position.y=.82}}
smoke.visible=smoking;if(!smoking){smokeTime=0;return}smokeTime+=dt;root.updateWorldMatrix(true,true);tip.getWorldPosition(smokeOrigin);root.worldToLocal(smokeOrigin);
  puffs.forEach((p,i)=>{const age=(smokeTime+i*.28)%2.5,q=age/2.5;p.position.copy(smokeOrigin).add(new THREE.Vector3(Math.sin(age*2+i)*.06+q*.16,age*.35,Math.cos(age+i)*.04));p.scale.setScalar(.025+q*.13);p.material.opacity=Math.sin(Math.PI*q)*.24});
 }
 const times=[0,.25,.5,.75,1];
 const track=(name,values)=>new THREE.NumberKeyframeTrack(name+'.rotation[x]',times,values);
 const clip=(name,tracks)=>new THREE.AnimationClip(name,1,tracks.map(([joint,values])=>track(joint,values)));
 const still=[0,0,0,0,0],sitting=Array(5).fill(-Math.PI/2),knees=Array(5).fill(Math.PI/2);
 const clips=[
  clip('idle',[['leftElbow',[-.12,-.16,-.12,-.08,-.12]],['rightElbow',[-.08,-.12,-.16,-.12,-.08]]]),
  clip('walk',[
   ['leftHip',[.55,0,-.55,0,.55]],['rightHip',[-.55,0,.55,0,-.55]],
   ['leftKnee',[0,.4,.72,.12,0]],['rightKnee',[.72,.12,0,.4,.72]],
   ['leftElbow',[-.18,-.4,-.55,-.3,-.18]],['rightElbow',[-.55,-.3,-.18,-.4,-.55]],
   ['leftShoulder',[-.42,0,.42,0,-.42]],['rightShoulder',[.42,0,-.42,0,.42]]
  ]),
  clip('wash',[['leftShoulder',[-.8,-.9,-.8,-.7,-.8]],['rightShoulder',[-.8,-.7,-.8,-.9,-.8]],['leftElbow',[-.6,-.9,-.6,-.4,-.6]],['rightElbow',[-.9,-.6,-.4,-.6,-.9]],['head',[.1,.12,.1,.08,.1]]]),
  clip('reach',[['rightShoulder',[-.3,-1.25,-1.3,-.6,-.3]],['rightElbow',[-.15,-.35,-.75,-.4,-.15]],['head',[0,.1,.16,.08,0]]]),
  clip('cook',[['leftShoulder',[-.7,-.72,-.7,-.68,-.7]],['leftElbow',[-.6,-.6,-.6,-.6,-.6]],['rightShoulder',[-.8,-.95,-.8,-.65,-.8]],['rightElbow',[-.4,-.7,-.8,-.5,-.4]],['head',[.1,.14,.1,.08,.1]]]),
  clip('talk',[['rightShoulder',[-.2,-.65,-.45,-.15,-.2]],['rightElbow',[-.4,-1,-.7,-.4,-.4]],['leftElbow',[-.3,-.4,-.8,-.5,-.3]],['head',[0,.06,0,-.04,0]]]),
  clip('clean',[['rightShoulder',[-.9,-1.1,-.9,-.65,-.9]],['rightElbow',[-.2,-.4,-.6,-.3,-.2]],['torso',[.08,.12,.08,.04,.08]]]),
  clip('read',[['leftShoulder',[-.7,-.7,-.7,-.7,-.7]],['rightShoulder',[-.7,-.8,-.7,-.6,-.7]],['leftElbow',[-.7,-.7,-.7,-.7,-.7]],['rightElbow',[-.7,-.9,-.7,-.5,-.7]],['head',[.12,.15,.12,.1,.12]]]),
  clip('sit',[['leftHip',sitting],['rightHip',sitting],['leftKnee',knees],['rightKnee',knees]]),
  clip('eat',[['leftHip',sitting],['rightHip',sitting],['leftKnee',knees],['rightKnee',knees],['rightShoulder',[-.6,-.8,-.6,-.35,-.6]],['rightElbow',[-.8,-1.45,-.8,-.4,-.8]]]),
  clip('gym',[['leftShoulder',[-.35,-.8,-1.2,-.8,-.35]],['rightShoulder',[-.35,-.8,-1.2,-.8,-.35]],['leftElbow',[-.15,-.45,-.7,-.45,-.15]],['rightElbow',[-.15,-.45,-.7,-.45,-.15]]]),
  clip('smoke',[['rightShoulder',[-.35,-.75,-.8,-.4,-.35]],['rightElbow',[-.4,-1.3,-1.4,-.5,-.4]]]),
  clip('eatStanding',[['rightShoulder',[-.4,-.9,-.4,-.2,-.4]],['rightElbow',[-.4,-1.35,-.4,-.2,-.4]]]),
  clip('study',[['leftHip',sitting],['rightHip',sitting],['leftKnee',knees],['rightKnee',knees],['leftShoulder',[-.7,-.7,-.7,-.7,-.7]],['rightShoulder',[-.7,-.76,-.7,-.64,-.7]],['rightElbow',[-.5,-.65,-.5,-.35,-.5]],['head',[.12,.14,.12,.10,.12]]]),
  clip('computer',[['leftHip',sitting],['rightHip',sitting],['leftKnee',knees],['rightKnee',knees],['leftShoulder',[-.75,-.8,-.75,-.7,-.75]],['rightShoulder',[-.75,-.7,-.75,-.8,-.75]],['leftElbow',[-.65,-.55,-.65,-.75,-.65]],['rightElbow',[-.65,-.75,-.65,-.55,-.65]]])
 ];
 // Ajustar cadera y torso al asiento sin acortar las piernas.
 for(const animation of clips.filter(c=>['sit','eat','study','computer'].includes(c.name))){
  for(const [joint,y] of [['torso',1.03],['leftHip',.66],['rightHip',.66]])animation.tracks.push(new THREE.NumberKeyframeTrack(joint+'.position[y]',[0,1],[y,y]));
 }
 const walk=clips.find(c=>c.name==='walk');
 walk.tracks.push(new THREE.NumberKeyframeTrack('torso.rotation[y]',times,[.07,0,-.07,0,.07]));
 for(const animation of clips.filter(c=>['eat','study','computer','smoke'].includes(c.name)))animation.tracks.push(new THREE.NumberKeyframeTrack('rightWrist.rotation[z]',times,[0,.15,0,-.12,0]));
 for(const c of clips){for(const t of c.tracks)t.setInterpolation(THREE.InterpolateSmooth);if(c.name!=='walk')c.duration=1.8;for(const t of c.tracks)if(c.name!=='walk')for(let i=0;i<t.times.length;i++)t.times[i]*=1.8}
 const mixer=new THREE.AnimationMixer(root),actions=Object.fromEntries(clips.map(c=>[c.name,mixer.clipAction(c)]));let current=null;
 function play(name){walking=name==='walk';smoking=name==='smoke';plate.position.y=name==='eat'?.98:.9;plate.visible=name==='eatStanding'||name==='eat';book.visible=name==='study'||name==='read';cigarette.visible=name==='smoke';for(const weight of weights)weight.visible=name==='gym';const next=actions[name]??actions.idle;if(next===current)return;if(current)current.fadeOut(.2);next.reset().setEffectiveWeight(1).fadeIn(.2).play();current=next}
 play('idle');return {root,mixer,play,update,setSleeping};
}
