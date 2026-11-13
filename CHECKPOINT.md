# Checkpoint: Barrio vivo de Sims Halfonsers

Fuente: barrio-vivo-especificacion.md (4 noviembre 2026), con las aclaraciones posteriores del usuario. Repositorio: Zeric99/Sims-Halfonsers; producción: https://sims-halfonsers.vercel.app/.

## Decisiones posteriores que prevalecen
- Solo vida doméstica; sin empleos exteriores, centro comercial ni mudanzas.
- Simulación compartida en Vercel y Neon. Los visitantes observan.
- Sin visitantes durante más de 90 segundos no se generan sucesos ni cambios sociales. Al regresar se presupone vida cotidiana, se conservan relaciones y recuerdos y se inicia en habitaciones.
- Reloj ficticio compartido: 29 minutos reales de día (07:00–23:00 del juego) y 1 de noche. La hora sigue el ciclo al volver, pero no se inventan sucesos sociales durante la ausencia.
- En producción, estado canónico en Neon. Por instrucción posterior del usuario, esta entrega se desarrolla y prueba localmente; no publicar hasta que lo indique. El mundo de ensayo persiste solo en el servidor local.

## Estado comprobado
- [x] Escena Three.js existente, 14 personajes y nombres.
- [x] Perfiles ficticios provisionales, gustos, necesidades y reloj ficticio compartido.
- [x] Estado compartido en Neon, comparación por versión y recuperación básica.
- [x] Web en Vercel conectada al repositorio original.
- [x] Panel de actividades e interpolación básica compartida.
- [ ] Diario lateral y chat con nombre libre. El código de producción guarda mensajes en Neon; el servidor local permite probar envío y lectura entre pestañas usando memoria temporal. Queda comprobar el envío y la persistencia reales en Vercel/Neon tras desplegar.
- [x] Suspensión de sucesos sin visitas.
- [ ] Trayectos reales por puertas y objetos; las rutas y gestos actuales son provisionales. Se han comprobado 56 rutas desde habitaciones hacia destinos habituales contra la rejilla de obstáculos; En la rama principal se ha ajustado la rejilla para incluir el soporte de pesas y mejorar las medidas de camas, sillas y baño; se han comprobado rutas desde las habitaciones al gimnasio. Sigue pendiente la comprobación visual de los trayectos y objetos de la escena real.
- [ ] Comprobación integral con dos clientes y reinicios. Dos pestañas de producción mostraron el mismo diario y un cliente recuperó el estado al recargar; faltan pruebas con Neon de concurrencia, desconexión y reinicio del servicio. Las pruebas con almacenamiento simulado fuerzan dos lecturas simultáneas, verifican el reintento sin pérdida ni duplicación y reconstruyen un cliente desde el estado serializado.
- [x] Fase 2 de convivencia implementada y verificada en el servidor local. La web pública conserva la entrega de fase 1.

## Preparación para la fase 1
- Las ramas de personajes, gimnasio y fichas están integradas y publicadas en producción. La batería contiene 64 pruebas; dos pestañas de producción mostraron el mismo diario y un cliente recuperó el estado al recargar. El servidor local usa memoria temporal y no verifica Neon ni el envío real del chat.
- [x] Repositorio original conectado a Vercel y estado compartido en Neon.
- [x] Perfiles independientes por mundo, para que una simulación no modifique los valores iniciales de otra.
- [x] Pruebas ejecutables con `npm test` y flujo de GitHub Actions para cambios en main y pull requests.
- [x] Escenarios de siete días y reanudación de un estado serializado; estas pruebas no sustituyen la comprobación con dos clientes reales.
- Fase 1 implementada y verificada en local; ver el cierre y la evidencia siguientes. La aceptación remota sigue separada.

## Fase 1: motor doméstico — implementada y verificada en local

Evidencia detallada en [FASE1-VERIFICACION.md](FASE1-VERIFICACION.md). Cierre de implementación y aceptación local; las pruebas con Neon real quedan separadas más abajo. No se ha publicado esta entrega.

- [x] Separar identidad/perfil de origen, estado de ejecución y aprendizaje; copias independientes, sustitución de perfil conservando progreso, validación previa y migraciones compatibles.
- [x] Reloj ficticio compartido: 29 minutos de día y 1 de noche, con migración y límites probados.
- [x] Necesidades por tiempo: comida, sueño con histéresis, higiene, baño, compañía y diversión; calibración de siete días en tres semillas y recuperación gradual tras llegar.
- [x] Acciones con precondiciones, utilidad, duraciones, interrupciones urgentes y resultados únicos.
- [x] Recursos con capacidad, reservas, vencimiento y alternativas: sofá de tres plazas, cocina/baño/gimnasio exclusivos y camas/ordenadores individuales.
- [x] Habitaciones, puertas, rutas contra obstáculos y estados de ejecución. Catorce secuencias completas de comida y rutas al jardín/gimnasio comprobadas; revisión visual local de las posturas.
- [x] Cocina/comida con tres recetas, ocio, estudio, ordenador, descanso y limpieza. Nevera → fogones → mesa; aseo frente al lavabo y limpieza frente a la encimera.
- [x] Estado canónico con escritura condicional por versión, reintentos de concurrencia y eventos/resultados idempotentes; persistencia local para el ensayo.
- [x] Dos clientes HTTP, reconexión, parada/reinicio real del servidor local y escenarios de siete días con semillas y recuperación determinista.

### Aceptación remota pendiente después de la prueba local
- [ ] Ejecutar estas comprobaciones contra Neon real y varias instancias: concurrencia, desconexión/reconexión, reinicio y persistencia de chat/frases. No se han marcado como realizadas con Neon.
- [ ] Publicar únicamente cuando lo indique el usuario y comprobar el commit final en Vercel.

## Fase 2: convivencia — implementada y probada en local

- [x] Encuentros consentidos y una conversación compartida. Los vecinos llegan por rutas accesibles y hablan cuando están juntos.
- [x] Amistad, confianza, familiaridad y tensión dirigidas. Influyen en a quién buscan y en si aceptan. Los efectos se acotan, se reducen al repetir tema y tienen umbrales distintos para entrar y salir de una etiqueta de relación.
- [x] Planes domésticos para jugar, cocinar, ver anime y entrenar. Propuesta, rechazo o cambio de hora, agenda, rutas, reservas, ejecución, cancelación y plantón.
- [x] Conflictos por turnos de cocina, ruido, platos, bromas y plantones. La reparación tiene una petición concreta. Cumplir una conducta recupera parte de la confianza y un incumplimiento deja constancia en el diario.
- [x] Romance recíproco opcional, con interés por dirección, negativas con espera y ruptura por problemas acumulados. Se prueba con perfiles ficticios configurados para ello. Los vecinos del reparto tienen el romance desactivado por defecto.
- [x] Agenda, fichas y diario muestran el hilo del encuentro. Los bocadillos compartidos reflejan el tema y el mapa muestra la actividad.

Verificación local del 11 de noviembre de 2026: 90 pruebas pasadas, tres simulaciones de siete días (semillas 19, 42 y 73184) con 147 planes completados entre ellas, sin compromisos solapados ni pérdida de las reservas activas. Se comprobó la reanudación desde JSON, la ruptura en un escenario dirigido y los encuentros en navegador. La prueba del navegador está disponible en http://127.0.0.1:8767/ y la escena aislada en http://127.0.0.1:8767/?qa=social&phase=anime. Despliegue de esta fase pendiente.

## Fase 3: memoria y evolución — implementada y probada en local

- [x] Recuerdos subjetivos ligados a sucesos, con emoción, importancia, caducidad y límite de 50 por vecino. Su relevancia influye en la afinidad y las decisiones sociales.
- [x] Reflexión nocturna con una experiencia positiva, un problema pendiente si existe y un objetivo. Los objetivos influyen en la actividad o compañía que elige cada vecino y registran su progreso, cumplimiento, caducidad o cancelación.
- [x] Habilidades y preferencias graduales. La práctica de recetas acorta la preparación, los planes dejan preferencias según actividad y compañía y las quejas repetidas por el volumen pueden enseñar a bajar la tele en ese contexto.
- [x] Cuestionario de personalidad versionado, con preguntas invertidas, respuestas opcionales y validación. El módulo aplica el perfil sin borrar identidad, estado, recuerdos, relaciones, habilidades ni objetivos. La pantalla del cuestionario sigue prevista para más adelante.
- [x] La ficha muestra los recuerdos relevantes, la reflexión, el objetivo y las habilidades.

Verificación local con 100 pruebas y tres simulaciones de siete días. Se comprobó el resultado en la ficha de Eric después de un plan con Linkal y la carga de la partida local anterior. Escena reproducible en http://127.0.0.1:8767/?qa=evolution.

## Fase 4: experiencia y verificación

- [x] Hora y escena nocturna sincronizadas con el reloj compartido. Luces cálidas en las viviendas, actividad visible, bocadillos, ficha y diario comprobados en el navegador local.
- [x] Inspector local con versión, último paso, reservas, necesidades y enlaces a escenas aisladas. Configuración y alojamiento documentados en [README.md](README.md).
- [x] Pruebas locales de ambos cambios de hora de Madrid, reinicio, concurrencia, reintentos, reservas y determinismo.
- [x] Pruebas de afinidad asimétrica, romance recíproco, conflicto, reparación y aprendizaje.
- [ ] Confirmar el commit de fase 4 en Vercel después de publicarlo. GitHub devuelve éxito de Vercel para la entrega anterior, el commit de fase 3 2575043.

Verificación local del 13 de noviembre de 2026 con 101 pruebas pasadas y revisión de la escena nocturna, el inspector y los cinco turnos del diálogo de prueba. Partida en http://127.0.0.1:8768/?inspector.

## Fase 5: modo espectador

- [x] Cámara opcional que sigue los encuentros en directo, da prioridad a las reconciliaciones, bromas y planes compartidos, y explica qué está pasando bajo el mapa.
- [x] El plano sigue a los participantes hasta que termina el encuentro. Si no hay uno, muestra una actividad cotidiana o una vista general.
- [x] Se puede recuperar el control con «Cámara libre» o al mover el mapa. El encuadre deja sitio para los bocadillos.
- [x] Verificación local: 103 pruebas pasadas y escenas de [broma](http://127.0.0.1:8769/?qa=spectator&phase=prank), [reconciliación](http://127.0.0.1:8769/?qa=spectator&phase=repair) y [cocina](http://127.0.0.1:8769/?qa=spectator&phase=cooking).
- [ ] Publicar y verificar la fase 5 en Vercel cuando se solicite.

## Fase 6: escenas con más vida

- [x] Gestos de quien habla y escucha; reacciones distintas a una broma que hace gracia o que cae mal, y posturas más contenidas al reconciliarse.
- [x] La cocina muestra ingredientes, sartén con vapor y emplatado. En la rutina individual se abre la nevera y los vecinos llevan los ingredientes y el plato.
- [x] Salones con distintos acentos y detalles, rincón de picnic en el jardín y bocadillos más compactos que buscan espacio libre alrededor de las caras.
- [x] Muletillas por vecino desde la ficha. Se guardan en el catálogo compartido y se seleccionan al abrir una conversación, para que todos vean el mismo turno con la muletilla al principio o al final.
- [x] Verificación local: 107 pruebas pasadas; comprobación en navegador de cocina, broma y guardado desde la ficha. La prueba HTTP confirma que el catálogo sigue disponible tras reiniciar el servidor.
- [ ] Publicar y comprobar el catálogo compartido con Neon en Vercel cuando se solicite.

Prueba local: [juego](http://127.0.0.1:8770/), [cocina](http://127.0.0.1:8770/?qa=spectator&phase=stove), [broma que hace gracia](http://127.0.0.1:8770/?qa=spectator&phase=laugh) y [broma que cae mal](http://127.0.0.1:8770/?qa=spectator&phase=offended).

## Fase 7: eventos de grupo

- [x] Cenas, noches de anime, torneos de videojuegos y barbacoas surgen automáticamente. Cada invitado puede aceptar, rechazar o estar ocupado. Se necesitan al menos tres vecinos.
- [x] Los asistentes caminan al rincón del jardín. La agenda muestra quién va y en qué parte del evento están; el modo espectador sigue al grupo y los bocadillos alternan entre los participantes.
- [x] Cada evento tiene tres momentos, objetos propios y diálogos con variantes. El torneo tiene ganador; una comida puede terminar con más afinidad o con un conflicto por recoger los platos.
- [x] Los asistentes guardan recuerdos y aprenden del resultado. Las urgencias permiten abandonar el grupo. La ausencia de espectadores no genera resultados, recuerdos ni cambios en las relaciones.
- [x] Verificado en local con 110 pruebas, tres simulaciones de siete días y la revisión de la barbacoa y el acceso desde la agenda en el navegador.
- [ ] Publicar y verificar en Vercel cuando se solicite.

Prueba local: [juego](http://127.0.0.1:8771/), [cena](http://127.0.0.1:8771/?qa=group&phase=dinner), [anime](http://127.0.0.1:8771/?qa=group&phase=anime), [torneo](http://127.0.0.1:8771/?qa=group&phase=tournament) y [barbacoa](http://127.0.0.1:8771/?qa=group&phase=barbecue).

## Fase 8: historias de varios días

- [x] Las crónicas agrupan los sucesos relacionados del diario en inicio, giro y desenlace. Incluyen los conflictos y sus acuerdos, los plantones y segundos intentos, y los eventos de grupo.
- [x] El mundo compartido conserva los hitos hasta 21 días de juego, con un máximo de 900. Al volver, el resumen destaca los cambios desde el último punto leído en ese navegador.
- [x] Cada momento destacado tiene un enlace a su capítulo y una tarjeta PNG para descargar.
- [x] Verificado en local con 113 pruebas y una escena de tres días: queja, acuerdo y cumplimiento. Probadas la descarga y la apertura directa del desenlace en el navegador.
- [ ] Publicar y verificar en Vercel cuando se solicite.

Prueba local: [juego](http://127.0.0.1:8772/) y [desenlace de la escena de ejemplo](http://127.0.0.1:8772/?qa=chronicle#momento=casa%3A12).

## Fase 9: guía del espectador y vista del barrio

- [x] La guía muestra escenas en directo y abre la cámara en la que elijas. Si la escena tiene antecedentes, enlaza al capítulo correspondiente.
- [x] Los planes confirmados muestran cuánto falta según el reloj compartido; los que ya pasaron dejan de aparecer.
- [x] Base cuadrada de 40 × 40 y dos vistas ortográficas: isométrica y cenital. La rueda sigue acercando el mapa y el arrastre permite girar en 3D o desplazar el plano cenital.
- [x] Bocadillos más pequeños con fondos semitransparentes.
- [ ] Publicar y verificar en Vercel cuando se solicite.

Prueba local: [juego](http://127.0.0.1:8774/) y [guía con una reconciliación en directo](http://127.0.0.1:8774/?qa=guide).

## Fuera de alcance por ahora
Cuentas y formulario completo, edición visual avanzada, IA generativa obligatoria, economía, envejecimiento, exteriores, empleo y mudanzas.

## Últimos avances preparados para producción
- Validación previa de posiciones, trayectos y acciones; una entrada dañada no modifica parcialmente a los demás vecinos. Validación ampliada en local a etapas de comida, perfil, aprendizaje, relaciones, reservas y estado doméstico.
- Ciclo actualizado a 29 minutos de día y 1 de noche; reloj compartido y migración probados, pendiente de comprobación en producción.
- Alternativa de afición para vecinos cuyo gimnasio esté ocupado; probada mediante pruebas automatizadas.
- Recuperación de reservas huérfanas y reparación del vencimiento durante acciones activas; verificado mediante pruebas automatizadas.
- Validación temprana de las necesidades de todos los vecinos, con pruebas que garantizan que un dato corrupto no modifica parcialmente el mundo y que los estados antiguos sin necesidad de baño siguen migrando.
- La web, los modelos articulados, las frases compartidas y las animaciones están publicados en Vercel. El nuevo ciclo, el salseómetro y los ajustes de validación y reservas se incluyen en este despliegue; falta comprobarlos en producción.

## Entrega local de autonomía (pendiente de prueba del usuario)
- Ver [AUTONOMIA.md](AUTONOMIA.md): las seis áreas divididas en pasos y su verificación.
- Iniciativas con aceptación/rechazo y recorrido físico, recuerdos que influyen en decisiones, historias y diálogos contextuales.
- Resumen de visita, intención y recuerdos en fichas y seguimiento de cámara.
- Mundo de prueba local persistente con escritura por versión; no se utiliza en Vercel.
- 82 pruebas automáticas, ensayo de siete días en tres semillas y comprobaciones visuales. No publicado. La implementación de fase 1 queda verificada en local; la aceptación con Neon real sigue pendiente y está identificada por separado.

## Cierre local de fase 1 (10 noviembre 2026)
- Ver [FASE1-VERIFICACION.md](FASE1-VERIFICACION.md): implementación, escenarios reproducibles, pruebas y límites de la aceptación local.
- La producción no contiene todavía esta entrega. No confundir comprobaciones históricas de Vercel con las pruebas locales nuevas.

## Interfaz inmersiva y conversaciones personales — 13 noviembre 2026
- [x] Juego a ventana completa al entrar; chat, directo, historias y vecinos opcionales, con vista lateral y control de pantalla completa.
- [x] POV de los vecinos con cámara desde la cabeza y salida al mapa.
- [x] Afinidades Madrid (Eric, Adrián, Pablo) y Barça (Arian, Aisuke, David), Delos comentando TikToks, sin asignar equipo al resto.
- [x] Anécdotas por personaje, convivencia, conspiraciones absurdas ficticias y variantes de bromas.
- [x] Evitar guiones recientemente oídos por cualquiera de los dos participantes, también con otras parejas; elección determinista compartida.
- [x] Mei puede priorizar una pausa en el jardín cuando se satura, respetando necesidades y el intervalo de fumar existente.
- [x] 123 pruebas automáticas superadas. Interfaz comprobada en navegador local en vista estrecha y de escritorio.

## Más dinamismo — 13 noviembre 2026
- [x] Más invitaciones espontáneas, incluso durante juegos, con prioridad cuando no hay ninguna charla; hasta tres parejas de este sistema.
- [x] Buscar otros puntos y vecinos si un mueble bloquea el encuentro; preservar consentimiento, necesidades y compromisos.
- [x] Saludo articulado de mano al empezar una charla normal, con transición a hablar/escuchar.
- [x] Necesidad de baño más frecuente, urgencia antes y estancia visible de ocho minutos simulados.
- [x] 125 pruebas superadas; tres ensayos de seis horas diurnas con máximos de silencio de 45–58 segundos reales. Saludo comprobado en navegador local.
