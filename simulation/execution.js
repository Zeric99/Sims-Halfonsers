// Estado derivado del reloj compartido: no modifica ni decide acciones.
export function executionState(action,at){
 if(!Number.isFinite(at))throw new RangeError('Hora inválida');
 if(!action)return 'IDLE';
 if(at<action.start+(action.travelMs||0))return 'MOVING';
 if(action.id==='esperar')return 'WAITING';
 if(action.id==='dormir')return 'SLEEPING';
 return 'ACTING';
}
