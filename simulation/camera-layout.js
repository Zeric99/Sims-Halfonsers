export const plot={side:40,x:0,z:2};
export const isometricPolar=Math.acos(1/Math.sqrt(3));

// Encaja los cuatro vértices usando la misma escala horizontal y vertical.
export function overviewZoom(aspect,top=false){
 const half=plot.side/2;
 const width=top?half:half*Math.SQRT2;
 const height=top?half:half*Math.sqrt(2/3);
 return Math.min(18*aspect/(width+1.4),18/(height+1.4));
}
