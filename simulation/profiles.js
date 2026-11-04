// Datos lúdicos provisionales. No representan rasgos reales de los amigos.
export const PROFILE_VERSION = 1;
export const TRAITS = ['sociabilidad','amabilidad','paciencia','orden','curiosidad','constancia','privacidad','sensibilidadRuido','iniciativaSocial'];
const clamp = n => Math.min(1, Math.max(0, n));
const questions = {
  prefiereSoledad: [{trait:'privacidad', weight:1}, {trait:'sociabilidad', weight:1, inverted:true}],
  proponePlanes: [{trait:'iniciativaSocial', weight:1}],
  ruidoConcentracion: [{trait:'sensibilidadRuido', weight:1}]
};
export function profileFromAnswers(answers = {}, previous = {}) {
  const totals = Object.fromEntries(TRAITS.map(t => [t, {sum:0, weight:0}]));
  for (const [id, mappings] of Object.entries(questions)) {
    const value = answers[id];
    if (value == null) continue;
    if (!Number.isInteger(value) || value < 1 || value > 5) throw new RangeError('Respuesta fuera de escala: ' + id);
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
  return {version:PROFILE_VERSION, provenance:Object.keys(answers).length ? 'cuestionario' : (previous.provenance ?? 'provisional'), traits,
    wakeHour: previous.wakeHour ?? 8, sleepHour: previous.sleepHour ?? 23,
    interests: [...(previous.interests ?? [])], romanceEnabled: previous.romanceEnabled ?? false};
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
