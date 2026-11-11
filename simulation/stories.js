import {activities} from './plans.js';

export function describeStory(event,names){
 const who=(event.participants||[]).map(id=>names.get(id)||'Un vecino');
 const [a,b]=who;
 const pair=who.join(' y ');
 const activity=activities[event.activity]?.label;
 switch(event.type){
  case 'plan_proposed': return a+' propuso a '+b+' '+activity+'.';
  case 'plan_rescheduled': return b+' propuso quedar más tarde y '+a+' aceptó.';
  case 'plan_accepted': return pair+' quedaron para '+activity+'.';
  case 'plan_declined': return b+' rechazó el plan de '+a+' para '+activity+'.';
  case 'plan_travelling': return pair+' van hacia el punto de encuentro.';
  case 'plan_started': return pair+' se encontraron para '+activity+'.';
  case 'plan_completed': return pair+' terminaron de '+activity+'.';
  case 'plan_missed': return (names.get(event.absentId)||'Un vecino')+' no apareció al plan para '+activity+'.';
  case 'plan_cancelled': return pair+' cancelaron el plan porque '+event.reason+'.';
  case 'invitation_accepted': return a+' busca a '+b+' para charlar.';
  case 'invitation_declined': return b+' prefiere seguir con lo suyo y rechaza la invitación de '+a+'.';
  case 'invitation_cancelled': return pair+' aplazan su encuentro.';
  case 'kitchen_wait': return pair+' tuvieron que organizarse con la cocina.';
  case 'conflict_incident': return a+' se molestó con '+b+' por '+event.cause+'.';
  case 'repair_accepted': return pair+' llegaron a un acuerdo para '+(event.request||'respetar el turno de cocina')+'.';
  case 'repair_declined': return pair+' necesitan más tiempo para resolver el desacuerdo.';
  case 'agreement_fulfilled': return pair+' cumplieron el acuerdo para '+(event.request||'respetar el turno de cocina')+'.';
  case 'agreement_broken': return pair+' dejaron pendiente el acuerdo para '+(event.request||'resolver su desacuerdo')+'.';
  case 'romance_proposed': return a+' le propuso a '+b+' empezar una relación.';
  case 'romance_accepted': return pair+' decidieron empezar una relación.';
  case 'romance_rejected': return b+' prefirió dejar la relación como estaba.';
  case 'relationship_ended': return pair+' terminaron su relación porque '+event.reason+'.';
  case 'story_finished': {
   const endings={
    prank:event.harmless?' se rieron de una broma.':' tuvieron una broma que dejó algo de tensión.',
    repair:' hablaron de su desacuerdo y rebajaron la tensión.',
    shared_interest:' conectaron gracias a una afición común.',
    catch_up:' se pusieron al día.'
   };
   return pair+(endings[event.story]||' terminaron de hablar.');
  }
  default: return null;
 }
}
