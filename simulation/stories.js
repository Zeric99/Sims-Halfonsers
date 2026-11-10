export function describeStory(event,names){
 const who=(event.participants||[]).map(id=>names.get(id)||'Un vecino');
 if(event.type==='invitation_accepted')return who[0]+' busca a '+who[1]+' para charlar.';
 if(event.type==='invitation_declined')return who[1]+' prefiere seguir con lo suyo y rechaza la invitación de '+who[0]+'.';
 if(event.type==='invitation_cancelled')return who.join(' y ')+' aplazan su encuentro.';
 if(event.type==='story_finished')return who.join(' y ')+({prank:' tuvieron una broma que dejó algo de tensión.',repair:' hablaron de su desacuerdo y rebajaron la tensión.',shared_interest:' conectaron gracias a una afición común.',catch_up:' se pusieron al día.'}[event.story]||' terminaron de hablar.');
 return null;
}
