const plans = {
 anime: [
  ['¿Seguimos con el capítulo?', 'Sí. La amiga sabe algo, ¿no?',
   'Seguro. Escondió la carta y ahora evita el tema.',
   'Yo pensaba que la habían pillado.',
   'Pues al final vemos quién tenía razón.'],
  ['¿Vemos uno más o lo dejamos para mañana?', 'Uno más, pero pon los subtítulos grandes. Desde aquí no leo nada.',
   'Ya están. ¿Así los ves desde el sofá?', 'Mucho mejor. Rebobina un poco, que me he perdido lo de la estación.',
   'Hecho. Justo aquí es donde se despiden.'],
  ['Me está gustando más la música que la historia. ¿A ti no?',
   'La música sí, pero este personaje por fin empieza a caerme bien.',
   '¿El que al principio no quería ayudar a nadie? Menudo cambio.',
   'Ese. Me ha ganado cuando ha vuelto a buscar al otro.',
   'Vale, esa escena te la compro. Dejemos que acabe el capítulo.']
 ],
 games: [
  ['¿Probamos el modo cooperativo?', 'Vale. Yo cubro la entrada y tú busca la llave.',
   'La tengo, pero la puerta de atrás no abre.', 'Espera, hay una palanca al lado de la escalera. Voy a darle.',
   'Ahora sí. Ven, que no pienso cruzar solo.'],
  ['¿Revancha? Esta vez elijo yo el mapa.', 'Trato hecho. El último era todo pasillos y me perdía cada dos por tres.',
   'Entonces uno abierto. ¿Ves esa torre? Nos encontramos ahí.',
   'Ya la veo. Voy por la izquierda, que por el centro me conocen de sobra.',
   'Perfecto. Te espero arriba.'],
  ['Hoy me apetece jugar sin mirar la puntuación.',
   'Mejor. La última vez nos pasamos media partida discutiendo el marcador.',
   'Entonces probamos una cosa rara: yo voy delante con el escudo.',
   'Vale, yo guardo una cura por si sale mal.',
   'Eso sí me da confianza. Venga, entramos.']
 ],
 cooking: [
  ['¿Picas la cebolla mientras pongo la sartén?', 'Sí. ¿La quieres fina o da igual?',
   'Fina, que así se hace antes. El cuchillo bueno está al lado del fregadero.',
   'Ya está. ¿La echo ahora o esperamos a que se caliente el aceite?',
   'Ahora va bien. Remueve un poco y yo saco los platos.'],
  ['Tenemos verduras para saltear. ¿Te apetece?', 'Sí. ¿Yo corto y tú te encargas del fuego?',
   'Va. Corta el pimiento un poco más pequeño que el calabacín.',
   'Listo. ¿Probamos antes de echar más sal?',
   'Buena idea. Pásame una cucharita.'],
  ['¿Hacemos tortilla con lo que queda?', 'Sí, pero hagamos una grande. Así queda para luego.',
   'Buena. Yo bato los huevos. ¿Me dejas un plato para darle la vuelta?',
   'Toma, este cubre toda la sartén. Hazlo sobre el fregadero por si acaso.',
   'Uf, ha salido entera. Ahora le falta un minuto por el otro lado.']
 ],
 gym: [
  ['¿Calentamos con poco peso primero?', 'Sí, que hoy vengo con los hombros tiesos.',
   'Haz una serie tranquila. Yo cuento las repeticiones.', 'Ocho. Creo que me quedo con este peso una más.',
   'Vale, descansa un poco. Te aviso cuando me toque.'],
  ['¿Me miras la postura en esta serie?', 'Sí. Baja un pelín más despacio y no tires con la espalda.',
   '¿Así? Noto mucho más los brazos.', 'Eso es. Para un segundo antes de la última.',
   'Buena. Ahora te toca a ti y te cuento las repeticiones.'],
  ['¿Alternamos mancuernas? Así no esperamos a que quede libre el sitio.',
   'Sí. Empieza tú, que todavía me estoy atando las zapatillas.',
   'Ya está mi serie. Te dejo las pequeñas por si quieres empezar suave.',
   'Gracias. Con estas puedo hacer el movimiento entero sin tirones.',
   'Perfecto. Cuando acabes las dejamos juntas en el soporte.']
 ]
};

const interests = {
 fotografía: [
  '¿Has probado a hacer fotos en el jardín cuando baja el sol?',
  'El otro día lo pensé. Desde el banco se ve la luz entre las plantas.',
  'Pues probamos desde ahí. Yo me llevaría la cámara antes de que se haga de noche.'
 ],
 ordenador: [
  '¿Tú también abres un juego y te pasas media hora decidiendo a qué jugar?',
  'Siempre. Últimamente prefiero algo que pueda dejar a mitad.',
  'Te entiendo. A mí me salva tener una partida corta para esos ratos.'
 ],
 anime: [
  'Me apetece empezar un anime que no tenga cien episodios. ¿Qué buscarías?',
  'Algo corto y con un final cerrado. Estoy harto de quedarme esperando otra temporada.',
  'Totalmente. Si vemos uno que encaje, lo ponemos una tarde.'
 ],
 gimnasio: [
  '¿Tú apuntas las series o te fías de la memoria?',
  'Las apunto. Si no, siempre creo que levanté más la semana pasada.',
  'Pues me voy a copiar. Así sé cuándo me conviene subir el peso.'
 ]
};

const everyday = [
 ['¿Qué tal el día? Yo necesitaba un rato de calma.', 'Bien. A mí también me apetecía parar un momento.',
  'Pues nos quedamos aquí un rato. Ahora mismo no tengo ninguna prisa.'],
 ['¿Te vienes un momento al jardín? Se está mejor fuera.', 'Me apetece. Aquí dentro llevo toda la tarde dando vueltas.',
  'Luego salimos. Quiero pasar por el banco que está al fondo.'],
 ['¿Tú también tienes la sensación de que hoy el día ha pasado volando?', 'Sí. Pensaba que aún era pronto y ya tengo hambre.',
  'Pues cuando acabemos de hablar miro qué queda en la nevera.'],
 ['¿Te importa si me siento aquí un momento?', 'Claro. De hecho, no sabía si ponerte música o dejar el salón en silencio.',
  'En silencio estoy a gusto. Luego elegimos algo entre los dos.'],
 ['Hoy no sé si quedarme dentro o dar una vuelta.', 'Yo daría una vuelta corta. A veces con eso ya me despejo.',
  'Puede ser. Paso primero por casa a por agua y luego veo.']
];

const repairs = {
 kitchen:['Me quedé esperando para usar la cocina.','¿Me avisas cuando acabes la próxima vez?','Sí, tiene sentido. Así puedes organizarte.'],
 noise:['Con la tele tan alta me costó concentrarme.','¿Puedes bajarla cuando esté estudiando o durmiendo?','No me di cuenta. Puedo bajarla.'],
 dishes:['Se quedaron los platos en la cocina y me tocó hacer sitio.','¿Puedes recogerlos cuando termines?','Vale, los recogeré yo.'],
 prank:['La broma de antes no me hizo gracia.','Prefiero que no vuelvas a bromear conmigo con eso.','Entendido. Me pasé, perdona.'],
 no_show:['Me quedé esperando y al final no viniste.','Si no puedes venir, prefiero que me avises.','Tienes razón. Tendría que haberte avisado.']
};

function choose(conversation, variants, previous, key) {
 let hash=2166136261;
 for(const char of conversation.id??'')hash=Math.imul(hash^char.charCodeAt(0),16777619)>>>0;
 const excluded=new Set(previous.filter(c=>c.dialogueKey===key)
  .slice(0,Math.min(2,variants.length-1)).map(c=>c.dialogueVariant));
 const available=variants.map((_,i)=>i).filter(i=>!excluded.has(i));
 const variant=available[hash%available.length];
 conversation.dialogueKey=key;
 conversation.dialogueVariant=variant;
 return [...variants[variant]];
}

export function buildDialogue(conversation,{plan,conflict,recent=[],uneasy=false}={}) {
 if(plan && plans[plan.kind]){
  const key='plan:'+plan.kind;
  return choose(conversation,plans[plan.kind],recent,key);
 }
 if(conversation.story==='repair'){
  const [issue,request,reply]=repairs[conflict?.kind??(conflict?'kitchen':'')]
   ?? ['Oye, lo de antes me sentó mal.','Solo quería que lo supieras.','Gracias por decírmelo. Te escucho.'];
  const affected=conflict?.incidents?.at(-1)?.waiting;
  const concern=issue+' '+request;
  return affected===conversation.participants[1]
   ? ['Oye, ¿podemos hablar de lo de antes?',concern,reply]
   : [concern,reply,'Gracias por escucharme. A ver cómo nos va la próxima vez.'];
 }
 if(conversation.story==='prank'){
  const variants=conversation.prankOffended ? [
   ['He cambiado tu fondo de pantalla por una patata.','Pues no me toques el ordenador, en serio.','Vale, lo vuelvo a poner como estaba. Perdona.'],
   ['Dicen que hoy limpias tú toda la casa… ¡Es broma!','Pues no me ha hecho ninguna gracia.','Vale, me he pasado. Lo dejo aquí.'],
   ['Te había escondido el mando debajo del cojín.','Llevo un rato buscándolo. No tiene gracia.','Toma. La próxima te pregunto antes de hacer el tonto.']
  ] : [
   ['Dicen que hoy limpias tú toda la casa… ¡Es broma!','Claro. ¿Y tú qué haces, supervisar desde el sofá?','No cuela, ¿eh? Va, si toca limpiar te echo una mano.'],
   ['Te he reservado una reunión urgente con la fregona.','Dile que le mande un correo a mi representante.','Tu representante es el cubo y ya ha confirmado.'],
   ['He puesto una foto tuya de vigilante de la nevera.','Perfecto. Primera orden: nadie toca mi yogur.','Acabas de tomarte el cargo demasiado en serio.'],
   ['Han llamado para darte un premio a la siesta.','Lo recojo después de dormir.','Ese compromiso con la profesión es lo que valora el jurado.']
  ];
  return choose(conversation,variants,recent,conversation.prankOffended?'broma:molesta':'broma:amistosa');
 }
 if(uneasy)return ['¿Te viene bien que hablemos un momento?','Un momento sí. Hoy estoy un poco a mi aire.','Vale, si te apetece seguimos otro día.'];
 const topic=conversation.topic||'el día';
 if(topic!=='el día'){
  const key='tema:'+topic;
  const variants=[
   ['¿Qué es lo que más te engancha de '+topic+' últimamente?',
    'Cuando saco un rato para probar algo nuevo. Si hago siempre lo mismo, me aburro.',
    'Me pasa igual. La próxima vez que pruebes algo, cuéntame qué tal.'],
   ['Hace tiempo que no hablamos de '+topic+'. ¿Sigues dedicándole tiempo?',
    'Cuando puedo. Entre una cosa y otra, siempre acabo dejándolo para más tarde.',
    'Pues un día sacamos un rato. Me apetece retomarlo contigo.']
  ];
  if(interests[topic])variants.unshift(interests[topic]);
  return choose(conversation,variants,recent,key);
 }
 return choose(conversation,everyday,recent,'cotidiana');
}
