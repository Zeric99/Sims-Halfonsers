// Tasas por hora simulada; las necesidades son satisfacción de 0 a 100.
export const NEEDS_CONFIG = Object.freeze({saciedad:4, energia:4, higiene:2, compania:3, diversion:3});
const clamp = n => Math.max(0,Math.min(100,n));
export function advanceNeeds(needs, hours, {sleeping=false,sociability=.5}={}) {
 if (!Number.isFinite(hours) || hours < 0) throw new RangeError('Tiempo inválido');
 const out={...needs};
 for(const k of Object.keys(NEEDS_CONFIG)) if(!Number.isFinite(needs[k])||needs[k]<0||needs[k]>100) throw new RangeError('Necesidad inválida: '+k);
 out.saciedad=clamp(needs.saciedad-NEEDS_CONFIG.saciedad*hours*(sleeping?.5:1));
 out.energia=clamp(needs.energia+(sleeping?9:-NEEDS_CONFIG.energia)*hours);
 out.higiene=clamp(needs.higiene-NEEDS_CONFIG.higiene*hours*(sleeping?.5:1));
 out.compania=clamp(needs.compania-(2+3*Math.max(0,Math.min(1,sociability)))*hours);
 out.diversion=clamp(needs.diversion-NEEDS_CONFIG.diversion*hours);
 return out;
}
export function urgency(satisfaction){return ((100-clamp(satisfaction))/100)**2}
