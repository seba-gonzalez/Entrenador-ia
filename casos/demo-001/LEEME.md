# Caso `demo-001` — demo anónimo

**Todo lo que hay en esta carpeta es sintético.** La persona, el deporte, las
fechas, las molestias, las observaciones del entrenador y las respuestas del
checklist son inventados. No corresponden a ningún alumno real y **ningún dato de
esta carpeta puede presentarse como evidencia sobre una persona** (D-019).

Existe para probar el mecanismo de H1 —separar los datos de una sesión de su
presentación— sin poner datos personales ni sanitarios reales en un repositorio
que sirve páginas públicas (D-002).

## Qué hay

| Archivo | Qué es | Quién puede verlo |
|---|---|---|
| `sesion.json` | Documento interno: versiones, observaciones, checklist, publicaciones | Entrenador |
| `publicado/1.json` | Artefacto extraído: solo el contenido de la versión aprobada | Alumno |
| `publicado/indice.json` | Qué publicación está vigente, con su hash | Alumno |
| `ejecuciones/` | Registros de lo ejecutado, pegados a mano tras copiarlos de la vista | Entrenador |

`publicado/1.json` **no contiene** las observaciones ni el checklist. No están
ocultos por CSS: no están en el archivo. Publicar es extraer, no filtrar (D-015).

## Relación con el material real

La forma y la complejidad estructural vienen del caso real que sirvió de
referencia: dos sesiones de fuerza en una semana de puesta a punto, una
articulación que condiciona la selección de ejercicios del tren inferior, otra
que limita la carga de empuje, un ejercicio opcional, un rodaje de carrera, días
de taper, descanso total y competencia de fin de semana.

Todo lo demás está sustituido. Las restricciones reales fueron reemplazadas por
equivalentes ficticios que preservan la estructura del problema —una articulación
que descarta unos patrones y tolera otros, y un umbral de carga— pero no
describen a nadie.

La cadena de versiones también está simplificada: aquí hay una v1 del sistema y
una v2 del entrenador con siete observaciones entre medio. El caso real tuvo otra
secuencia. Esta carpeta no reproduce esa historia; solo necesita una historia
con la misma forma para que el esquema tenga algo real que sostener.

## Dos cosas que todavía no existen

**Las familias de corrección son provisionales.** El vocabulario de familias
(V1-A) no está escrito, así que los valores de `observaciones[].familia` son
etiquetas de demostración, no vocabulario aprobado. Por eso el esquema no las
enumera: enumerarlas sería escribir metodología antes que el entrenador.

**El checklist es de demostración.** `checklist_version: "0.0-demo"` no
corresponde a ningún `checklist.json`; ese documento se redacta sobre el caso
real (V1-C). Los `item_id` siguen los dominios que la V1 debe cubrir
—calentamiento, estructura, pausas, holístico— para que el esquema quede
ejercitado, y nada más.

## Publicar

Manual, a propósito: hace explícito el congelamiento.

1. Copiar `versiones[n].contenido` de la versión aprobada a
   `publicado/{p}.json`, junto con `sesion_id`, `schema_version` y el bloque
   `publicacion`. Nada más — ninguna observación, ningún checklist.
2. Calcular `sha256sum publicado/{p}.json`.
3. Escribir ese hash en `publicado/indice.json` y en la entrada correspondiente
   de `sesion.json`, y marcar cuál queda `vigente`.

En H1 nada de esto se valida solo. La validación contra los esquemas y la
verificación de que el hash no cambia entre commits son H3.
