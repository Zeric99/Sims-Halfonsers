# Autonomía: seis entregas para probar en local

Alcance: primera versión funcional de las seis áreas propuestas. Los personajes son una simulación con reglas, recuerdos e intenciones; los diálogos se construyen con contexto y frases guardadas. No hay llamadas de IA de pago. No se ha publicado esta entrega.

## 1. Vida cotidiana y recuperación
- [x] Conservar las pruebas de rutas, reservas, necesidades y siete días.
- [x] Recuperar el mundo local tras reiniciar el servidor: archivo privado de pruebas, no accesible por HTTP ni incluido en Git.
- [x] Verificar dos escritores simultáneos y la recuperación del estado.
- [x] Presuponer descanso al regresar de día para evitar que todos vuelvan a dormir.

## 2. Iniciativas sociales
- [x] Elegir a quién invitar según relaciones, recuerdos y disponibilidad.
- [x] Permitir aceptación y rechazo según sociabilidad, compañía y tensión.
- [x] Caminar hasta el invitado y comenzar la charla solo al llegar.
- [x] Cancelar encuentros interrumpidos sin teletransportar a los vecinos.

## 3. Recuerdos con consecuencias
- [x] Guardar invitaciones, negativas, bromas, afinidad y reconciliaciones.
- [x] Influir en la elección y aceptación de futuros encuentros.
- [x] Reducir la influencia con el tiempo; limitar a 50 recuerdos y evitar duplicados.
- [x] Mostrar recuerdos e intención reciente en las fichas.

## 4. Pequeñas historias
- [x] Bromas leves que generan tensión, afinidad por gustos y charlas cotidianas.
- [x] Reconciliación cuando existe tensión y efectos aplicados una sola vez.
- [x] Registrar causas y desenlaces en el diario.

## 5. Conversaciones con contexto
- [x] Elegir diálogos según aficiones, recuerdos negativos y tensión.
- [x] Mantener las frases aportadas por visitantes como prioridad cuando se seleccionan.
- [x] Guardar el diálogo en la conversación compartida; bocadillos por turnos.

## 6. Experiencia para espectadores
- [x] Resumen de historias ocurridas desde que se abre la página.
- [x] Botón para ir a una conversación o encuentro activo.
- [x] Seguir y dejar de seguir con la cámara desde la ficha.
- [x] Abrir fichas desde la lista de actividades además del mapa.

## Verificación
- 82 pruebas automáticas, incluidas iniciativas, negativas, cancelación, recuerdos, diálogos, reparación, concurrencia y reinicio del almacén local.
- Ensayo determinista de siete días: 114 invitaciones aceptadas, 20 rechazadas, 13 bromas, 41 historias de afinidad y 70 charlas cotidianas. Reconciliación verificada en escenario separado con tensión previa; no se fuerza a que aparezca en cada semana.
- Navegador local: ficha, recuerdos, seguimiento de cámara y controles para detenerlo; sin errores de consola observados.
- El usuario prueba la duración, variedad y presentación en local antes de autorizar el despliegue.
- Estas entregas no cierran automáticamente todos los puntos del roadmap original ni sustituyen pruebas con Neon real.

El motor doméstico de fase 1 y su verificación local se detallan en [FASE1-VERIFICACION.md](FASE1-VERIFICACION.md). Los recuentos de historias son una muestra determinista y pueden variar cuando cambian las rutas o las reglas.
