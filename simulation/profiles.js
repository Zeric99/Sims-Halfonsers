// Datos lúdicos provisionales. No representan rasgos reales de los amigos.
export const PROFILE_VERSION = 1;
export const QUESTIONNAIRE_VERSION = 1;
export const TRAITS = ['sociabilidad','amabilidad','paciencia','orden','curiosidad','constancia','privacidad','sensibilidadRuido','iniciativaSocial'];
const clamp = n => Math.min(1, Math.max(0, n));
export const QUESTION_SCHEMA = Object.freeze({
 prefiereSoledad:[{trait:'privacidad',weight:1},{trait:'sociabilidad',weight:1,inverted:true}],
 disfrutaReuniones:[{trait:'sociabilidad',weight:1},{trait:'privacidad',weight:.5,inverted:true}],
 proponePlanes:[{trait:'iniciativaSocial',weight:1}],
 esperaInvitacion:[{trait:'iniciativaSocial',weight:1,inverted:true}],
 ayudaOtros:[{trait:'amabilidad',weight:1}],
 respondeConCortesia:[{trait:'amabilidad',weight:1},{trait:'paciencia',weight:.5}],
 pierdePaciencia:[{trait:'paciencia',weight:1,inverted:true}],
 toleraDemoras:[{trait:'paciencia',weight:1}],
 ordenHabitacion:[{trait:'orden',weight:1}],
 dejaCosasFuera:[{trait:'orden',weight:1,inverted:true}],
 pruebaCosasNuevas:[{trait:'curiosidad',weight:1}],
 prefiereLoConocido:[{trait:'curiosidad',weight:1,inverted:true}],
 terminaTareas:[{trait:'constancia',weight:1}],
 cambiaDeTarea:[{trait:'constancia',weight:1,inverted:true}],
 necesitaEspacio:[{trait:'privacidad',weight:1}],
 ruidoConcentracion:[{trait:'sensibilidadRuido',weight:1}],
 ruidoNoMolesta:[{trait:'sensibilidadRuido',weight:1,inverted:true}]
});
function isRecord(value){
 return value!=null&&(Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null);
}
export function validateProfile(profile){
 if(!isRecord(profile)||profile.version!==PROFILE_VERSION||!isRecord(profile.traits))
  throw new TypeError('Versión o perfil de personalidad inválido');
 if(TRAITS.some(key=>!Number.isFinite(profile.traits[key])||profile.traits[key]<0||profile.traits[key]>1))
  throw new RangeError('Rasgos de personalidad inválidos');
 if(![profile.wakeHour,profile.sleepHour].every(hour=>Number.isInteger(hour)&&hour>=0&&hour<24)
  ||profile.wakeHour===profile.sleepHour)throw new RangeError('Horario inválido');
 if(!Array.isArray(profile.interests)||profile.interests.some(interest=>typeof interest!=='string'||!interest.trim())
  ||typeof profile.romanceEnabled!=='boolean'||!Array.isArray(profile.romancePartners)
  ||profile.romancePartners.some(id=>typeof id!=='string'||!id))
  throw new TypeError('Preferencias de perfil inválidas');
 return profile;
}

export function profileFromAnswers(answers = {}, previous = {}) {
  if(!isRecord(answers)||Object.keys(answers).some(id=>!Object.hasOwn(QUESTION_SCHEMA,id)))
   throw new TypeError('Respuestas de personalidad inválidas');
  let answered=false;
  const totals = Object.fromEntries(TRAITS.map(t => [t, {sum:0, weight:0}]));
  for (const [id, mappings] of Object.entries(QUESTION_SCHEMA)) {
    const value = answers[id];
    if (value == null) continue;
    if (!Number.isInteger(value) || value < 1 || value > 5) throw new RangeError('Respuesta fuera de escala: ' + id);
    answered=true;
    for (const m of mappings) {
      const normalized = (value - 1) / 4;
      totals[m.trait].sum += (m.inverted ? 1-normalized : normalized) * m.weight;
      totals[m.trait].weight += m.weight;
    }
  }
  const traits = {};
  for (const t of TRAITS) {
    const prior = previous.traits?.[t];
    if (prior != null && (!Number.isFinite(prior) || prior < 0 || prior > 1)) throw new RangeError('Rasgo inválido: ' + t);
    traits[t] = clamp(totals[t].weight ? totals[t].sum/totals[t].weight : (prior ?? .5));
  }
  return validateProfile({version:PROFILE_VERSION, provenance:answered ? 'cuestionario' : (previous.provenance ?? 'provisional'), traits,
    wakeHour: previous.wakeHour ?? 8, sleepHour: previous.sleepHour ?? 23,
    interests: [...(previous.interests ?? [])], romanceEnabled: previous.romanceEnabled ?? false,
    romancePartners: [...(previous.romancePartners ?? [])]});
}
// Contrato de datos para el cuestionario futuro.
export function profileFromQuestionnaire(submission,previous){
 if(!isRecord(submission)||submission.version!==QUESTIONNAIRE_VERSION)
  throw new RangeError('Versión de cuestionario no compatible');
 const answers=submission.answers===undefined?{}:submission.answers;
 const profile=profileFromAnswers(answers,previous);
 return {...profile,questionnaireVersion:QUESTIONNAIRE_VERSION};
}

export const residents = [
 ['Eric',['fotografía','ordenador']],['Linkal',['gimnasio','política']],['Mei',['dibujar','ordenador']],
 ['Yaiza',['gimnasio','estudio']],['Snow',['anime','fotografía']],['Adrián',['ordenador','gimnasio']],
 ['Arian',['K-dramas','ordenador']],['Lolo',['anime']],['Delos',['música']],
 ['May',['ordenador','anime']],['Pablo',['ordenador','gimnasio']],['Aisuke',['ordenador','gimnasio']],
 ['Catalán',['fútbol']],['David',['ordenador','anime']]
].map(([name, interests], i) => ({
  identity:{id:'mii-'+(i+1),name,homeId:i<4?'piso-1':i<8?'piso-2':i<11?'piso-3':'piso-4'},
  // Valores ficticios deterministas y diferenciados; el cuestionario podrá sustituirlos.
  profile:profileFromAnswers({}, {provenance:'provisional', interests, wakeHour:[7,8,9,10][i%4],
    sleepHour:[22,23,0,1][i%4], traits:Object.fromEntries(TRAITS.map((t,j)=>[t, .35+((i*5+j*3)%7)*.05]))})
}));
