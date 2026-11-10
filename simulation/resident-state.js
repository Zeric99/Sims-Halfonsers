// Límites del modelo: identidad y perfil de origen no comparten referencias
// con el estado de ejecución ni con el aprendizaje de una partida.
export function createResident({identity,profile},index=0){
 return {...structuredClone(identity),profile:structuredClone(profile),
  needs:{saciedad:65+index%5*4,energia:65+index%4*5,higiene:75,compania:60,diversion:65,bano:75},
  action:null,learned:{skills:{},preferences:{}},memories:[],relationships:{}};
}
export function replaceProfile(person,profile){
 person.profile=structuredClone(profile);
 return person;
}
