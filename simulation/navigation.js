// Rejilla doméstica compartida por el motor; coordenadas de la escena Three.js.
const STEP=.5,MIN_X=-18,MIN_Z=-14,COLS=73,ROWS=69;
const obstacles=[];
function obstacle(x,z,w,d){obstacles.push({x,z,w,d})}
for(const [cx,cz] of [[-10,-7],[10,-7],[-10,7],[10,7]]){
 const x0=cx-7,z0=cz-6;
 obstacle(cx,z0,14,.12);
 for(const side of [-1,1]){
  const wx=cx+side*7;
  if((cx<0&&side===1)||(cx>0&&side===-1)){obstacle(wx,cz-4,.12,4);obstacle(wx,cz+3,.12,6)}
  else obstacle(wx,cz,.12,12);
 }
 const n=cz<0?4:3;
 for(let i=0;i<n;i++){
  const x=x0+i*3.5;
  obstacle(x+3.5,z0+2.45,.12,4.9);
  obstacle(x+1.15,z0+2.4,1.15,1.75);
  obstacle(x+2.7,z0+1.1,.8,.7);
  obstacle(x+2.55,z0+1.12,1.35,.75);
  obstacle(x+2.55,z0+2,.6,.6);
 }
 for(let i=0;i<3;i++)obstacle(x0+.7+i*1.3,cz+4.7,1.2,.8);
 obstacle(x0+4.9,cz+4.7,1.1,.9);
 obstacle(cx+.2,cz+4.8,.7,.7);obstacle(cx+1.2,cz+5,.65,.5);
 obstacle(cx+3.5,cz+3,2.3,1.3);
 for(const dx of [-1.6,1.6])for(const dz of [-.6,.6])obstacle(cx+3.5+dx,cz+3+dz,.5,.5);
}
for(const [x,z] of [[-14,17],[14,17],[-17,14],[17,14]])obstacle(x,z,.45,.45);
obstacle(6,16,2.5,.7);obstacle(-6,17,2,1.4);
function floor(x,z){return (Math.abs(x)<=3.1&&z>=-13.5&&z<=14.5)||(z>=13&&z<=20&&Math.abs(x)<=18)||([-10,10].some(cx=>[-7,7].some(cz=>Math.abs(x-cx)<=7&&Math.abs(z-cz)<=6)))}
const blocked=new Uint8Array(COLS*ROWS);
for(let z=0;z<ROWS;z++)for(let x=0;x<COLS;x++){
 const wx=MIN_X+x*STEP,wz=MIN_Z+z*STEP;
 blocked[z*COLS+x]=!floor(wx,wz)||obstacles.some(o=>Math.abs(wx-o.x)<o.w/2+.22&&Math.abs(wz-o.z)<o.d/2+.22)?1:0;
}
const toIndex=p=>Math.max(0,Math.min(ROWS-1,Math.round((p.z-MIN_Z)/STEP)))*COLS+Math.max(0,Math.min(COLS-1,Math.round((p.x-MIN_X)/STEP)));
function nearest(id){if(!blocked[id])return id;let x=id%COLS,z=Math.floor(id/COLS);for(let radius=1;radius<=6;radius++)for(let dz=-radius;dz<=radius;dz++)for(let dx=-radius;dx<=radius;dx++){let nx=x+dx,nz=z+dz;if(nx>=0&&nx<COLS&&nz>=0&&nz<ROWS&&!blocked[nz*COLS+nx])return nz*COLS+nx}return -1}
const point=id=>({x:MIN_X+(id%COLS)*STEP,z:MIN_Z+Math.floor(id/COLS)*STEP});
export function findRoute(from,to){
 let start=nearest(toIndex(from)),end=nearest(toIndex(to));if(start<0||end<0)return [];
 const prev=new Int32Array(COLS*ROWS).fill(-1),queue=new Int32Array(COLS*ROWS);let head=0,tail=0;queue[tail++]=start;prev[start]=start;
 while(head<tail&&prev[end]<0){const id=queue[head++],x=id%COLS,z=Math.floor(id/COLS);for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){let nx=x+dx,nz=z+dz;if(nx<0||nx>=COLS||nz<0||nz>=ROWS)continue;let next=nz*COLS+nx;if(!blocked[next]&&prev[next]<0){prev[next]=id;queue[tail++]=next}}}
 if(prev[end]<0)return [];
 let cells=[];for(let id=end;id!==start;id=prev[id])cells.push(id);cells.push(start);cells.reverse();
 // Mantener solo cambios de dirección, sin recortar esquinas.
 const route=[point(cells[0])];for(let i=1;i<cells.length-1;i++){let ax=cells[i]%COLS-cells[i-1]%COLS,az=Math.floor(cells[i]/COLS)-Math.floor(cells[i-1]/COLS),bx=cells[i+1]%COLS-cells[i]%COLS,bz=Math.floor(cells[i+1]/COLS)-Math.floor(cells[i]/COLS);if(ax!==bx||az!==bz)route.push(point(cells[i]))}
 if(cells.length>1)route.push(point(end));return route;
}
