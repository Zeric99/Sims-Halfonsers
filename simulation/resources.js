export function freeResource(world,base,at,capacity=1){
 if(capacity===1)return world.reservations[base]?.until>at?null:base;
 if(world.reservations[base]?.until>at)return null; // Reserva antigua de sofá completo.
 for(let slot=0;slot<capacity;slot++){const key=base+':'+slot;if(!(world.reservations[key]?.until>at))return key}
 return null;
}
