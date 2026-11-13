import * as THREE from 'three';
import {bedroomArt} from './bedroom-art.js';

const bedrooms={
 Eric: ['#365876','#adc9d8','stripe'],
 Linkal: ['#536549','#c4c597','check'],
 Mei: ['#b477b0','#f1c2dc','petal'],
 Yaiza: ['#db89a8','#ffe1e9','stripe'],
 Snow: ['#789dac','#e8f2f5','dot'],
 'Adrián': ['#b56b4d','#f6c998','chevron'],
 Arian: ['#466e6f','#bfe0c9','diamond'],
 Lolo: ['#c99445','#fff1ba','check'],
 Delos: ['#783f4d','#e5a09f','stripe'],
 May: ['#71549e','#e6a5db','diamond'],
 Pablo: ['#52668d','#c1bde2','chevron'],
 Aisuke: ['#454f5e','#f1ab70','check'],
 'Catalán': ['#983d37','#f0d3ae','diamond'],
 David: ['#438074','#b0e5cf','dot']
};

function fabricTexture(base,accent,pattern){
 const canvas=document.createElement('canvas');
 canvas.width=canvas.height=128;
 const ctx=canvas.getContext('2d');
 ctx.fillStyle=base;
 ctx.fillRect(0,0,128,128);
 ctx.strokeStyle=ctx.fillStyle=accent;
 ctx.lineWidth=3;
 if(pattern==='stripe'||pattern==='check'){
  for(let offset=10;offset<128;offset+=24){
   ctx.fillRect(0,offset,128,5);
   if(pattern==='check'){ctx.globalAlpha=.46;ctx.fillRect(offset,0,5,128);ctx.globalAlpha=1;}
  }
 }else if(pattern==='chevron'){
  for(let row=8;row<128;row+=24){
   ctx.beginPath();
   ctx.moveTo(0,row);
   for(let x=16;x<=128;x+=16)ctx.lineTo(x,row+(x%32?9:0));
   ctx.stroke();
  }
 }else{
  for(let row=12;row<128;row+=24)for(let x=12;x<128;x+=24){
   ctx.beginPath();
   if(pattern==='diamond'){
    ctx.moveTo(x,row-7);ctx.lineTo(x+6,row);ctx.lineTo(x,row+7);ctx.lineTo(x-6,row);ctx.closePath();
   }else if(pattern==='petal'){
    for(let i=0;i<4;i++){
     const angle=i*Math.PI/2;
     ctx.moveTo(x+Math.cos(angle)*7,row+Math.sin(angle)*7);
     ctx.ellipse(x+Math.cos(angle)*4,row+Math.sin(angle)*4,3,2,angle,0,Math.PI*2);
    }
   }else ctx.arc(x,row,3,0,Math.PI*2);
   ctx.fill();
  }
 }
 const texture=new THREE.CanvasTexture(canvas);
 texture.colorSpace=THREE.SRGBColorSpace;
 return texture;
}

export function createInteriorDecor(scene,{box,soft,cylinder,mat}){
 const walnut=mat(0x644733),paper=mat(0xf6ecd6),metal=mat(0xb3945e);
 function textile(x,y,z,width,depth,texture){
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,depth),
   new THREE.MeshStandardMaterial({map:texture,roughness:.96}));
  mesh.rotation.x=-Math.PI/2;
  mesh.position.set(x,y,z);
  mesh.receiveShadow=true;
  scene.add(mesh);
 }

 function bedroom(name,x,z,bed){
  const [base,accent,pattern]=bedrooms[name];
  bed(x+1.15,z+2.4,mat(base),mat(accent));
  textile(x+1.15,.701,z+2.67,.88,.89,fabricTexture(base,accent,pattern));
  // Alfombra plana a los pies de la cama y un marco en la pared del fondo.
  soft(x+1.12,.163,z+3.66,1.24,.022,1.08,mat(base),.012);
  textile(x+1.12,.176,z+3.66,1.08,.92,fabricTexture(base,accent,'stripe'));
  box(x+1.18,1.06,z+.079,1.08,.76,.075,walnut);
  box(x+1.18,1.06,z+.125,1,.69,.026,paper);
  const picture=new THREE.Mesh(new THREE.PlaneGeometry(.92,.613),
   new THREE.MeshBasicMaterial({map:bedroomArt(name),side:THREE.DoubleSide}));
  picture.position.set(x+1.18,1.06,z+.14);
  scene.add(picture);
  if(name==='Mei'){
   const sketch=box(x+2.13,.69,z+1.23,.29,.026,.24,paper);
   sketch.rotation.y=.17;
   for(const [offset,color] of [[0,0xc76793],[.045,0x7178a6],[.09,0xe4a657]]){
    box(x+2.08+offset,.711,z+1.23,.016,.013,.18,mat(color)).rotation.y=.17;
   }
  }else if(name==='May'){
   const controller=soft(x+2.08,.71,z+1.22,.28,.065,.17,mat(base),.028);
   controller.rotation.y=-.23;
   for(const offset of [-.075,.075]){
    cylinder(x+2.08+offset,.75,z+1.22,.026,.026,.014,mat(accent));
   }
  }else if(name==='Yaiza'){
   cylinder(x+2.08,.795,z+1.22,.075,.08,.26,mat(base));
   cylinder(x+2.08,.94,z+1.22,.047,.057,.036,mat(accent));
  }
 }

 function livingRoom(cx,cz,accent){
  // La consola de TV gana tiradores y un equipo de sonido. Todo cabe sobre el mueble.
  for(const dx of [-.72,.72]){
   box(cx+4.2+dx,.44,cz+3.69,.58,.23,.025,walnut);
   box(cx+4.2+dx,.47,cz+3.713,.15,.023,.025,metal);
  }
  for(const dx of [-.92,.92]){
   soft(cx+4.2+dx,.85,cz+3.49,.16,.26,.16,walnut,.025);
   const cone=cylinder(cx+4.2+dx,.87,cz+3.585,.051,.051,.025,metal);
   cone.rotation.x=Math.PI/2;
  }
  // Cuenco con fruta en un extremo del comedor y mandos en la consola.
  cylinder(cx+2.66,.81,cz+1.59,.16,.085,.095,accent);
  for(const [dx,dz,color] of [[-.056,.04,0xd88741],[.052,.025,0x9baa57],[.005,-.056,0xc65b49]]){
   cylinder(cx+2.66+dx,.88,cz+1.59+dz,.043,.053,.085,mat(color));
  }
  soft(cx+4.75,.724,cz+3.57,.22,.026,.08,walnut,.018).rotation.y=.3;
 }
 return {bedroom,livingRoom};
}
