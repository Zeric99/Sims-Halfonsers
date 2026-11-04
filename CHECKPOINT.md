# Checkpoint: Barrio vivo de Sims Halfonsers

Fuente: barrio-vivo-especificacion.md (4 noviembre 2026), con las aclaraciones posteriores del usuario. Repositorio: Zeric99/Sims-Halfonsers; producción: https://sims-halfonsers.vercel.app/.

## Decisiones posteriores que prevalecen
- Solo vida doméstica; sin empleos exteriores, centro comercial ni mudanzas.
- Simulación compartida en Vercel y Neon. Los visitantes observan.
- Sin visitantes durante más de 90 segundos no se generan sucesos ni cambios sociales. Al regresar se presupone vida cotidiana, se conservan relaciones y recuerdos y se inicia en habitaciones según la hora de Madrid.
- No usar almacenamiento local como estado canónico. El código se actualiza directamente en GitHub.

## Estado comprobado
- [x] Escena Three.js existente, 14 personajes y nombres.
- [x] Perfiles ficticios provisionales, gustos, necesidades y reloj configurado.
- [x] Estado compartido en Neon, comparación por versión y recuperación básica.
- [x] Web en Vercel conectada al repositorio original.
- [x] Panel de actividades e interpolación básica compartida.
- [x] Suspensión de sucesos sin visitas.
- [ ] Trayectos reales por puertas y objetos; las rutas y gestos actuales son provisionales.
- [ ] Comprobación integral con dos clientes y reinicios.
- [ ] Toda la convivencia y comportamiento social de esta especificación.

## Fase 1: motor doméstico
- [ ] Separar identidad, perfil, estado y aprendizaje; validar esquema y migraciones.
- [ ] Reloj real y de pruebas inyectable, tiempo UTC y horarios Europe/Madrid con DST.
- [ ] Necesidades por tiempo, comida, sueño con histéresis, higiene, compañía y diversión; documentar o añadir baño.
- [ ] Acciones con precondiciones, utilidad, duraciones, interrupciones y resultados únicos.
- [ ] Recursos con capacidad, reservas, vencimiento y alternativas.
- [ ] Habitaciones, puertas y rutas válidas sin atravesar muebles; estados de ejecución.
- [ ] Cocina/comida, ocio, estudio, ordenador, descanso y limpieza.
- [ ] Estado canónico transaccional, control de concurrencia y eventos idempotentes.
- [ ] Dos clientes, reconexión, reinicio y escenarios de 7 días con semillas.

## Fase 2: convivencia
- [ ] Encuentros con consentimiento y conversación única por pareja.
- [ ] Amistad, confianza, tensión y familiaridad dirigidas; efectos acotados y rendimientos decrecientes.
- [ ] Conflictos motivados por sucesos, reparación y consecuencias de acuerdos.
- [ ] Romance ficticio solo si está configurado; interés unilateral y reciprocidad, rechazo y ruptura gradual.
- [ ] Planes y compromisos domésticos con aceptación o rechazo.

## Fase 3: memoria y evolución
- [ ] Recuerdos subjetivos basados en eventos, relevancia y límites.
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
