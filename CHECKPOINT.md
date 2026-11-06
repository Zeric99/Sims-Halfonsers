# Checkpoint: Barrio vivo de Sims Halfonsers

Fuente: barrio-vivo-especificacion.md (4 noviembre 2026), con las aclaraciones posteriores del usuario. Repositorio: Zeric99/Sims-Halfonsers; producción: https://sims-halfonsers.vercel.app/.

## Decisiones posteriores que prevalecen
- Solo vida doméstica; sin empleos exteriores, centro comercial ni mudanzas.
- Simulación compartida en Vercel y Neon. Los visitantes observan.
- Sin visitantes durante más de 90 segundos no se generan sucesos ni cambios sociales. Al regresar se presupone vida cotidiana, se conservan relaciones y recuerdos y se inicia en habitaciones.
- Reloj ficticio compartido: 29 minutos reales de día (07:00–23:00 del juego) y 1 de noche. La hora sigue el ciclo al volver, pero no se inventan sucesos sociales durante la ausencia.
- No usar almacenamiento local como estado canónico. El código se actualiza directamente en GitHub.

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
- La fase 1 ya se ha comenzado; los puntos siguientes son trabajo pendiente, no requisitos previos bloqueantes.

## Fase 1: motor doméstico
- [ ] Separar identidad, perfil, estado y aprendizaje; validar esquema y migraciones. La envoltura rechaza versiones futuras, IDs duplicados y metadatos inválidos. En local también valida necesidades, posiciones y acciones antes de mutar el mundo y conserva la migración de versiones antiguas sin baño; falta completar la separación y validar los demás campos.
- [x] Reloj ficticio compartido: ciclo de 29 minutos de día y 1 de noche. El cambio y la migración sin saltos tienen pruebas automatizadas; comprobar el despliegue y la migración en producción.
- [ ] Necesidades por tiempo, comida, sueño con histéresis, higiene, compañía y diversión; la saciedad sube gradualmente al comer y el baño es una necesidad con recurso compartido. En la rama de prueba, aseo y baño recuperan sus necesidades gradualmente tras el trayecto, manteniendo compatibilidad con acciones antiguas. Se ha añadido una primera histéresis para evitar despertares prematuros y volver a acostarse con energía alta; faltan calibración y animaciones.
- [ ] Acciones con precondiciones, utilidad, duraciones, interrupciones y resultados únicos. El trayecto ya no consume el tiempo de actividad y dormir no recupera energía antes de llegar; el ocio puede interrumpirse por hambre, sueño o baño críticos cuando el recurso está disponible, liberando la reserva sin dar la recompensa; quedan precondiciones e interrupciones más completas.
- [ ] Recursos con capacidad, reservas, vencimiento y alternativas. La reserva dura todo el trayecto y la actividad. En local se liberan reservas huérfanas y se repara el vencimiento de las acciones activas. Si el gimnasio está ocupado, se puede escoger otra afición del perfil; quedan capacidades y alternativas más generales.
- [ ] Habitaciones, puertas y rutas válidas sin atravesar muebles; estados de ejecución. La ficha distingue en camino, esperando, durmiendo y realizando una actividad; falta comprobar visualmente las rutas y su interacción con los muebles.
- [ ] Cocina/comida, ocio, estudio, ordenador, descanso y limpieza. Implementadas acciones iniciales de comida, sueño, aseo, estudio y ocio; la cocina acumula desorden tras las comidas y puede limpiarse con reserva. La comida ahora recorre nevera, fogones y mesa con saciedad gradual y asiento; queda revisar visualmente las transiciones y añadir recetas y otras tareas.
- [ ] Estado canónico transaccional, control de concurrencia y eventos idempotentes.
- [ ] Dos clientes, reconexión, reinicio y escenarios de 7 días con semillas. Probados determinismo, siete días y reanudación desde un estado serializado en el núcleo, además de sueño durante el trayecto, duración de reservas e interrupciones por necesidades urgentes; faltan pruebas integrales con Neon, concurrencia y reconexión.

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
- Validación previa de posiciones, trayectos y acciones; una entrada dañada no modifica parcialmente a los demás vecinos. Pendiente ampliar la validación de etapas de comida y otros campos.
- Ciclo actualizado a 29 minutos de día y 1 de noche; reloj compartido y migración probados, pendiente de comprobación en producción.
- Alternativa de afición para vecinos cuyo gimnasio esté ocupado; probada mediante pruebas automatizadas.
- Recuperación de reservas huérfanas y reparación del vencimiento durante acciones activas; verificado mediante pruebas automatizadas.
- Validación temprana de las necesidades de todos los vecinos, con pruebas que garantizan que un dato corrupto no modifica parcialmente el mundo y que los estados antiguos sin necesidad de baño siguen migrando.
- La web, los modelos articulados, las frases compartidas y las animaciones están publicados en Vercel. El nuevo ciclo, el salseómetro y los ajustes de validación y reservas se incluyen en este despliegue; falta comprobarlos en producción.
