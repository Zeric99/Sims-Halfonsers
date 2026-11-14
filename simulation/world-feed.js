import {neighbourhoodHighlights} from './highlights.js';
import {describeResident} from './resident-details.js';

export const WORLD_REFRESH_MS = 8000;
const HISTORY_LIMIT = 12;

export function residentReading(reading, id) {
 const person = reading.world.people.find(person => person.id === id);
 return person ? {
  ...describeResident(reading.world, person.name, reading.serverTime),
  intention: person.intention?.text
 } : null;
}

export function publicReading(reading) {
 const {world} = reading;
 const people = world.people.map(({id, name, homeId, action, position, needs, mood}) => ({
  id, name, homeId, action, position,
  needs: Object.fromEntries(Object.entries(needs).map(([key, value]) => [key, Math.round(value)])),
  mood: mood?.label ? {label:mood.label} : null
 }));
 const conversations = Object.fromEntries(Object.entries(world.conversations ?? {}).filter(([, c]) =>
  !c.finished || reading.serverTime - (c.cancelledAt ?? c.end) < 4 * 60_000
 ));
 const {worldId, worldVersion, eventSequence, simulationClock, events, chronicle, plans, groupEvents, conflicts, households} = world;
 return {...reading, world:{
  worldId, worldVersion, eventSequence, simulationClock, people,
  events:events.filter(event=>event.type!=='action_started'&&event.type!=='action_finished'), chronicle,
  conversations, plans, groupEvents, conflicts, households, highlights:neighbourhoodHighlights(world)
 }};
}

function fieldChanges(previous, current) {
 const changes = {};
 for (const [key, value] of Object.entries(current)) {
  if (JSON.stringify(previous[key]) !== JSON.stringify(value)) changes[key] = value;
 }
 const removed = Object.keys(previous).filter(key => !Object.hasOwn(current, key));
 return {changes, removed};
}

function eventChanges(previous, current) {
 const oldIds = new Set(previous.map(event => event.id));
 const newIds = new Set(current.map(event => event.id));
 const remove = previous.filter(event => !newIds.has(event.id)).map(event => event.id);
 const add = current.filter(event => !oldIds.has(event.id));
 const delta = {remove, add};
 return JSON.stringify(applyEvents(previous, delta)) === JSON.stringify(current) ? delta : {replace:current};
}

function applyEvents(previous, {remove, add, replace}) {
 if (replace) return replace;
 const removed = new Set(remove);
 return [...previous.filter(event => !removed.has(event.id)), ...add];
}

function deltaReading(previous, reading) {
 const {world:current, ...metadata} = reading;
 const old = previous.world;
 const {people, events, chronicle, ...fields} = current;
 const {people:oldPeople, events:oldEvents, chronicle:oldChronicle, ...oldFields} = old;
 return {...metadata, delta:{
  base:old.worldVersion, worldId:current.worldId, ...fieldChanges(oldFields, fields),
  people:people.map((person, index) => fieldChanges(oldPeople[index], person)),
  events:eventChanges(oldEvents, events),
  chronicle:chronicle ? {sequence:chronicle.sequence, ...eventChanges(oldChronicle?.events ?? [], chronicle.events)} : null
 }};
}

function applyFields(previous, {changes, removed}) {
 const next = {...previous, ...changes};
 for (const key of removed) delete next[key];
 return next;
}

export function applyWorldReading(payload, previous) {
 if (payload.world) return payload;
 const {delta, ...metadata} = payload;
 const base = previous?.world;
 if (!delta || !base || base.worldId !== delta.worldId || base.worldVersion !== delta.base) return null;
 const world = applyFields(base, delta);
 world.people = base.people.map((person, index) => applyFields(person, delta.people[index]));
 world.events = applyEvents(base.events, delta.events);
 world.chronicle = delta.chronicle ? {
  sequence:delta.chronicle.sequence, events:applyEvents(base.chronicle?.events ?? [], delta.chronicle)
 } : undefined;
 return {...metadata, world};
}

export function createWorldFeed(load, now = Date.now) {
 let current, pending, fetchedAt = -Infinity;
 const history = new Map();
 async function read() {
  if (pending) return pending;
  if (current && now() - fetchedAt < WORLD_REFRESH_MS) return current;
  pending = (async () => {
   const reading = await load();
   if (!reading) return null;
   const projected = publicReading(reading);
   // Normalize to the exact JSON representation received by clients.
   const snapshot = JSON.parse(JSON.stringify(projected));
   if (current?.public.world.worldId !== snapshot.world.worldId) history.clear();
   history.set(snapshot.world.worldVersion, snapshot);
   while (history.size > HISTORY_LIMIT) history.delete(history.keys().next().value);
   fetchedAt = Number.isFinite(reading.serverWallTime) ? reading.serverWallTime : now();
   return current = {full:reading, public:snapshot};
  })();
  try {return await pending} finally {pending = null}
 }

 return async ({feed, since, resident} = {}) => {
  const entry = await read();
  if (!entry) return null;
  if (resident) return {resident:residentReading(entry.full, resident)};
  if (feed !== '1') return entry.full;
  const version = entry.public.world.worldVersion;
  const previous = typeof since === 'string' && /^\d+$/.test(since) ? history.get(Number(since)) : null;
  if (!previous) return entry.public;
  if (previous.world.worldVersion === version) return {unchanged:version};
  if(previous.world.people.map(p=>p.id).join()!==entry.public.world.people.map(p=>p.id).join())return entry.public;
  const delta = deltaReading(previous, entry.public);
  return JSON.stringify(delta).length < JSON.stringify(entry.public).length ? delta : entry.public;
 };
}
