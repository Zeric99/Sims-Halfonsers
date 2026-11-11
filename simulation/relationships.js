import {socialBias} from './memory.js';

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export function relation(from, to) {
 const entries = from.relationships ??= {};
 return entries[to.id] = {
  friendship: 0, trust: 20, tension: 0, familiarity: 0, romanticInterest: 0,
  lastEncounter: null, ...entries[to.id]
 };
}

export function affinity(person, other, at) {
 const r = person.relationships?.[other.id];
 return (r?.friendship ?? 0) / 100 + ((r?.trust ?? 20) - 20) / 150
  - (r?.tension ?? 0) / 70 + clamp(socialBias(person, other.id, at), -5, 5) * .06;
}

export function consent(person, other, at) {
 return clamp(.25 + person.profile.traits.sociabilidad * .35
  + (100 - person.needs.compania) * .003 + affinity(person, other, at) * .35, .05, .9);
}

export function relationshipLabel(r) {
 if (r.status === 'distanciado' ? r.tension >= 24 : r.tension >= 35) return 'distanciado';
 if (r.status === 'amigo' ? r.friendship >= 15 : r.friendship >= 22) return 'amigo';
 return 'conocido';
}

export function coolTension(world, hours) {
 for (const person of world.people) {
  for (const r of Object.values(person.relationships ?? {})) {
   if (r.tension > 0) r.tension = Math.max(0, r.tension - hours * .12);
   if (r.status) r.status = relationshipLabel(r);
  }
 }
}
