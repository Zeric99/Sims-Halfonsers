// Información derivada únicamente del último estado compartido.
export function describeResident(world,name,now){
 const p=world.people.find(x=>x.name===name);if(!p)return null;
 const a=p.action,names=new Map(world.people.map(x=>[x.id,x.name]));
 const arrive=a?a.start+(a.travelMs||0):0,travel=a&&now<arrive;
 let current=a?.label||'Sin actividad en curso',next='Todavía no ha decidido qué hará después.';
 if(travel){current='Yendo a: '+(a.label||a.id);next='Al llegar: '+(a.label||a.id)+'.'}
 else if(a?.id==='comer'&&a.meal&&now<arrive+a.meal.prepareMs){current='Preparando la comida';next='Comer cuando termine de prepararla.'}
 const labels={esperar:'esperó un camino libre',practicar:'disfrutó de su afición',ver_tv:'vio la tele',pasear:'dio un paseo',dormir:'durmió',comer:'comió',usar_bano:'usó el baño',asearse:'se aseó',jugar:'jugó al ordenador',estudiar:'estudió',limpiar:'limpió la cocina',descansar:'descansó',leer:'leyó',charlar:'charló',fumar:'fumó'};
 const history=(world.events||[]).filter(e=>e.personId===p.id&&['action_finished','activity_interrupted'].includes(e.type)).slice(-5).reverse().map(e=>({at:e.at,text:(labels[e.action]||e.action||'hizo una actividad')+(e.type==='activity_interrupted'?' (interrumpido)':'')}));
 const tensions=Object.entries(p.relationships||{}).filter(([,r])=>(r.tension??0)>=20).sort((a,b)=>b[1].tension-a[1].tension).map(([id,r])=>({name:names.get(id)||'Otro vecino',tension:Math.round(r.tension)}));
 const conflicts=Object.values(world.conflicts||{}).filter(c=>c.state!=='resolved'&&c.participants?.includes(p.id)).map(c=>({name:names.get(c.participants.find(id=>id!==p.id))||'Otro vecino',cause:c.cause||'convivencia',state:c.state}));
 return {name:p.name,home:p.homeId,mood:p.mood?.label||'sin datos',needs:p.needs,current,next,history,tensions,conflicts};
}
