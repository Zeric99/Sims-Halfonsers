# Sims Halfoncers

Simulación compartida de 14 vecinos. La web muestra la partida y el servidor decide qué sucede. El reloj del barrio tiene 29 minutos de día y 1 de noche por ciclo.

## Desarrollo local

Con Node.js 20 o posterior, desde este directorio:

```powershell
npm run dev
npm test
```

La web queda en http://127.0.0.1:8766/. Para arrancar otra partida de pruebas sin tocar los datos de la anterior:

```powershell
$env:SIMS_PORT = '8768'
$env:SIMS_DATA_DIR = '.local-data/phase4'
npm run dev
```

El servidor escucha en la interfaz local y guarda la partida en `.local-data/world.json` por defecto. Cada instancia local necesita su propio directorio de datos. El chat y las frases de prueba se comparten entre pestañas y se reinician con el proceso.

Abre `/?inspector` y despliega **Inspector del barrio** debajo del mapa para ver la versión, el último paso, las reservas y el estado de cada vecino. Desde el panel puedes abrir escenas aisladas de noche, diálogo, cocina y evolución. Las escenas usan una partida de prueba independiente.

`npm run test:domestic` simula siete días con tres semillas y comprueba recursos, necesidades y recuperación desde JSON. `npm run test:stories` ensaya las interacciones sociales.

## Alojamiento

El proyecto `halfonsers/sims-halfonsers` de Vercel está conectado a `Zeric99/Sims-Halfonsers`, rama `main`. Sirve la web y las funciones de `api/`. Las funciones usan `DATABASE_URL`, configurada en Vercel para el entorno correspondiente, y crean sus tablas de Neon si faltan. Para un entorno de pruebas remoto, usa una base de datos distinta de la de producción.

Tras publicar, comprueba el estado de Vercel en el commit de GitHub. En el detalle del despliegue verifica que ese commit corresponde al entorno Production y al dominio `sims-halfonsers.vercel.app`. Abre el dominio y comprueba el reloj, la ficha y el diario en dos pestañas. Las pruebas locales de reintento y reinicio usan un almacén de prueba. La concurrencia entre instancias y la persistencia del chat en Neon se comprueban en el entorno remoto correspondiente.
