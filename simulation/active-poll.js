export function pollWhileActive(refresh, {active, delay, events = []}) {
 let timer, pending = false, failures = 0, previouslyActive = false;

 async function run() {
  if (pending || !active()) return;
  pending = true;
  try {
   const success = await refresh();
   failures = success === false ? Math.min(failures + 1, 4) : 0;
  } catch {
   failures = Math.min(failures + 1, 4);
  } finally {
   pending = false;
   if (active()) timer = setTimeout(run, Math.min(60000, delay * 2 ** failures));
  }
 }

 function update() {
  const enabled = active();
  if (!enabled) clearTimeout(timer);
  if (enabled && !previouslyActive) {
   failures = 0;
   clearTimeout(timer);
   void run();
  }
  previouslyActive = enabled;
 }

 document.addEventListener('visibilitychange', update);
 for (const event of events) window.addEventListener(event, update);
 update();
}
