import {DAY_RATE} from './clock.js';

const loudResidents=new Set(['Eric','Lolo','David']);
export const bathroomRush=person=>person.needs.bano<12;

export function bathroomCall(person,wasTalking){
 if(loudResidents.has(person.name))return '¡Me cago!';
 if(wasTalking)return 'Perdona, tengo que ir al baño.';
 return null;
}

export function bathroomDeparture(action){
 return action.start+(action.bathroomCall?Math.round(DAY_RATE*1250):0);
}
