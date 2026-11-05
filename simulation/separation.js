// Separación visual determinista: las acciones siguen siendo las del mundo compartido.
export function separatePeople(input, walkable, minDistance=0.85){
 const points=input.map(p=>({...p}));
 const move=(p,dx,dz)=>{
  if(p.fixed)return false;
  const x=p.x+dx,z=p.z+dz;
  if(!walkable(x,z))return false;
  p.x=x;p.z=z;return true;
 };
 for(let pass=0;pass<16;pass++){
  let changed=false;
  for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
   const a=points[i],b=points[j],dx=b.x-a.x,dz=b.z-a.z,dist=Math.hypot(dx,dz);
   if(dist>=minDistance-0.001||a.fixed&&b.fixed)continue;
   // Si coinciden exactamente, el orden estable decide una dirección.
   const angle=dist>1e-6?Math.atan2(dz,dx):(i*2.4+j*1.7);
   const gap=minDistance-dist+.002;
   for(const turn of [0,Math.PI/4,-Math.PI/4,Math.PI/2,-Math.PI/2,Math.PI]){
    const ux=Math.cos(angle+turn),uz=Math.sin(angle+turn);
    const before=Math.hypot(b.x-a.x,b.z-a.z);
    const ax=a.x,az=a.z,bx=b.x,bz=b.z;
    const movedA=move(a,-ux*gap*(b.fixed?1:.5),-uz*gap*(b.fixed?1:.5));
    const movedB=move(b,ux*gap*(a.fixed?1:(movedA?.5:1)),uz*gap*(a.fixed?1:(movedA?.5:1)));
    if(!movedB&&movedA)move(a,-ux*gap*.5,-uz*gap*.5);
    if(Math.hypot(b.x-a.x,b.z-a.z)>before+0.00001){changed=true;break}
    a.x=ax;a.z=az;b.x=bx;b.z=bz;
   }
  }
  if(!changed)break;
 }
 return points;
}
