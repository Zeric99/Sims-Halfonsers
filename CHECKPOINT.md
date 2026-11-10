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
- [ ] Convivencia completa: hay conversaciones, relaciones y un conflicto básico por turnos de cocina; faltan causas y planes más variados y validación integral del romance. Este trabajo corresponde a la fase 2 y no está terminado.

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

## Fase 2: convivencia
- [ ] Encuentros con consentimiento y conversación única por pareja. Base provisional con personas disponibles y próximas, bocadillos y diario; faltan invitaciones y consentimiento explícito más elaborado.
- [ ] Amistad, confianza, tensión y familiaridad dirigidas; efectos acotados y rendimientos decrecientes. Amistad, confianza y familiaridad básicas implementadas; faltan conflictos y comportamiento más rico.
- [ ] Conflictos motivados por sucesos, reparación y consecuencias de acuerdos. Hay una primera causa por espera de cocina y reparación condicionada a liberar el recurso; faltan otras causas y pruebas integrales.
- [ ] Romance ficticio solo si está configurado; interés unilateral y reciprocidad, rechazo y ruptura gradual. Módulo de propuestas probado aisladamente; no está integrado ni activo.
- [ ] Planes y compromisos domésticos con aceptación o rechazo.

## Fase 3: memoria y evolución
- [ ] Recuerdos subjetivos basados en eventos, relevancia y límites. Existen recuerdos básicos de conversaciones; falta ampliar su relevancia y uso.
- [ ] Objetivos y reflexión; habilidades y preferencias con cambios acotados.
- [ ] Módulo de cuestionario versionado, preguntas invertidas, omitidas y validación.
- [ ] Conservar progreso y recuerdos al modificar perfiles.

## Fase 4: experiencia y verificación
- [ ] Hora, actividad, diálogos legibles, ficha y diario; escena nocturna.
- [ ] Inspector de desarrollo y documentación de configuración/alojamiento.
- [ ] Pruebas de DST, reinicios, concurrencia, reintentos, reservas y determinismo.
- [ ] Pruebas de afinidad asimétrica, romance recíproco, conflicto, reparación y aprendizaje.
- [ ] Verificar que el despliegue de producción corresponde al commit final.

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
