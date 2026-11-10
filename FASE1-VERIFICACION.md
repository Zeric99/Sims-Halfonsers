# Fase 1: entrega y aceptación local

Fecha: 10 de noviembre de 2026. Cambios preparados únicamente en el checkout local. La publicación y la aceptación con Neon real se harán después de la prueba del usuario.

## Motor doméstico implementado

| Punto del roadmap | Implementación y evidencia |
| --- | --- |
| Identidad, perfil, estado y aprendizaje | `profiles.js` define identidad/perfil de origen; `resident-state.js` construye copias independientes y sustituye perfiles conservando progreso. `world-schema.js` valida antes de migrar o mutar; se conservan estados antiguos compatibles. |
| Reloj compartido | 29 minutos de día, 1 de noche; pruebas de límites y migración sin saltos. |
| Necesidades | Tasas por tiempo, sueño con histéresis, saciedad/aseo/baño graduales solo tras llegar; compañía mediante conversaciones consentidas y diversión mediante actividades variadas. |
| Acciones | Selección por utilidad, disponibilidad, preferencias, horarios y necesidades; duración separada del trayecto, interrupción por urgencia, reserva liberada y resultados sin duplicar. |
| Recursos | Baño/cocina/gimnasio exclusivos, camas/ordenadores personales, sofá con tres plazas; vencimiento, reparación de reservas activas y eliminación de huérfanas; alternativas si un recurso está ocupado. |
| Rutas y ejecución | Rejilla con puertas y obstáculos; 14 habitaciones conectadas al jardín y gimnasio; cada etapa de las 14 recetas comprobada sobre obstáculos. Estados en camino, espera, actividad y sueño. Separación visual de vecinos con obstáculos. |
| Vida doméstica | Tres recetas con preparación/nutrición propias; nevera → ingredientes → fogones → cocinar → mesa → comer. Ordenador, estudio, sofá, aficiones, paseos, sueño, baño, aseo y limpieza de la encimera. La comida ensucia y limpiar reduce el desorden una sola vez. |
| Concurrencia y persistencia | Mismo protocolo de escritura condicional por versión en el núcleo compartido; colisiones reintentadas, eventos únicos y resultados idempotentes. Mundo local persistente en `.local-data/world.json`, protegido frente a lectura HTTP y excluido de Git. |
| Recuperación y ensayo prolongado | Dos clientes HTTP reales contra un servidor aislado, parada/reinicio del proceso y nueva conexión; el mundo y sus eventos se conservan. Tres ensayos de siete días y reanudación determinista desde JSON. |

La estructura persistida mantiene los campos existentes para conservar compatibilidad con el frontend y las partidas. La separación de responsabilidades no exige duplicar la identidad en otro objeto del JSON.

## Validación

- `npm test`: 82 pruebas. Incluyen esquema/migraciones, recuperación, reservas, interrupciones, comida, sueño, baño, rutas, encuentros, recuerdos y diálogos.
- `npm run test:domestic`: semillas 19, 42 y 73184; siete días por semilla, muestras cada 15 minutos del juego. Cada ensayo comprueba 9.408 observaciones de habitantes. Exige límites de necesidades, ausencia de reservas duplicadas, presencia de las actividades domésticas y reanudación determinista. Informe generado en `.local-data/domestic-report.json`.
- En los tres ensayos no hubo muestras de energía o baño por debajo de 10. La semilla 42 tuvo una muestra de saciedad por debajo de 10 entre 9.408 observaciones; las otras dos no tuvieron ninguna. Es un ensayo por muestreo, no una garantía sobre cualquier combinación futura de perfiles.
- `npm run test:stories`: aceptación/rechazo, bromas, afinidad y charlas durante siete días; reparación también comprobada con tensión previa en un escenario controlado.
- Navegador local: inspección de comida en mesa, cocinar, dormir, estudiar, usar el baño, asearse frente al lavabo, descansar en sofá y limpiar frente a la encimera; sin errores de consola observados. Las posturas proceden del planificador real.
- Escenas aisladas reproducibles en `/?qa=meal&phase=cooking`, `/?qa=meal&phase=eating`, `/?qa=sleep`, `/?qa=desk`, `/?qa=computer`, `/?qa=bath`, `/?qa=wash`, `/?qa=sofa` y `/?qa=clean`. Se indican como pruebas y no escriben en la partida compartida.

## Probar la entrega

Ejecutar `npm run dev` desde este directorio y abrir http://127.0.0.1:8766/. El servidor queda escuchando solo en el equipo local. Dos pestañas de ese servidor consultan el mismo mundo; no es almacenamiento independiente por visitante. Al cerrarlo y volverlo a iniciar, recupera la partida desde disco.

El chat y las frases del servidor de pruebas siguen siendo temporales entre reinicios. Sus endpoints de producción usan Neon; la persistencia local del mundo no verifica esos servicios remotos.

## Aceptación de producción pendiente

No se ha ejecutado un despliegue ni se ha utilizado una conexión real a Neon en esta entrega. Quedan por comprobar allí la concurrencia de instancias, desconexión/reconexión, reinicio del servicio y persistencia del chat/frases. Las pruebas locales no se presentan como evidencia de Neon. La ampliación de convivencia y romance del roadmap sigue en fases posteriores.
