import {chronicleEpisodes,visitHighlights} from './chronicles.js';

const fmt=new Intl.DateTimeFormat('es-ES',{timeZone:'UTC',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
const text=(tag,content,className)=>{const el=document.createElement(tag);el.textContent=content;if(className)el.className=className;return el};

function cardImage(episode,chapter){
 const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;
 const ctx=canvas.getContext('2d');
 const gradient=ctx.createLinearGradient(0,0,960,540);
 gradient.addColorStop(0,'#162937');gradient.addColorStop(1,'#101725');ctx.fillStyle=gradient;ctx.fillRect(0,0,960,540);
 ctx.strokeStyle='#496a51';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(28,28,904,484,26);ctx.stroke();
 ctx.fillStyle='#bcf36c';ctx.font='800 25px system-ui';ctx.fillText('◆  SIMS HALFONCERS  /  CRÓNICAS',64,94);
 function lines(value,max){
  const rows=[];let row='';
  for(const word of value.split(/\s+/)){const candidate=row?row+' '+word:word;if(row&&ctx.measureText(candidate).width>max){rows.push(row);row=word}else row=candidate}
  if(row)rows.push(row);
  return rows;
 }
 ctx.fillStyle='#f5f7fb';ctx.font='800 46px system-ui';let y=168;
 for(const row of lines(episode.title,830)){ctx.fillText(row,64,y,830);y+=56}
 ctx.font='500 32px system-ui';ctx.fillStyle='#d7e5ea';y+=28;
 for(const row of lines(chapter.text,815)){ctx.fillText(row,64,y,815);y+=44}
 ctx.font='700 21px system-ui';ctx.fillStyle='#bcf36c';ctx.fillText(chapter.tag.toUpperCase()+'  /  '+fmt.format(chapter.at),64,463);
 return new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
}

function momentLink(chapter){
 const url=new URL(location.href);
 url.hash='momento='+encodeURIComponent(chapter.id);
 return url.href;
}

export function mountChronicle({recap,archive,isQA=false}){
 const archiveList=archive.querySelector('.chronicle-list'),status=archive.querySelector('.chronicle-status');
 const selected=new URLSearchParams(location.hash.slice(1)).get('momento');
 let activeWorld,previous,signature,openedLink=false,showAll=false,latest=[],pinned=null,pinnedMoment=null;
 function mark(world){
  if(isQA)return;
  const key='sims-visit:'+world.worldId;
  try{
   const saved=localStorage.getItem(key);
   if(activeWorld!==world.worldId)previous=saved===null?null:Math.min(world.eventSequence,Number(saved)||0);
   if(document.visibilityState==='visible'&&(saved===null||Number(saved)<world.eventSequence))localStorage.setItem(key,String(world.eventSequence));
  }catch{if(activeWorld!==world.worldId)previous=null}
 }
 function buttons(episode,chapter,withOpen){
  const row=document.createElement('div');row.className='chronicle-actions';
  function add(label,fn){
   const button=text('button',label,'follow-button');button.type='button';
   button.addEventListener('click',fn);row.append(button);
  }
  if(withOpen)add('Ver historia',()=>open(episode,chapter));
  add('Descargar tarjeta',async()=>{
   try{
    const blob=await cardImage(episode,chapter);if(!blob)throw new Error();
    const href=URL.createObjectURL(blob),a=document.createElement('a');a.href=href;
    a.download='sims-halfoncers-momento-'+chapter.sequence+'.png';a.click();
    setTimeout(()=>URL.revokeObjectURL(href),30000);
    status.textContent='Tarjeta lista para compartir.';
   }catch{status.textContent='No se pudo crear la tarjeta.'}
  });
  add('Copiar enlace',async event=>{
   const button=event.currentTarget;
   try{await navigator.clipboard.writeText(momentLink(chapter));status.textContent='Enlace copiado.';button.textContent='Enlace copiado'}
   catch{status.textContent='No se pudo copiar el enlace.'}
  });
  return row;
 }
 function renderArchive(forceEpisode){
  const opened=new Set([...archiveList.querySelectorAll('details[open]')].map(el=>el.dataset.episode));
  if(forceEpisode)opened.add(forceEpisode);
  const linked=pinned&&latest.find(e=>e.id===pinned);
  const shown=showAll?latest:latest.slice(0,8);
  const available=linked&&!shown.includes(linked)?[linked,...shown]:shown;
  const items=available.map(episode=>{
   const card=document.createElement('details');card.className='chronicle-episode';card.dataset.episode=episode.id;
   card.open=opened.has(episode.id);
   const summary=document.createElement('summary');
   summary.append(text('strong',episode.title),text('span',episode.open?'En curso':'Cerrada','chronicle-tag'));
   const timeline=document.createElement('ol');
   for(const chapter of episode.chapters){
    const li=document.createElement('li');li.dataset.moment=chapter.id;
    li.append(text('span',chapter.tag+' · '+fmt.format(chapter.at),'chronicle-time'),text('p',chapter.text));
    if(chapter.id===pinnedMoment)li.classList.add('chronicle-target');
    if(chapter===episode.chapters.at(-1)||chapter.id===pinnedMoment)li.append(buttons(episode,chapter,false));
    timeline.append(li);
   }
   card.append(summary,timeline);
   return card;
  });
  if(!items.length)items.push(text('p','Las historias aparecerán cuando pasen cosas en el barrio.','chronicle-empty'));
  if(latest.length>8){
   const more=text('button',showAll?'Ver menos historias':'Ver todas las historias','follow-button');more.type='button';
   more.addEventListener('click',()=>{showAll=!showAll;renderArchive()});items.push(more);
  }
  archiveList.replaceChildren(...items);
 }
 function open(episode,chapter){
  pinned=episode.id;pinnedMoment=chapter.id;
  renderArchive(episode.id);
  const line=[...archiveList.querySelectorAll('[data-moment]')].find(el=>el.dataset.moment===chapter.id);
  if(line){line.classList.add('chronicle-target');line.scrollIntoView({block:'nearest'});}
 }
 window.addEventListener('open-chronicle',event=>{
  const episode=latest.find(e=>e.chapters.some(c=>c.id===event.detail.id));
  if(episode)open(episode,episode.chapters.find(c=>c.id===event.detail.id));
 });
 return function render(world){
  mark(world);
  if(activeWorld!==world.worldId){signature=null;openedLink=false;pinned=null;pinnedMoment=null;activeWorld=world.worldId}
  if(isQA&&new URLSearchParams(location.search).get('qa')==='chronicle')previous=world.qaPreviousVisit;
  const episodes=chronicleEpisodes(world);
  const key=episodes.map(e=>e.id+'='+e.chapters.map(c=>c.id).join(',')).join('|');
  if(signature===key)return;
  signature=key;latest=episodes;
  const stories=visitHighlights(episodes,previous);
  const cards=stories.map(({episode,chapter,count})=>{
   const item=document.createElement('article');item.className='chronicle-highlight';
   item.append(text('span',fmt.format(chapter.at)+(previous!=null&&count>1?' · '+count+' novedades':''),'chronicle-time'),
    text('strong',episode.title),text('p',chapter.text),buttons(episode,chapter,true));return item;
  });
  if(!cards.length)cards.push(text('p',previous==null?'Aún no hay momentos destacados.':'Todavía no hay novedades desde tu última visita.','chronicle-empty'));
  recap.replaceChildren(...cards);
  renderArchive();
  if(selected&&!openedLink){
   const linked=episodes.find(episode=>episode.chapters.some(c=>c.id===selected));
   if(linked){openedLink=true;requestAnimationFrame(()=>open(linked,linked.chapters.find(c=>c.id===selected)))}
   else status.textContent='Este momento ya no está en el archivo disponible.';
  }
 };
}
