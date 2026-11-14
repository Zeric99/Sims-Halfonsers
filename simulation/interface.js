// Presentation only: opening panels never pauses or changes the shared world.
const body = document.body;
const sidebar = document.querySelector('.sidebar');
const tabs = [...document.querySelectorAll('[data-panel-target]')];
const titles = {chat:'Chat de la comunidad',live:'El barrio en directo',stories:'Historias y salseo',residents:'Nuestros vecinos'};
const sections = [...sidebar.children].filter(node => !node.matches('.drawer-heading'));
for (const section of sections) {
  section.dataset.section = section.matches('.chat-box') ? 'chat'
    : section.matches('#live-guide,.events-box') ? 'live'
    : section.matches('.accordion') ? 'residents' : 'stories';
}
function openPanel(name, restoreFocus = false) {
  const previous = body.dataset.panel;
  body.dataset.panel = name;
  sidebar.inert = name === 'none';
  for (const section of sections) section.classList.toggle('shell-section-hidden', section.dataset.section !== name);
  for (const button of tabs) button.setAttribute('aria-expanded', String(button.dataset.panelTarget === name));
  document.querySelector('#drawer-title').textContent = titles[name] || 'Comunidad';
  if (restoreFocus) tabs.find(button => button.dataset.panelTarget === previous)?.focus();
  window.dispatchEvent(new Event('resize'));
  window.dispatchEvent(new Event('community-panel-change'));
}
for (const button of tabs) button.addEventListener('click', () => openPanel(body.dataset.panel === button.dataset.panelTarget ? 'none' : button.dataset.panelTarget));
document.querySelector('#drawer-close').addEventListener('click', () => openPanel('none', true));
document.querySelector('#layout-toggle').addEventListener('click', event => {
  const docked = body.classList.toggle('panels-docked');
  event.currentTarget.setAttribute('aria-pressed', String(docked));
  event.currentTarget.textContent = docked ? '⛶ Solo juego' : '▣ Vista con paneles';
  openPanel(docked ? (body.dataset.panel === 'none' ? 'chat' : body.dataset.panel) : 'none');
});
const fullscreen = document.querySelector('#fullscreen-toggle');
if (!document.fullscreenEnabled) fullscreen.hidden = true;
fullscreen.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch { fullscreen.title = 'Tu navegador no permite pantalla completa; puedes usar la vista Solo juego.'; }
});
document.addEventListener('fullscreenchange', () => {
  fullscreen.setAttribute('aria-label', document.fullscreenElement ? 'Salir de pantalla completa' : 'Pantalla completa del navegador');
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && body.dataset.panel !== 'none') openPanel('none', true);
});
window.addEventListener('resident-select', () => openPanel('none'));
window.addEventListener('watch-scene', () => openPanel('none'));
window.addEventListener('open-chronicle', () => openPanel('stories'));
// ResizeObserver also covers narrow screens, side panels and browser fullscreen.
new ResizeObserver(() => window.dispatchEvent(new Event('resize'))).observe(document.querySelector('#world'));
openPanel('none');
