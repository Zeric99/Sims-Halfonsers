import * as THREE from 'three';

const designs={
 Eric:['#d9b57d','tortoise'],
 Linkal:['#f0dfb6','Pessoa'],
 Mei:['#242031','eva'],
 Yaiza:['#eeb3cb','weights'],
 Snow:['#171d28','bat'],
 'Adrián':['#fffdf5','japan'],
 Arian:['#fffbf3','peru'],
 Lolo:['#293e4b','LOLO'],
 Delos:['#402928','mafia'],
 May:['#352334','NANA'],
 Pablo:['#513c8e','WOW'],
 Aisuke:['#fff2db','japanText'],
 'Catalán':['#174d64','fish'],
 David:['#fffaf2','star']
};

export function bedroomArt(name){
 const [background,design]=designs[name];
 const canvas=document.createElement('canvas');
 canvas.width=384;
 canvas.height=256;
 const ctx=canvas.getContext('2d');
 const rect=(color,x,y,w,h)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h)};
 const ellipse=(color,x,y,rx,ry)=>{
  ctx.fillStyle=color;
  ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();
 };
 const polygon=(color,points,stroke=false)=>{
  ctx.beginPath();
  for(const [i,[x,y]] of points.entries())i?ctx.lineTo(x,y):ctx.moveTo(x,y);
  ctx.closePath();
  if(stroke){ctx.strokeStyle=color;ctx.lineWidth=12;ctx.stroke();}
  else{ctx.fillStyle=color;ctx.fill();}
 };
 const word=(value,color,size,y,font='system-ui')=>{
  ctx.font='bold '+size+'px '+font;
  ctx.fillStyle=color;
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(value,192,y,350);
 };
 rect(background,0,0,384,256);
 switch(design){
  case 'tortoise':
   ellipse('#ab8a55',183,191,155,25);
   for(const x of [119,224])ellipse('#6b7040',x,172,24,28);
   ellipse('#889552',275,138,38,26);
   ellipse('#504733',170,137,106,42);
   ellipse('#88723b',170,122,99,64);
   polygon('#b19a57',[[110,94],[155,72],[193,89],[194,139],[147,164],[109,137]]);
   polygon('#a8914a',[[201,91],[240,100],[260,126],[233,151],[205,137]]);
   ellipse('#272b23',290,133,5,5);
   break;
  case 'weights':
   rect('#f8dce8',24,26,336,204);
   rect('#50456a',94,116,196,24);
   for(const x of [75,109,253,287])rect('#71568a',x,x===109||x===253?64:84,23,x===109||x===253?128:88);
   break;
  case 'bat': {
   ellipse('#f4c94e',192,128,160,89);
   const bat=new Path2D('M 45 127 Q 75 63 153 69 Q 135 100 167 103 L 178 79 L 184 103 L 200 103 L 206 79 L 217 103 Q 249 100 231 69 Q 309 63 339 127 Q 290 118 273 160 Q 252 130 233 178 Q 209 151 192 195 Q 175 151 151 178 Q 132 130 111 160 Q 94 118 45 127 Z');
   ctx.fillStyle='#161922';ctx.fill(bat);
   break;
  }
  case 'japan':
   ellipse('#bc1737',192,128,72,72);
   break;
  case 'peru':
   rect('#ce2438',0,0,128,256);rect('#ce2438',256,0,128,256);
   break;
  case 'star':
   polygon('#274d95',[[192,42],[100,194],[284,194]],true);
   polygon('#274d95',[[192,214],[100,62],[284,62]],true);
   break;
  case 'fish':
   ellipse('#5a9ca5',187,155,157,80);
   polygon('#e29b54',[[126,129],[47,78],[60,129],[47,182]]);
   ellipse('#f1b761',194,129,91,52);
   polygon('#d17a46',[[159,144],[210,141],[172,171]]);
   ellipse('#fbebbb',249,115,13,13);
   ellipse('#193849',252,115,7,7);
   for(const [x,y,r] of [[303,101,8],[327,73,12],[338,42,7]])ellipse('#b9e2de',x,y,r,r);
   break;
  case 'japanText':
   ellipse('#bd263b',192,70,42,42);
   word('Me encanta','#60303b',46,147);
   word('Japón','#342936',67,210);
   break;
  case 'eva':
   ellipse('#514269',192,111,109,94);
   polygon('#9370ca',[[105,63],[165,91],[197,20],[219,86],[271,65],[257,142],[222,185],[163,182],[121,138]]);
   polygon('#352445',[[130,114],[192,131],[252,111],[228,165],[192,181],[155,159]]);
   polygon('#a4ed65',[[135,113],[180,122],[175,134],[143,131]]);
   polygon('#a4ed65',[[205,122],[250,112],[242,132],[209,134]]);
   word('EVANGELION','#f5effb',45,222);
   break;
  case 'mafia':
   ellipse('#6b473c',192,107,110,87);
   polygon('#181a23',[[101,184],[127,140],[172,125],[212,125],[258,141],[283,184]]);
   polygon('#e3c7a1',[[171,129],[211,129],[192,172]]);
   ellipse('#a87b61',192,102,34,37);
   polygon('#1d1b20',[[141,83],[159,45],[218,45],[237,83]]);
   ellipse('#1d1b20',192,86,79,12);
   ellipse('#be484b',224,146,9,9);
   word('MAFIA','#f3d6a7',48,219,'Georgia');
   break;
  case 'Pessoa':
   ctx.strokeStyle='#9b7259';ctx.lineWidth=5;ctx.strokeRect(18,18,348,220);
   word('Pessoa','#352d2b',85,128,'Georgia');
   break;
  case 'NANA':
   ctx.strokeStyle='#df7191';ctx.lineWidth=7;ctx.strokeRect(18,18,348,220);
   word('NANA','#ffcee1',108,128,'Georgia');
   break;
  case 'WOW':
   polygon('#f2bd58',[[20,124],[70,91],[47,43],[126,68],[163,18],[207,64],[301,33],[298,82],[368,105],[320,145],[344,202],[267,184],[221,236],[175,189],[87,216],[91,170]]);
   word('WOW','#402459',102,132);
   break;
  default:
   word(design,'#ffe4a3',107,128);
 }
 const texture=new THREE.CanvasTexture(canvas);
 texture.colorSpace=THREE.SRGBColorSpace;
 return texture;
}
