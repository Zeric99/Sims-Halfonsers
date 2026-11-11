import { simulationTime, clockRateAt, realElapsed } from './simulation/clock.js';
import { createSpeechOverlay } from './simulation/speech-overlay.js';
import { createMii } from './simulation/mii-rig.js';
import { separatePeople } from './simulation/separation.js';
import { isWalkable } from './simulation/navigation.js';
import { mealPosition, mealStage } from './simulation/meal-stage.js';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
const root=document.querySelector('#world');
const scene=new THREE.Scene();scene.background=new THREE.Color(0xb8d99c);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,2.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;root.prepend(renderer.domElement);document.querySelector('#loading').remove();
const camera=new THREE.OrthographicCamera(-22,22,16,-16,.1,200);camera.position.set(30,38,40);camera.lookAt(0,0,0);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,0,1);controls.enablePan=true;controls.screenSpacePanning=true;controls.zoomToCursor=true;controls.minZoom=.7;controls.maxZoom=6;
// Fijar la inclinación mantiene la vista isométrica aunque se gire el edificio.
const fixedPolar=Math.atan2(Math.hypot(30,39),38);controls.minPolarAngle=fixedPolar;controls.maxPolarAngle=fixedPolar;controls.update();
// Encuadre reproducible para las escenas aisladas del servidor de pruebas.
if(location.hostname==='127.0.0.1'&&new URLSearchParams(location.search).has('qa')){
 const kind=new URLSearchParams(location.search).get('qa');
 const [x,z]=['sleep','desk','computer'].includes(kind)?[-14,-10]:['bath','wash'].includes(kind)?[-15,-2]:kind==='social'&&new URLSearchParams(location.search).get('phase')==='gym'?[9,17]:[-8,-4];
 controls.target.set(x,0,z);camera.position.set(x+30,38,z+39);camera.zoom=4.5;camera.updateProjectionMatrix();controls.update();
}
const ambient=new THREE.HemisphereLight(0xffffff,0x6c8061,2);scene.add(ambient);const sun=new THREE.DirectionalLight(0xfff3d8,2);sun.position.set(-15,35,20);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-27,right:27,top:27,bottom:-27,near:1,far:90});sun.shadow.bias=-0.0003;sun.shadow.normalBias=.035;scene.add(sun);
const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.85});const materials={grass:mat(0x98c77a),wood:mat(0xe1bd8d),tile:mat(0xdbe6d6),wall:mat(0xbba587),white:mat(0xf8f3e8),blanket:mat(0x7bad9f),brown:mat(0x997054),dark:mat(0x425e50),garden:mat(0x7ab85f)};
const obstacles=[];
function box(x,y,z,w,h,d,m){if(h>.3 && y-h/2<.26 && w<39 && d<37)obstacles.push({x,z,w,d});const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;scene.add(o);return o}
function soft(x,y,z,w,h,d,m,r=.08){const o=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,3,Math.min(r,w/3,h/3,d/3)),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;scene.add(o);return o}
function cylinder(x,y,z,rt,rb,h,m){const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,20),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;scene.add(o);return o}
function woodTexture(){const c=document.createElement('canvas');c.width=512;c.height=512;const q=c.getContext('2d');q.fillStyle='#efd3a9';q.fillRect(0,0,512,512);for(let y=0;y<512;y+=64){q.fillStyle=y%128?'#e5c493':'#edd0a3';q.fillRect(0,y,512,63);q.strokeStyle='#c49b72';q.lineWidth=2;q.strokeRect(0,y,512,64);for(let x=(y%128?128:0);x<512;x+=256){q.beginPath();q.moveTo(x,y);q.lineTo(x,y+64);q.stroke()}q.strokeStyle='rgba(130,87,55,.14)';for(let j=0;j<4;j++){q.beginPath();q.moveTo(0,y+10+j*13);q.bezierCurveTo(160,y+3+j*13,300,y+18+j*13,512,y+8+j*13);q.stroke()}}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(4,4);t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t}
materials.wood.map=woodTexture();materials.wood.needsUpdate=true;
const textLabels=[];
function labelTexture(text,size,width=512){
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=128;
 const ctx=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 function draw(){ctx.clearRect(0,0,width,128);ctx.font='700 '+size+'px "DM Sans", "Segoe UI", sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.strokeStyle='rgba(12,23,32,.85)';ctx.lineWidth=7;ctx.shadowColor='rgba(0,0,0,.55)';ctx.shadowBlur=7;ctx.shadowOffsetY=3;ctx.strokeText(text,width/2,64,width-24);ctx.shadowBlur=0;ctx.shadowOffsetY=0;ctx.fillStyle='#ffffff';ctx.fillText(text,width/2,64,width-24);texture.needsUpdate=true}
 draw();textLabels.push(draw);return texture;
}
if(document.fonts)document.fonts.load('700 58px "DM Sans"').then(()=>textLabels.forEach(draw=>draw())).catch(()=>{});
function label(text,x,y,z,color='#294036',scale=1){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:labelTexture(text,48),transparent:true,depthTest:false,depthWrite:false}));s.scale.set(3.6*scale,.9*scale,1);s.position.set(x,y,z);scene.add(s)}

box(0,-.22,1,39,.4,37,materials.grass);box(0,.01,0,4,.12,26,materials.wall);for(let z=-11;z<13;z+=2)box(0,.08,z,3.9,.03,.04,materials.white);
function bed(x,z){const frame=mat(0x73513b),linen=mat(0xe9eddf),quilt=mat(0x78a99c);
 soft(x,.25,z,1.18,.28,1.85,frame,.08);for(const dx of [-.44,.44])for(const dz of [-.72,.72])cylinder(x+dx,.14,z+dz,.065,.075,.25,frame);
 soft(x,.47,z,1.06,.24,1.68,linen,.1);soft(x,.61,z+.27,1.05,.18,1.05,quilt,.09);
 soft(x,.64,z-.48,.77,.16,.34,materials.white,.1);soft(x,.77,z-.91,1.22,.9,.14,frame,.08);
 box(x,.72,z+.46,.98,.02,.025,mat(0xaed1c0));box(x,.72,z+.1,.98,.02,.025,mat(0xaed1c0));}
function diningChair(x,z,dir){const m=mat(0x765943),pad=mat(0x7eaaa1);soft(x,.48,z,.55,.13,.52,pad,.06);for(const dx of [-.2,.2])for(const dz of [-.18,.18])cylinder(x+dx,.24,z+dz,.035,.035,.46,m);soft(x,.82,z+dir*.23,.55,.65,.1,m,.04);soft(x,.83,z+dir*.18,.42,.46,.06,pad,.04)}
function oval(x,y,z,w,h,d,m){const o=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),m);o.position.set(x,y,z);o.scale.set(w/2,h/2,d/2);o.castShadow=true;o.receiveShadow=true;scene.add(o);return o}
function sofa(x,z){const first=scene.children.length;const fabric=mat(0x638f87), cushion=mat(0x86b0a3), legs=mat(0x624b3c);
 soft(x,.36,z,2.55,.55,.95,fabric,.15);soft(x,.84,z-.36,2.55,.85,.25,fabric,.12);
 for(const dx of [-.77,0,.77]){soft(x+dx,.68,z+.05,.72,.22,.72,cushion,.1);soft(x+dx,1.02,z-.21,.7,.48,.22,cushion,.1)}
 for(const dx of [-1.16,1.16]){soft(x+dx,.72,z,.25,.65,.95,fabric,.1);for(const dz of [-.32,.32])cylinder(x+dx,.12,z+dz,.07,.08,.22,legs)}
 for(const part of scene.children.slice(first)){part.position.x=2*x-part.position.x;part.position.z=2*z-part.position.z;part.rotation.y+=Math.PI}
}
function plantPot(x,z){const pot=mat(0xb67558),leaves=mat(0x488b57);cylinder(x,.23,z,.3,.21,.4,pot);for(let i=0;i<7;i++){const a=i*Math.PI*2/7;const leaf=oval(x+Math.cos(a)*.2,.66+(i%2)*.14,z+Math.sin(a)*.2,.25,.65,.2,leaves);leaf.rotation.z=Math.cos(a)*.5;leaf.rotation.x=Math.sin(a)*.5}}
function flat(cx,cz,n,title,names){const x0=cx-7,z0=cz-6;box(cx,.03,cz,14,.15,12,materials.wood); // cutaway low walls
box(cx,.45,z0,14,.8,.12,materials.wall);for(const side of [-1,1]){const wx=cx+side*7;if((cx<0&&side===1)||(cx>0&&side===-1)){box(wx,.45,cz-4,.12,.8,4,materials.wall);box(wx,.45,cz+3,.12,.8,6,materials.wall)}else box(wx,.45,cz,.12,.8,12,materials.wall)}
const rooms=[[x0,z0],[x0+3.5,z0],[x0+7,z0],[x0+10.5,z0]];
for(let i=0;i<n;i++){let [x,z]=rooms[i];box(x+1.75,.11,z+2.5,3.45,.08,4.9,materials.wood);bed(x+1.15,z+2.4);box(x+2.7,.4,z+1.1,.8,.65,.7,materials.brown);box(x+3.5,.55,z+2.45,.12,1.0,4.9,materials.wall);roomPositions.push({name:names[i],x:x+2.5,z:z+3.7,bedX:x+1.15,bedZ:z+2.4});
// Escritorio, silla, monitor y accesorios individuales.
box(x+2.55,.60,z+1.12,1.35,.12,.75,materials.brown);for(const dx of [-.55,.55])box(x+2.55+dx,.3,z+1.12,.1,.6,.65,materials.brown);
box(x+2.55,1.05,z+.84,.85,.58,.08,mat(0x344a50));box(x+2.55,1.05,z+.79,.72,.43,.02,mat(0x77b5b6));box(x+2.55,.48,z+2.0,.6,.13,.6,materials.dark);box(x+2.55,.78,z+2.27,.6,.65,.12,materials.dark);
box(x+2.55,.71,z+1.45,.75,.025,.22,mat(0xd8ded4));for(let k=0;k<4;k++)box(x+2.28+k*.18,.73,z+1.44,.12,.01,.035,mat(0x70817b));box(x+2.55,.79,z+.96,.07,.18,.12,mat(0x3e5050));box(x+2.55,.72,z+.99,.35,.04,.22,mat(0x3e5050));for(const dx of [-.2,.2])for(const dz of [-.2,.2])box(x+2.55+dx,.22,z+2+dz,.07,.43,.07,materials.brown);
const hobbies={Eric:'camera',Aisuke:'gym',Snow:'camera',Adrián:'gym',Arian:'screen',Delos:'music',Linkal:'gym',Catalán:'ball',May:'screen',Mei:'art',Pablo:'screen',Lolo:'screen',David:'screen',Yaiza:'study'};
const hobby=hobbies[names[i]];
if(hobby==='camera'){box(x+2.85,.76,z+1.2,.35,.22,.2,mat(0x303d3b));let lens=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.12,12),mat(0x91b7b4));lens.rotation.x=Math.PI/2;lens.position.set(x+2.85,.76,z+1.32);scene.add(lens)}

if(hobby==='art'){box(x+2.9,.72,z+1.15,.35,.04,.3,mat(0xfbf4d3));box(x+2.85,.76,z+1.1,.05,.04,.3,mat(0xc16b78))}
if(hobby==='music'){box(x+2.9,.78,z+1.12,.25,.35,.22,mat(0x414348));box(x+2.9,.79,z+1,.12,.12,.02,mat(0xcac9ae))}
if(hobby==='study'){for(let k=0;k<3;k++)box(x+2.86,.73+k*.1,z+1.16,.4,.09,.27,mat([0x91a9bb,0xd09b87,0xd9c58a][k]))}
if(hobby==='ball'){let b=new THREE.Mesh(new THREE.SphereGeometry(.2,12,10),mat(0xf6f2dc));b.position.set(x+2.8,.25,z+3.1);scene.add(b)}
label(names[i],x+1.75,2.1,z+4.35,'#304334',.58)}
box(cx-.8,.1,cz+4.8,5.6,.06,2.3,materials.tile);for(let i=0;i<3;i++)box((x0+3.4)+.7+i*1.3,.55,(cz+0.75)+4.7,1.2,1,.8,materials.white);box((cx+3.4)-2.5,.9,(cz+0.75)+4.7,.8,.2,.6,materials.dark);
for(let j=0;j<3;j++){box((x0+3.4)+.7+j*1.3,.73,(cz+0.75)+4.26,1.05,.04,.04,mat(0xc8cfc2));box((x0+3.4)+.7+j*1.3,.47,(cz+0.75)+4.26,.24,.04,.04,mat(0x81938a));}box((x0+3.4)+2,.98,(cz+0.75)+4.7,1.1,.08,.75,mat(0xb5b8a9));box((x0+3.4)+2,1.04,(cz+0.75)+4.7,.76,.04,.48,mat(0x728c88));
// Baño independiente: paredes bajas de corte y hueco de entrada frontal.
box((cx+-6)+.5,.11,(cz+0)+4.7,2.9,.07,2.55,mat(0xc6dadd));
box((cx+-6)-.95,.55,(cz+0)+4.7,.12,1.1,2.6,materials.wall);box((cx+-6)+1.95,.55,(cz+0)+4.7,.12,1.1,2.6,materials.wall);
box((cx+-6)+.5,.55,(cz+0)+6,3.0,1.1,.12,materials.wall);
box((cx+-6)-.625,.55,(cz+0)+3.4,.65,1.1,.12,materials.wall);box((cx+-6)+1.625,.55,(cz+0)+3.4,.65,1.1,.12,materials.wall);
soft((cx+-6)-.35,.23,(cz+0)+5.38,.42,.4,.52,materials.white,.09);oval((cx+-6)-.35,.48,(cz+0)+5.33,.74,.22,.8,materials.white);oval((cx+-6)-.35,.59,(cz+0)+5.32,.49,.035,.53,mat(0xb4ccca));soft((cx+-6)-.35,.8,(cz+0)+5.66,.68,.65,.24,materials.white,.07);soft((cx+-6)+1.1,.55,(cz+0)+5.38,.65,1,.5,mat(0xddebf0),.06);box((cx+-6)+1.1,1.06,(cz+0)+5.31,.52,.04,.34,materials.white);
box(cx-1,.55,cz+6,6,1.1,.12,materials.wall);
// Electrodomésticos, encimera y vajilla en cada vivienda.
soft((x0+3.4)+4.9,1.0,(cz+0.75)+4.7,1.1,1.9,.9,mat(0xe8ebe3),.07);box((x0+3.4)+4.9,1.05,(cz+0.75)+4.235,1.02,.025,.02,mat(0xa5b4ad));soft((x0+3.4)+4.55,1.38,(cz+0.75)+4.22,.08,.45,.06,mat(0x889b96),.025);soft((x0+3.4)+4.55,.65,(cz+0.75)+4.22,.08,.32,.06,mat(0x889b96),.025);box((x0+3.4)+.8,1.1,(cz+0.75)+5.0,.45,.45,.08,mat(0x607c76));
for(const dx of [-.24,.24])for(const dz of [-.18,.18]){cylinder((x0+3.4)+.8+dx,1.09,(cz+0.75)+4.7+dz,.13,.13,.03,mat(0x36494a));cylinder((x0+3.4)+.8+dx,1.11,(cz+0.75)+4.7+dz,.08,.08,.012,mat(0x708581))}
soft((x0+3.4)+2,1.09,(cz+0.75)+4.7,.58,.035,.42,mat(0x506c68),.05);cylinder((x0+3.4)+2,1.12,(cz+0.75)+4.7,.06,.06,.02,mat(0xbcd0ca));
const tap=new THREE.Mesh(new THREE.TorusGeometry(.15,.025,8,20,Math.PI),mat(0xa9b9b0));tap.position.set((x0+3.4)+2,1.23,(cz+0.75)+4.94);scene.add(tap);
soft(cx+3.5,.7,cz+1.8,2.3,.14,1.3,materials.brown,.06);for(const dx of [-.95,.95])for(const dz of [-.46,.46])box(cx+3.5+dx,.35,cz+1.8+dz,.12,.7,.12,materials.brown);
for(let dx of [-.6,.6]){let plate=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.035,16),materials.white);plate.position.set(cx+3.5+dx,.79,cz+1.8);scene.add(plate)}for(let dx of [-1.6,1.6])for(let dz of [-.6,.6])diningChair(cx+3.5+dx,cz+1.8+dz,dz>0?1:-1);sofa(cx+4.2,cz+4.8);plantPot(cx+6.2,cz+5.2);
box(cx+4.2,.13,cz+4.5,4.1,.025,2.7,mat(cz<0?0x9bb8bb:0xc8a68c));
soft(cx+4.2,.38,cz+3.45,2.1,.65,.45,materials.brown,.06);
soft(cx+4.2,1.02,cz+3.45,1.6,.85,.08,materials.dark,.04);
box(cx+4.2,1.02,cz+3.5,1.45,.7,.02,mat(0x547f95));
for(let k=0;k<4;k++)box(cx+3.5+k*.15,.76,cz+3.45,.1,.16,.23,mat([0xb86e5f,0xd4bb79,0x84a9a3,0x7786ad][k]));
cylinder(cx+3.5,.86,cz+1.8,.12,.1,.22,mat(0xb78b68));
for(let k=0;k<3;k++)oval(cx+3.5+(k-1)*.09,1.08,cz+1.8,.13,.18,.13,mat(0xdca58a));
box((cx+3.4)-3.6,1.08,(cz+0.75)+4.7,.5,.04,.32,mat(0xc49b68));
cylinder((cx+3.4)-6.2,1.23,(cz+0.75)+4.7,.22,.18,.25,materials.dark);
cylinder((cx+3.4)-6.2,1.37,(cz+0.75)+4.7,.23,.23,.04,materials.white);
label(title,cx,2.4,z0+.5,'#25402f',.8)}
const roomPositions=[];
const groups=[['Eric','Linkal','Mei','Yaiza'],['Snow','Adrián','Arian','Lolo'],['Delos','May','Pablo'],['Aisuke','Catalán','David']];flat(-10,-7,4,'PISO 1',groups[0]);flat(10,-7,4,'PISO 2',groups[1]);flat(-10,7,3,'PISO 3',groups[2]);flat(10,7,3,'PISO 4',groups[3]);
box(0,.05,17,36,.13,7,materials.garden);label('JARDÍN COMUNITARIO',0,1,18,'#2d5030',1);function tree(x,z){box(x,.8,z,.45,1.6,.45,materials.brown);let crown=new THREE.Mesh(new THREE.SphereGeometry(1.1,24,16),mat(0x4d9852));crown.position.set(x,2,z);crown.castShadow=true;scene.add(crown)}tree(-14,17);tree(14,17);tree(-17,14);tree(17,14);
 // Zona común de entrenamiento; la posición libre de ejercicio es (9,17).
 const gymFloor=mat(0x687c72),gymMetal=mat(0x3a4b50),gymAccent=mat(0xe59e6e);
 soft(9,.15,17,3.1,.07,2.5,gymFloor,.1);
 label('GIMNASIO',9,1.4,19.2,'#304334',.55);
 soft(11.4,.28,18.2,1.9,.13,.7,gymMetal,.04);
 for(const dx of [-.7,0,.7]){cylinder(11.4+dx,.46,18.2,.15,.15,.25,gymMetal);cylinder(11.4+dx,.6,18.2,.1,.1,.06,gymAccent)}

for(let i=0;i<12;i++){const flower=new THREE.Mesh(new THREE.SphereGeometry(.13,8,6),mat(i%2?0xf8d479:0xe69b9c));flower.position.set(-11+i*2,.24,18.5+Math.sin(i)*.5);scene.add(flower)}box(6,.5,16,2.5,.18,.7,materials.brown);box(6,.95,16.3,2.5,.85,.12,materials.brown);for(const dx of [-1,1])for(const dz of [-.2,.2])box(6+dx,.25,16+dz,.12,.5,.12,materials.dark);box(-6,.4,17,2, .7,1.4,materials.brown);box(-6,.79,17,1.9,.08,1.3,mat(0x608f4d));for(let j=0;j<5;j++){const plant=new THREE.Mesh(new THREE.SphereGeometry(.23,12,8),mat(j%2?0x79b865:0x9bc876));plant.position.set(-6.8+j*.4,1.01,17);plant.castShadow=true;scene.add(plant)}

for(let z=13.5;z<=19.5;z+=.8)box(0,.14,z,1.8,.035,.66,mat(0xd7cbb2));
for(let x=-11;x<=11;x+=1.1)box(x,.14,15,1,.035,1.1,mat(0xc6bca9));
for(const x of [-17,17]){soft(x,.27,19,1.6,.45,1.3,materials.brown,.08);box(x,.51,19,1.45,.03,1.15,mat(0x544837));for(let k=0;k<7;k++){const a=k*2.4;oval(x+Math.cos(a)*.5,.7,19+Math.sin(a)*.35,.4,.4,.4,mat(0x528650));cylinder(x+Math.cos(a)*.5,.93,19+Math.sin(a)*.35,.09,.08,.12,mat(k%2?0xe6ba67:0xbe7994))}}
for(const x of [-12,-4,4,12]){cylinder(x,.55,19.7,.06,.08,1.1,materials.dark);soft(x,1.15,19.7,.28,.3,.28,mat(0xffe4a0),.04)}
for(let x=-17;x<=17;x+=2){box(x,.5,20,.09,1,.09,materials.brown);if(x<17){box(x+1,.7,20,2,.08,.08,materials.brown);box(x+1,.3,20,2,.08,.08,materials.brown)}}
// Indicadores visuales locales derivados del mismo estado compartido.
function makeReaction(){
 const ring=new THREE.Mesh(new THREE.RingGeometry(.68,.73,64),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.5,side:THREE.DoubleSide,depthWrite:false}));
 ring.rotation.x=-Math.PI/2;ring.position.y=.08;ring.visible=false;
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const icon=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false}));
 icon.scale.set(.8,.8,1);icon.position.set(1.1,3.35,0);icon.renderOrder=4;icon.visible=false;
 const halo=new THREE.Mesh(new THREE.RingGeometry(.45,.68,64),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.12,side:THREE.DoubleSide,depthWrite:false}));ring.add(halo);
 return {halo,ring,icon,canvas,texture,last:''};
}
function setReaction(effect,kind){
 if(effect.last===kind)return;effect.last=kind;
 if(!kind){effect.ring.visible=false;effect.icon.visible=false;return}
 const styles={urgent:['!',0xffa236],conflict:['⚡',0xf26661],social:['•••',0x67cfff],good:['♥',0xf687b3],sleep:['Zzz',0x91a9f6]};
 const [symbol,color]=styles[kind];effect.ring.material.color.setHex(color);effect.halo.material.color.setHex(color);effect.ring.visible=true;effect.icon.visible=true;
 const c=effect.canvas,ctx=c.getContext('2d');ctx.clearRect(0,0,256,256);
 const tint='#'+color.toString(16).padStart(6,'0');
 ctx.shadowColor=tint;ctx.shadowBlur=24;ctx.fillStyle='#142334';ctx.beginPath();ctx.roundRect(32,35,192,165,48);ctx.fill();ctx.shadowBlur=0;
 ctx.beginPath();ctx.moveTo(85,197);ctx.lineTo(76,225);ctx.lineTo(118,198);ctx.fill();
 ctx.strokeStyle=tint;ctx.lineWidth=7;ctx.beginPath();ctx.roundRect(32,35,192,165,48);ctx.stroke();
 ctx.fillStyle=tint;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold '+(symbol.length>1?76:120)+'px system-ui, sans-serif';ctx.fillText(symbol,128,121);
 effect.texture.needsUpdate=true;
}
const colors=[0xf08b76,0x6da5c9,0xbb93c7,0xe3b66a,0x84b699,0xd18aaf,0x819bcc,0xe9a37a,0x9dbb71,0xb58dc4,0xd5a264,0x6caeb0,0xca8c82,0xc6a6d6];const people=[];
const faces={Pablo:'pablo-recortada',Snow:'snow-recortada',David:'david-recortada',Linkal:'linkal-recortada',Catalán:'catalan-recortada',Yaiza:'yaiza-recortada',May:'may-recortada',Mei:'mei-recortada',Arian:'arian',Delos:'delos',Lolo:'lolo',Eric:'eric',Adrián:'adrian',Aisuke:'aisuke'};const loader=new THREE.TextureLoader();
roomPositions.forEach((room,i)=>{const g=new THREE.Group(),rig=createMii({color:colors[i],longHair:['May','Yaiza'].includes(room.name),faceUrl:faces[room.name]?'./caras/'+faces[room.name]+'.png':null}),avatar=rig.root;g.add(avatar);const tag=new THREE.Sprite(new THREE.SpriteMaterial({map:labelTexture(room.name,72,256),transparent:true,depthTest:false,depthWrite:false}));tag.scale.set(2.4,1.2,1);tag.position.set(0,2.6,0);tag.renderOrder=2;g.add(tag);scene.add(g);g.position.set(room.x,0,room.z);const reaction=makeReaction();g.add(reaction.ring,reaction.icon);people.push({g,avatar,tag,rig,chair:{x:room.x+.05,z:room.z-1.7},bed:{x:room.bedX,z:room.bedZ},reaction,name:room.name,phase:i*.8,initial:{x:room.x,z:room.z}});});
// Una pulsación breve selecciona; arrastrar sigue controlando la cámara.
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let press=null;
renderer.domElement.addEventListener('pointerdown',e=>{press=e.button===0?{x:e.clientX,y:e.clientY,id:e.pointerId}:null});
renderer.domElement.addEventListener('pointercancel',()=>{press=null});
renderer.domElement.addEventListener('pointerup',e=>{
 if(!press||press.id!==e.pointerId||Math.hypot(e.clientX-press.x,e.clientY-press.y)>5){press=null;return}press=null;
 const rect=renderer.domElement.getBoundingClientRect();if(!rect.width||!rect.height)return;
 pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
 raycaster.setFromCamera(pointer,camera);
 const targets=people.flatMap(p=>[p.avatar,p.tag]);
 const hit=raycaster.intersectObjects(targets,true)[0];if(!hit)return;
 let object=hit.object;while(object&&!people.some(p=>p.g===object))object=object.parent;
 const person=people.find(p=>p.g===object);if(person)window.dispatchEvent(new CustomEvent('resident-select',{detail:{name:person.name}}));
});
// La ruta y sus tiempos vienen del servidor; cada navegador interpola el mismo recorrido.
let snapshot=null,clockBase=0,wallBase=0,receivedAt=0,clockRate=48,reactions=new Map();
function acceptWorld(detail){
 snapshot=detail.world;clockBase=detail.serverTime;wallBase=detail.serverWallTime??Date.now();receivedAt=performance.now();clockRate=detail.clockRate||48;
 const byName=new Map(snapshot.people.map(person=>[person.name,person]));
 const kinds={conversation_started:'social',conversation_finished:'social',kitchen_wait:'conflict',conflict_incident:'conflict',plan_missed:'conflict',agreement_broken:'conflict',plan_completed:'good',plan_started:'social',repair_declined:'conflict',repair_accepted:'good',agreement_fulfilled:'good',romance_accepted:'good',relationship_ended:'conflict',activity_interrupted:'urgent'};
 reactions=new Map();
 for(const e of snapshot.events??[]){const kind=kinds[e.type];if(!kind||(e.type==='activity_interrupted'&&e.reason!=='necesidad urgente'))continue;
  for(const id of new Set([e.personId,...(e.participants??[])].filter(Boolean)))reactions.set(id,{kind,at:e.at});
 }
 // Los bocadillos se actualizan por fotograma a partir del reloj compartido.

}
window.addEventListener('shared-world',event=>acceptWorld(event.detail));
if(window.sharedWorld)acceptWorld(window.sharedWorld);
const projectedSpeech=new THREE.Vector3();
const renderSpeech=createSpeechOverlay(root,people,anchor=>
 projectedSpeech.set(anchor.x,anchor.y,anchor.z).project(camera));
function positionAt(action,fallback,now){
 const meal=mealPosition(action,now);if(meal)return meal;
 const route=action?.route;if(!route?.length)return fallback;
 if(route.length===1||!action.travelMs)return route[route.length-1];
 const lengths=[],total=route.slice(1).reduce((sum,p,i)=>{const d=Math.hypot(p.x-route[i].x,p.z-route[i].z);lengths.push(d);return sum+d},0);
 if(total===0)return route[route.length-1];
 let left=total*Math.max(0,Math.min(1,(now-action.start)/action.travelMs));
 for(let i=0;i<lengths.length;i++){if(left<=lengths[i]&&lengths[i]>0){const a=route[i],b=route[i+1],q=left/lengths[i];return {x:a.x+(b.x-a.x)*q,z:a.z+(b.z-a.z)*q,angle:Math.atan2(b.x-a.x,b.z-a.z),walking:now<action.start+action.travelMs}}left-=lengths[i]}
 return route[route.length-1];
}
function resize(){const w=root.clientWidth,h=root.clientHeight;renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,2.5));renderer.setSize(w,h);const aspect=w/h;camera.left=-18*aspect;camera.right=18*aspect;camera.top=18;camera.bottom=-18;camera.updateProjectionMatrix()}window.addEventListener('resize',resize);resize();
let followName=null;const followTarget=new THREE.Vector3(),followDelta=new THREE.Vector3();
window.addEventListener('resident-follow',event=>{followName=event.detail.name;});
let lastFrame=0;
function animate(t){requestAnimationFrame(animate);const frameSeconds=lastFrame?Math.min(.05,(t-lastFrame)/1000):0;lastFrame=t;let now=0;if(snapshot){const byName=new Map(snapshot.people.map(p=>[p.name,p]));now=snapshot.simulationClock?simulationTime(snapshot.simulationClock,wallBase+performance.now()-receivedAt):clockBase+(performance.now()-receivedAt)*clockRate;clockRate=snapshot.simulationClock?clockRateAt(snapshot.simulationClock,now):clockRate;const hour=new Date(now).getUTCHours(),night=hour<7||hour>=23;scene.background.setHex(night?0x253952:0xb8d99c);ambient.intensity=night?.8:2;sun.intensity=night?.65:2;const placements=[];for(const p of people){const state=byName.get(p.name);if(!state)continue;
 const latest=reactions.get(state.id),age=latest?now-latest.at:Infinity;
 const signal=latest&&age>=0&&age<clockRate*10000?latest.kind:(state.action?.id==='dormir'&&now>=state.action.start+(state.action.travelMs||0)?'sleep':null);
 setReaction(p.reaction,signal);
 if(signal){const pulse=.9+.1*Math.sin(t*.006+p.phase);p.reaction.ring.scale.setScalar(pulse);p.reaction.ring.material.opacity=.30+.12*(1+Math.sin(t*.006+p.phase));p.reaction.icon.position.y=3.35+Math.sin(t*.002+p.phase)*.08}
 const conversation=state.action?.conversationId&&snapshot.conversations?.[state.action.conversationId];
 if(conversation&&now>=conversation.start&&now<conversation.end)p.reaction.icon.visible=false;
 const where=positionAt(state.action,state.position??p.initial,now);
 // Pequeños desplazamientos compartidos durante actividades despiertas.
 const action=state.action,awake=action&&action.id!=='dormir';
 const arrived=action&&now>=action.start+(action.travelMs||0);
 const training=['gimnasio','gym'].includes(action?.activity)&&arrived;
 const stage=mealStage(action,now),mealEating=stage?.kind==='eating';
 const sofaSeated=Boolean(arrived&&action?.seat);
 const seated=(arrived&&['jugar','estudiar'].includes(action?.id))||mealEating||sofaSeated;
 const cycle=awake&&arrived&&!seated&&!training&&!['comer','fumar'].includes(action.id)?(((now-action.start)/clockRate+p.phase*1000)%16000)/16000:0;
 const excursion=cycle<.25?cycle*4:cycle<.5?2-cycle*4:0;
 const sway=0; // Sin paseos laterales artificiales durante actividades quietas.
 // La postura sigue el momento de llegada calculado por el servidor.
 const sleeping=action?.id==='dormir'&&arrived;
 const lie=sleeping?Math.max(0,Math.min(1,(now-(action.start+(action.travelMs||0)))/(clockRate*2000))):0;
 const seatStart=mealEating?stage.start:action?.start+(action?.travelMs||0);
 const seatBlend=seated?Math.max(0,Math.min(1,(now-seatStart)/(clockRate*1200))):0;
 const seat=mealEating?action.meal.seat:sofaSeated?action.seat:p.chair;
 const x=where.x+(p.bed.x-where.x)*lie+(seat.x-where.x)*seatBlend+sway,z=where.z+(p.bed.z-where.z)*lie+(seat.z-where.z)*seatBlend;
 const bob=0;
 placements.push({p,x,z,bob,fixed:!!sleeping||!!seated,walking:!!where.walking});
 if(sleeping)p.g.rotation.y=0;else if(mealEating)p.g.rotation.y=Math.PI/2;else if(seated)p.g.rotation.y=Math.PI;else if(['fridge','cooking'].includes(stage?.kind)||(arrived&&(['asearse','limpiar'].includes(action?.id)||action?.activity==='cooking')))p.g.rotation.y=0;else if(conversation&&!training){
  const other=snapshot.people.find(q=>q.id!==state.id&&conversation.participants.includes(q.id));
  const target=other?.action?.route?.at(-1);
  if(target)p.g.rotation.y=Math.atan2(target.x-where.x,target.z-where.z);
 }else if(where.angle!==undefined)p.g.rotation.y=where.angle;else if(sway>0)p.g.rotation.y=cycle<.25?Math.PI/2:-Math.PI/2;
 p.avatar.position.set(0,1.06*lie-.18*seatBlend,.9*lie);p.avatar.rotation.x=-Math.PI/2*lie;p.avatar.scale.setScalar(1-.22*lie);p.rig.setSleeping(lie);
 const eating=action?.id==='comer'&&(mealEating||(!stage&&arrived&&now>=action.start+(action.travelMs||0)+(action.meal?.prepareMs||0)));
 const anim=sleeping?'idle':where.walking?'walk':arrived&&action?.id==='asearse'?'wash':stage?.kind==='fridge'?'reach':stage?.kind==='cooking'?'cook':training?'gym':action?.activity==='cooking'?'cook':action?.activity==='games'?'gamepad':action?.id==='charlar'&&!sofaSeated?'talk':arrived&&action?.id==='limpiar'?'clean':arrived&&action?.id==='leer'?'read':action?.id==='fumar'&&arrived?'smoke':mealEating?'eat':sofaSeated?'sit':seated?(action.id==='estudiar'?'study':'computer'):eating?'eatStanding':'idle';
 p.rig.play(anim);

 }
 for(const spot of separatePeople(placements,isWalkable)){
  const p=spot.p,previous=p.previousRendered;
  const distance=previous?Math.hypot(spot.x-previous.x,spot.z-previous.z):0;
  const speed=frameSeconds>0?Math.min(1.5,distance/frameSeconds):0;
  p.rig.mixer.timeScale=1;
  p.rig.update(frameSeconds,spot.walking?Math.min(distance,.1):0);
  p.g.position.set(spot.x,spot.bob,spot.z);
  p.previousRendered={x:spot.x,z:spot.z};
 }
 }
 // Separar nombres en pantalla sin mover a los vecinos.
 const occupied=[];camera.updateMatrixWorld();
 function placeOverlay(p,sprite,height,width,visibleHeight){
  sprite.position.y=height;
  p.g.updateMatrixWorld(true);
  const project=()=>sprite.getWorldPosition(new THREE.Vector3()).project(camera);
  let pos=project(),up=sprite.getWorldPosition(new THREE.Vector3());
  up.y+=1;up.project(camera);
  const perUnit=Math.abs(up.y-pos.y)||.001;
  const halfW=width*camera.zoom/(camera.right-camera.left);
  const halfH=visibleHeight*camera.zoom/(camera.top-camera.bottom);
  for(let pass=0;pass<occupied.length;pass++){
   const overlap=occupied.find(r=>Math.abs(pos.x-r.x)<halfW+r.w&&Math.abs(pos.y-r.y)<halfH+r.h);
   if(!overlap)break;
   sprite.position.y+=(overlap.y+overlap.h+halfH-pos.y+.02)/perUnit;
   p.g.updateMatrixWorld(true);pos=project();
  }
  occupied.push({x:pos.x,y:pos.y,w:halfW,h:halfH});
 }
 for(const p of people)placeOverlay(p,p.tag,2.6,Math.min(2.4,.29*p.name.length),.56);
 if(followName){const target=people.find(p=>p.name===followName);if(target){followTarget.set(target.g.position.x,.8,target.g.position.z);followDelta.copy(followTarget).sub(controls.target).multiplyScalar(Math.min(1,frameSeconds*5));controls.target.add(followDelta);camera.position.add(followDelta)}}
 controls.update();
 camera.updateMatrixWorld();
 renderSpeech(snapshot,now,end=>snapshot.simulationClock
  ?realElapsed(snapshot.simulationClock,end,now):(now-end)/clockRate);
 renderer.render(scene,camera);
}
requestAnimationFrame(animate);








