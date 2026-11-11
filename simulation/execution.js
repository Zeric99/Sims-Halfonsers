import { mealStage } from './meal-stage.js';
// Estado derivado del reloj compartido: no modifica ni decide acciones.
export function executionState(action,at){
 if(!Number.isFinite(at))throw new RangeError('Hora inválida');
 if(!action)return 'IDLE';
 const stage=mealStage(action,at);if(stage)return stage.kind.startsWith('to_')?'MOVING':'ACTING';
 if(at<action.start+(action.travelMs||0))return 'MOVING';
 if(action.planId&&action.id==='pasear')return 'WAITING';
 if(action.id==='esperar')return 'WAITING';
 if(action.id==='dormir')return 'SLEEPING';
 return 'ACTING';
}
