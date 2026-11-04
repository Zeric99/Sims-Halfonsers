import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
const root=document.querySelector('#world');
const scene=new THREE.Scene();scene.background=new THREE.Color(0xb8d99c);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;root.prepend(renderer.domElement);document.querySelector('#loading').remove();
const camera=new THREE.OrthographicCamera(-22,22,16,-16,.1,200);camera.position.set(30,38,40);camera.lookAt(0,0,0);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,0,1);controls.enablePan=false;controls.minZoom=.7;controls.maxZoom=2.4;controls.maxPolarAngle=Math.PI/2.4;controls.update();
scene.add(new THREE.HemisphereLight(0xffffff,0x6c8061,2));const sun=new THREE.DirectionalLight(0xfff3d8,2);sun.position.set(-15,35,20);scene.add(sun);
const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.85});const materials={grass:mat(0x98c77a),wood:mat(0xe1bd8d),tile:mat(0xdbe6d6),wall:mat(0xbba587),white:mat(0xf8f3e8),blanket:mat(0x7bad9f),brown:mat(0x997054),dark:mat(0x425e50),garden:mat(0x7ab85f)};
const obstacles=[];
function box(x,y,z,w,h,d,m){if(h>.3 && y-h/2<.26 && w<39 && d<37)obstacles.push({x,z,w,d});const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;scene.add(o);return o}
function label(text,x,y,z,color='#294036',scale=1){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='rgba(255,250,232,.91)';ctx.roundRect(10,20,492,86,28);ctx.fill();ctx.fillStyle=color;ctx.font='bold 42px system-ui';ctx.textAlign='center';ctx.fillText(text,256,78);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthTest:false}));s.scale.set(3.6*scale,.9*scale,1);s.position.set(x,y,z);scene.add(s)}
box(0,-.22,1,39,.4,37,materials.grass);box(0,.01,0,4,.12,26,materials.wall);for(let z=-11;z<13;z+=2)box(0,.08,z,3.9,.03,.04,materials.white);
function bed(x,z){box(x,.27,z,1.15,.4,1.75,materials.brown);box(x,.52,z,1.03,.17,1.6,materials.white);box(x,.64,z+.25,1.02,.12,1.02,materials.blanket);box(x,.66,z-.48,.8,.12,.35,materials.white)}
function flat(cx,cz,n,title,names){const x0=cx-7,z0=cz-6;box(cx,.03,cz,14,.15,12,materials.wood); // cutaway low walls
box(cx,.45,z0,14,.8,.12,materials.wall);for(const side of [-1,1]){const wx=cx+side*7;if((cx<0&&side===1)||(cx>0&&side===-1)){box(wx,.45,cz-4,.12,.8,4,materials.wall);box(wx,.45,cz+3,.12,.8,6,materials.wall)}else box(wx,.45,cz,.12,.8,12,materials.wall)}
const rooms=[[x0,z0],[x0+3.5,z0],[x0+7,z0],[x0+10.5,z0]];
for(let i=0;i<n;i++){let [x,z]=rooms[i];box(x+1.75,.11,z+2.5,3.45,.08,4.9,materials.wood);bed(x+1.15,z+2.4);box(x+2.7,.4,z+1.1,.8,.65,.7,materials.brown);box(x+3.5,.55,z+2.45,.12,1.0,4.9,materials.wall);roomPositions.push({name:names[i],x:x+2.5,z:z+3.7});
// Escritorio, silla, monitor y accesorios individuales.
box(x+2.55,.60,z+1.12,1.35,.12,.75,materials.brown);for(const dx of [-.55,.55])box(x+2.55+dx,.3,z+1.12,.1,.6,.65,materials.brown);
box(x+2.55,1.05,z+.84,.85,.58,.08,mat(0x344a50));box(x+2.55,1.05,z+.79,.72,.43,.02,mat(0x77b5b6));box(x+2.55,.48,z+2.0,.6,.13,.6,materials.dark);box(x+2.55,.78,z+2.27,.6,.65,.12,materials.dark);
const hobbies={Eric:'camera',Aisuke:'gym',Snow:'camera',Adrián:'gym',Arian:'screen',Delos:'music',Linkal:'gym',Catalán:'ball',May:'screen',Mei:'art',Pablo:'screen',Lolo:'screen',David:'screen',Yaiza:'study'};
const hobby=hobbies[names[i]];
if(hobby==='camera'){box(x+2.85,.76,z+1.2,.35,.22,.2,mat(0x303d3b));let lens=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.12,12),mat(0x91b7b4));lens.rotation.x=Math.PI/2;lens.position.set(x+2.85,.76,z+1.32);scene.add(lens)}
if(hobby==='gym'){box(x+2.75,.2,z+3.1,.65,.08,.09,mat(0x4c5150));for(const dx of [-.28,.28])box(x+2.75+dx,.2,z+3.1,.15,.25,.25,mat(0x59615e))}
if(hobby==='art'){box(x+2.9,.72,z+1.15,.35,.04,.3,mat(0xfbf4d3));box(x+2.85,.76,z+1.1,.05,.04,.3,mat(0xc16b78))}
if(hobby==='music'){box(x+2.9,.78,z+1.12,.25,.35,.22,mat(0x414348));box(x+2.9,.79,z+1,.12,.12,.02,mat(0xcac9ae))}
if(hobby==='study'){for(let k=0;k<3;k++)box(x+2.86,.73+k*.1,z+1.16,.4,.09,.27,mat([0x91a9bb,0xd09b87,0xd9c58a][k]))}
if(hobby==='ball'){let b=new THREE.Mesh(new THREE.SphereGeometry(.2,12,10),mat(0xf6f2dc));b.position.set(x+2.8,.25,z+3.1);scene.add(b)}
label(names[i],x+1.75,2.1,z+4.35,'#304334',.58)}
box(cx-3.5,.1,cz+3,6.9,.06,5.8,materials.tile);for(let i=0;i<3;i++)box(x0+.7+i*1.3,.55,cz+4.7,1.2,1,.8,materials.white);box(cx-2.5,.9,cz+4.7,.8,.2,.6,materials.dark);
// Electrodomésticos, encimera y vajilla en cada vivienda.
box(x0+4.9,1.0,cz+4.7,1.1,1.9,.9,mat(0xe8ebe3));box(x0+.8,1.1,cz+5.0,.45,.45,.08,mat(0x607c76));
for(let k=0;k<3;k++)box(x0+2.5+k*.3,1.09,cz+4.7,.16,.06,.16,mat(0x465953));
box(cx+3.5,.38,cz+3,2.3,.55,1.3,materials.brown);
for(let dx of [-.6,.6]){let plate=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.035,16),materials.white);plate.position.set(cx+3.5+dx,.69,cz+3);scene.add(plate)}for(let dx of [-1.6,1.6])for(let dz of [-.6,.6])box(cx+3.5+dx,.28,cz+3+dz,.5,.5,.5,materials.dark);label(title,cx,2.4,z0+.5,'#25402f',.8)}
const roomPositions=[];
const groups=[['Eric','Linkal','Mei','Yaiza'],['Snow','Adrián','Arian','Lolo'],['Delos','May','Pablo'],['Aisuke','Catalán','David']];flat(-10,-7,4,'PISO 1',groups[0]);flat(10,-7,4,'PISO 2',groups[1]);flat(-10,7,3,'PISO 3',groups[2]);flat(10,7,3,'PISO 4',groups[3]);
box(0,.05,17,36,.13,7,materials.garden);label('JARDÍN COMUNITARIO',0,1,18,'#2d5030',1);function tree(x,z){box(x,.8,z,.45,1.6,.45,materials.brown);let crown=new THREE.Mesh(new THREE.SphereGeometry(1.1,10,8),mat(0x4d9852));crown.position.set(x,2,z);scene.add(crown)}tree(-14,17);tree(14,17);tree(-17,14);tree(17,14);
for(let i=0;i<12;i++){const flower=new THREE.Mesh(new THREE.SphereGeometry(.13,8,6),mat(i%2?0xf8d479:0xe69b9c));flower.position.set(-11+i*2,.24,18.5+Math.sin(i)*.5);scene.add(flower)}box(6,.5,16,2.5,.25,.7,materials.brown);box(-6,.4,17,2, .7,1.4,materials.brown);
const colors=[0xf08b76,0x6da5c9,0xbb93c7,0xe3b66a,0x84b699,0xd18aaf,0x819bcc,0xe9a37a,0x9dbb71,0xb58dc4,0xd5a264,0x6caeb0,0xca8c82,0xc6a6d6];const people=[];
const faces={Arian:'arian',Delos:'delos',Lolo:'lolo',Eric:'eric',Adrián:'adrian',Aisuke:'aisuke'};const loader=new THREE.TextureLoader();
roomPositions.forEach((room,i)=>{const g=new THREE.Group();const cloth=mat(colors[i]);let body=new THREE.Mesh(new THREE.CapsuleGeometry(.26,.46,4,10),cloth);body.position.y=.72;g.add(body);let head=new THREE.Mesh(new THREE.SphereGeometry(.43,16,12),mat(0xe8b899));head.position.y=1.38;if(!faces[room.name])g.add(head);let hair=new THREE.Mesh(new THREE.SphereGeometry(.435,16,12,0,Math.PI*2,0,Math.PI*.48),mat(0x49372e));hair.position.y=1.4;if(!faces[room.name])g.add(hair);else {const texture=loader.load('./caras/'+faces[room.name]+'.png',undefined,undefined,()=>{g.add(head);g.add(hair)});texture.colorSpace=THREE.SRGBColorSpace;const face=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));face.scale.set(1.15,1.15,1);face.position.set(0,1.48,.1);g.add(face)}for(const side of [-1,1]){let eye=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),mat(0x302b28));eye.position.set(side*.14,1.4,.4);if(!faces[room.name])g.add(eye);let arm=new THREE.Mesh(new THREE.CapsuleGeometry(.075,.32,4,8),cloth);arm.position.set(side*.34,.73,0);arm.rotation.z=side*.18;g.add(arm);let leg=new THREE.Mesh(new THREE.CapsuleGeometry(.1,.28,4,8),mat(0x515b68));leg.position.set(side*.14,.25,0);g.add(leg)}scene.add(g);g.position.set(room.x,0,room.z);people.push({g,phase:i*.8,route:[],wait:Math.random()*3,speed:.9+Math.random()*.35,walk:0});});
// Navigation grid: furniture and walls are obstacles; door gaps connect the flats.
const gridStep=.5, minX=-19, minZ=-16, cols=77, rows=73;
const blocked=new Uint8Array(cols*rows);
for(let z=0;z<rows;z++)for(let x=0;x<cols;x++){const wx=minX+x*gridStep,wz=minZ+z*gridStep;blocked[z*cols+x]=obstacles.some(o=>Math.abs(wx-o.x)<o.w/2+.24&&Math.abs(wz-o.z)<o.d/2+.24)?1:0}
const indexOf=(x,z)=>Math.max(0,Math.min(rows-1,Math.round((z-minZ)/gridStep)))*cols+Math.max(0,Math.min(cols-1,Math.round((x-minX)/gridStep)));
function nearestOpen(id){if(!blocked[id])return id;const x=id%cols,z=Math.floor(id/cols);for(let r=1;r<8;r++)for(let dz=-r;dz<=r;dz++)for(let dx=-r;dx<=r;dx++){const nx=x+dx,nz=z+dz;if(nx>=0&&nx<cols&&nz>=0&&nz<rows&&!blocked[nz*cols+nx])return nz*cols+nx}return id}
function path(start,end){start=nearestOpen(start);end=nearestOpen(end);const queue=[start],prev=new Int32Array(cols*rows).fill(-1);prev[start]=start;let q=0;while(q<queue.length&&prev[end]<0){const v=queue[q++],x=v%cols,z=Math.floor(v/cols);for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz;if(nx<0||nx>=cols||nz<0||nz>=rows)continue;const n=nz*cols+nx;if(!blocked[n]&&prev[n]<0){prev[n]=v;queue.push(n)}}}if(prev[end]<0)return [];const cells=[];for(let v=end;v!==start;v=prev[v])cells.push(v);cells.reverse();return cells.map(v=>({x:minX+(v%cols)*gridStep,z:minZ+Math.floor(v/cols)*gridStep}))}
// Pick destinations in communal corridors, kitchens, and garden; alternate with resting.
const destinations=[[-1,0],[1,-8],[0,8],[-10,-7],[10,-7],[-10,7],[10,7],[-9,15],[0,16],[9,15],[-14,17],[14,17]];
function chooseRoute(p){for(let i=0;i<12;i++){const target=destinations[Math.floor(Math.random()*destinations.length)];const route=path(indexOf(p.g.position.x,p.g.position.z),indexOf(target[0]+(Math.random()-.5),target[1]+(Math.random()-.5)));if(route.length){p.route=route;return}}p.wait=2}
function resize(){const w=root.clientWidth,h=root.clientHeight;renderer.setSize(w,h);const aspect=w/h;camera.left=-18*aspect;camera.right=18*aspect;camera.top=18;camera.bottom=-18;camera.updateProjectionMatrix()}window.addEventListener('resize',resize);resize();let last=0;function animate(t){requestAnimationFrame(animate);const dt=last?Math.min((t-last)/1000,.05):0;last=t;for(const p of people){if(p.wait>0){p.wait-=dt;p.g.position.y=0;continue}if(!p.route.length){chooseRoute(p);continue}const target=p.route[0],dx=target.x-p.g.position.x,dz=target.z-p.g.position.z,dist=Math.hypot(dx,dz),step=p.speed*dt;if(dist<=step){p.g.position.x=target.x;p.g.position.z=target.z;p.route.shift();if(!p.route.length)p.wait=2+Math.random()*5}else{p.g.position.x+=dx/dist*step;p.g.position.z+=dz/dist*step;p.g.rotation.y=Math.atan2(dx,dz);p.walk+=dt*8;p.g.position.y=Math.abs(Math.sin(p.walk))*.055}}controls.update();renderer.render(scene,camera)}requestAnimationFrame(animate);

