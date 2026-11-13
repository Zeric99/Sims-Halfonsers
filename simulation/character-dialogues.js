// Guiones ficticios del juego; las afinidades no dependen del orden del hablante.
export const footballTeams = Object.freeze({Eric:'Madrid',Adrián:'Madrid',Pablo:'Madrid',Arian:'Barça',Aisuke:'Barça',David:'Barça'});
export function meiNeedsBreak(person) {
 return person.name==='Mei' && (person.needs.diversion<35 || Object.values(person.relationships??{}).some(r=>r.tension>=12));
}
const daily = [
 ['¿Quién dejó una cucharilla dentro de la nevera?','Yo buscaba el yogur. La cucharilla se ha independizado.','Pues que pague su parte del alquiler.'],
 ['He venido a la cocina y no sé para qué.','Abre la nevera. Es el procedimiento oficial.','Ya la he abierto dos veces. No me ha dado ninguna pista.'],
 ['¿Pedimos algo o cocinamos?','Depende. ¿Fregar cuenta como cocinar?','En ese caso llevo toda la semana de chef.'],
 ['El grupo lleva ochenta mensajes. ¿Ha pasado algo?','Están intentando elegir una hora para cenar.','Perfecto. Para el desayuno lo tendremos decidido.'],
 ['Hoy iba a acostarme pronto.','Eso dijiste antes de la última partida.','No especifiqué en qué zona horaria.'],
 ['¿Quién se ha llevado el cargador del salón?','Mira debajo del cojín. Ahí desaparece todo.','Como encuentre también mi motivación, te aviso.'],
 ['He comprado una planta para ser más responsable.','¿Y cómo va?','Me está mirando como si quisiera cambiar de dueño.'],
 ['¿Ponemos una peli que elija alguien en cinco minutos?','Podemos tardar menos eligiendo otra casa.','Venga, primera opción que no sea una secuela.'],
 ['Tengo una teoría: los calcetines se van por voluntad propia.','Normal. No aguantan otra lavadora con tus camisetas.','Eso explica por qué se llevan solo a uno de cada pareja.'],
 ['¿Quién tiene una alarma cada cinco minutos?','Alguien que está negociando con la mañana.','Pues la mañana va ganando por goleada.'],
 ['He ido al súper con hambre. Mala idea.','¿Qué has comprado?','Cena para seis y absolutamente ningún ingrediente.'],
 ['¿Montamos un concurso de tortillas?','Sí, pero el jurado friega.','Retiro inmediatamente mi candidatura a jurado.']
];
const personal = {
 Snow:[
 ['El PSOE todavía no me ha ingresado la nómina de hoy.','¿Otra vez con tu personaje de agente subvencionado?','Sí. En esta sitcom cobro en croquetas imaginarias.'],
 ['Mi contrato ficticio con el PSOE incluye fotografiar este sofá.','¿Y qué tiene de especial?','Nada, pero he prometido un informe de cuarenta fotos.'],
 ['He terminado el anime y ahora no sé qué hacer con mi vida.','Podrías recoger el escritorio.','Buscaba una solución menos radical.']
 ],
 Mei:[
 ['Llevo veinte minutos borrando el mismo ojo del dibujo.','Déjalo un rato y vuelve con la cabeza fresca.','Sí, necesito parar. Hoy me he saturado.'],
 ['Entre el ruido y el dibujo estoy hasta arriba.','¿Te dejo un rato tranquila?','Sí, gracias. Voy a salir un momento al jardín.'],
 ['Me he comprado otro cuaderno.','¿Has terminado el anterior?','No me ataques con preguntas tan difíciles.']
 ],
 David:[
 ['Me ha dado un bajón existencial estando solo en mi cuarto.','Sal un rato con nosotros. ¿Te guardo sitio?','Sí. Y pon algo alegre, que hoy estoy melodramático.'],
 ['He ensayado un mensaje veinte minutos y he puesto hola.','Bueno, al menos has revisado la ortografía.','Ahora viene la parte difícil: no mirar el móvil cada segundo.'],
 ['Hoy no discuto de fútbol. Estoy sensible.','¿Ponemos anime?','Sí, pero nada triste, que me conozco.']
 ],
 Delos:[
 ['Mi novia dice que esta canción es buenísima.','¿Y tú qué opinas?','Que tiene un gusto excelente. Lo digo sin ninguna presión.'],
 ['Tengo una playlist para limpiar la casa.','¿Cuántas canciones llevas?','Cuarenta. De limpiar todavía no he empezado.']
 ],
 Lolo:[
 ['Pregunta seria: ¿cuántas palomas hacen falta para llevarse un sofá?','¿Por qué necesitas saber eso?','Estoy comparando empresas de mudanza.'],
 ['¿Preferirías hablar rimando o que sonara música cuando entras?','Música. ¿Puedo elegirla?','No. Flauta de colegio, siempre.']
 ],
 Yaiza:[
 ['He dejado preparada la comida de mañana.','Yo he dejado preparada la excusa para pedir pizza.','Bueno, por lo menos los dos tenemos un plan.'],
 ['Hoy toca estudiar y luego entrenar.','¿Dónde metes el descanso?','Justo cuando dejéis de preguntarme por mi horario.']
 ],
 May:[
 ['Solo digo que ese final de anime no tiene sentido.','¿Quieres debatirlo o que te dé la razón?','Primero debatimos y luego ya me das la razón.'],
 ['He perdido una partida por el equipo.','¿Y las tres anteriores?','Estamos analizando esta, no desviemos el tema.']
 ],
 Pablo:[
 ['He cerrado el ordenador del trabajo y abierto el de jugar.','Menudo cambio de paisaje.','Ahora la silla tiene ambiente de vacaciones.'],
 ['He arreglado un error y han salido otros dos.','¿Eso es trabajar o criar errores?','A estas alturas les voy a poner nombre.']
 ],
 Eric:[
 ['Quédate natural, que te hago una foto.','Llevas cinco minutos diciéndome cómo poner el brazo.','Es naturalidad dirigida. Muy profesional.'],
 ['Tengo una broma buenísima.','¿Buenísima para quién?','Vale, esa pregunta me obliga a revisarla.']
 ],
 Adrián:[
 ['Te lo cuento rápido, son dos cosas.','La última vez empezamos antes de comer.','Esta vez he preparado un resumen. Tiene capítulos.']
 ],
 Arian:[
 ['En el K-drama se han rozado la mano después de doce capítulos.','Qué ritmo. Aquí ya habríamos discutido por fregar.','Eso pasa en la segunda temporada.']
 ],
 Aisuke:[
 ['¿Una partida antes de entrenar?','Una, pero de verdad.','Vale. No he dicho cuántas revanchas.']
 ],
 Catalán:[
 ['He encontrado el sitio perfecto del sofá.','Es el mismo de ayer.','La investigación confirma los resultados.']
 ]
};
const conspiracies = [
 ['Eric, ¿y si las palomas son drones que se cargan en las farolas?','La de ayer se chocó contra una ventana. Mal firmware.','Exacto. Actualización municipal pendiente.'],
 ['Eric, el algoritmo sabe cuándo voy a abrir la nevera.','Tú la abres cada diez minutos. Tampoco es espionaje avanzado.','Eso es justo lo que diría una nevera infiltrada.'],
 ['Eric, las antenas nos están ocultando algo.','Sí: dónde has dejado el mando.','La conspiración del sofá llega más lejos de lo que pensábamos.'],
 ['Eric, sospecho que alguien controla nuestros horarios desde una web.','Entonces que me reserve el baño antes que a Lolo.','Por fin una petición razonable al gran administrador.']
];
export function characterDialogueOptions(a,b) {
 const options=daily.map((lines,i)=>({key:'casa:'+i,topic:'la convivencia',lines}));
 const add=(key,topic,actor,lines)=>options.push({key,topic,lines:actor===a.name?lines:['¿Qué te cuentas?',...lines]});
 for(const person of [a,b])for(const [i,lines] of (personal[person.name]||[]).entries())add('personal:'+person.name+':'+i,'las cosas de '+person.name,person.name,lines);
 const ta=footballTeams[a.name],tb=footballTeams[b.name];
 if(ta&&tb){
  const variants=ta===tb?[
   [`Hoy toca defender al ${ta}, pero sin sufrir tanto.`,'Tú dices eso y luego no te sientas en todo el partido.','Es cardio. Me ahorro el gimnasio.'],
   [`¿Camiseta del ${ta} para verlo?`,'Sí, pero como perdamos no vuelvo a ponerme esta.','La camiseta pagando por nuestros problemas tácticos.'],
   ['¿Dónde vemos el siguiente partido?','En el salón, pero esta vez escondemos el mando.','Y dejamos de dar instrucciones a la tele, que no nos oyen.']
  ]:[
   [`Ser del ${ta} aquí tiene mucho mérito.`,`Más mérito tiene escucharos siendo del ${tb}.`,'Perfecto, ya tenemos previa sin haber encendido la tele.'],
   ['¿Vemos el clásico juntos o quieres conservar la amistad?','Juntos, pero el que pierda recoge los platos.','Trato. Sin renegociar después del descuento.'],
   [`Hoy no acepto críticas al ${ta}.`,`Vale, te las guardo para mañana. Firma: alguien del ${tb}.`,'Qué considerado. Te bloqueo hasta el desayuno.'],
   ['¿Eso lo pitas como penalti?','Antes dime de qué equipo es, para ajustar mi objetividad.','Por fin alguien sincero en este salón.']
  ];
  variants.forEach((lines,i)=>options.push({key:'futbol:'+ta+':'+tb+':'+i,topic:'fútbol',lines}));
 }
 for(const person of [a,b])if(person.name==='Delos'&&(ta||tb))[
  ['Yo el partido ya lo he visto en TikTok.','Has visto un regate con música y tres cortes.','Y un señor gritando. Análisis completo.'],
  ['Ese jugador es buenísimo. Me sale todo el rato en TikTok.','¿Has visto algún partido suyo entero?','No, pero su editor merece el Balón de Oro.'],
  ['¿Por qué no ponen todos los partidos a velocidad doble?','Porque el fútbol no es tu sección Para ti.','Pues deberían añadir un botón de saltar saque de banda.']
 ].forEach((lines,i)=>add('tiktok:'+i,'fútbol en TikTok',person.name,lines));
 if([a.name,b.name].includes('Eric')&&[a.name,b.name].includes('Linkal'))conspiracies.forEach((lines,i)=>add('conspiracion:'+i,'conspiraciones absurdas','Linkal',lines));
 return options;
}
export function chooseCharacterDialogue(conversation,a,b,recent=[]) {
 const options=characterDialogueOptions(a,b);
 // Exclude scripts heard by either neighbour, including with different partners.
 const excluded=new Set(recent.slice(0,Math.min(18,options.length-1)).map(c=>c.dialogueKey));
 let available=options.filter(o=>!excluded.has(o.key));
 if(!available.length)available=options.filter(o=>o.key!==recent[0]?.dialogueKey);
 let hash=2166136261;
 for(const ch of conversation.id)hash=Math.imul(hash^ch.charCodeAt(0),16777619)>>>0;
 const chosen=available[hash%available.length];
 conversation.dialogueKey=chosen.key;conversation.dialogueVariant=0;conversation.topic=chosen.topic;
 return [...chosen.lines];
}
