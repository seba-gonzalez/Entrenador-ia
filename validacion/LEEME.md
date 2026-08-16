# Validación

Comprueba que los datos del repositorio no se contradigan. Es **herramienta, no
producto**: vive aquí, tiene dependencias y nunca llega a un navegador. `/app/`
sigue siendo HTML y JavaScript plano sin build step ni dependencias (D-001), y
el workflow falla si alguna vez deja de serlo.

## Correrla

```bash
cd validacion && npm ci

node validacion/validar.mjs                        # desde la raíz del repositorio
node validacion/validar.mjs --raiz /otro/repo      # contra otro repositorio de datos
node validacion/validar.mjs --base origin/main     # añade la comprobación de inmutabilidad

cd validacion && npm run pruebas                   # contratos (20 + 21 + 12 + 30)
node validacion/pruebas/navegador.mjs              # la vista sobre demo-001 (80), necesita el repo servido
node validacion/pruebas/navegador-piloto.mjs       # el circuito del piloto (51), ídem
```

## Cómo encuentra los datos

**No los busca: se los dicen.** Cada repositorio declara en su
`validacion.config.json` dónde vive cada cosa. El público apunta a `casos/*/…`;
el privado apuntará a `alumnos/*/…`. El validador no sabe cuál es cuál.

Las sesiones, los índices, las ejecuciones, el feedback y las devoluciones se
relacionan **por `sesion_id`, nunca por su ubicación**. Por eso las rutas pueden
cambiar sin tocar una línea de código. Las publicaciones no se declaran: se
descubren desde cada índice, que las nombra y vive junto a ellas.

Hay **dos familias publicadas** y se cargan con el mismo código: las sesiones
(`indices`) y las devoluciones (`indices_devolucion`). Tienen forma idéntica
—índice con una vigente, archivos numerados, un hash por archivo— y comparten
implementación a propósito: el día que una deje de comprobarse como la otra,
será porque alguien lo decidió y no porque se duplicó el código y se actualizó
una sola copia.

## Qué comprueba

| Familia | Qué |
|---|---|
| `esquema` | Todo dato valida contra su contrato —sesión, ejecución, alumno, feedback, devolución— y el contenido publicado contra `$defs/contenido` |
| `integridad del hash` | El sha256 de los **bytes** del archivo coincide con lo que declaran el índice y `sesion.json`. Las devoluciones se acreditan igual: sólo contra su índice, porque no tienen documento interno que las registre |
| `estructura` | Una sola publicación vigente; índice y documento de acuerdo; sin archivos huérfanos ni índices que nombren lo que no existe; cada sección con su panel |
| `demo` | En un repositorio público, toda sesión, publicación, ejecución, ficha de alumno, feedback y devolución lleva `demo: true` |
| `referencias` | Ninguna referencia apunta al vacío: versiones, publicaciones, ejercicios de una ejecución, la sesión que nombra un feedback, y de qué ejecución y qué series sale cada referencia de una devolución |
| `inmutabilidad` | Una publicación o devolución ya servida no se modifica ni se borra; republicar es añadir (solo en PR) |

### Dos reglas que no son negociables

**El hash se calcula sobre los bytes del archivo, nunca sobre el JSON
reserializado.** Si CI canonicalizara y el navegador no, los dos hashes
divergirían sin que nada estuviera corrupto — y con el fallo cerrado de D-025
eso deja al alumno sin sesión.

**La única fuente de verdad es el archivo.** El índice y `sesion.json` son dos
declaraciones *sobre* ese archivo; se comprueban ambas contra él, nunca una
contra la otra. Una declaración que no exista no se inventa.

### Lo que NO comprueba, a propósito

Nada metodológico. Si alguna comprobación empezara a preguntar si una sesión
«tiene calentamiento», sería un defecto aunque funcionara: eso es el checklist,
y el checklist es un documento del entrenador (D-013, principio 1.2).

Tres invariantes del §12 no son comprobables todavía porque sus entidades no
existen: la justificación exigida por ítem del checklist (necesita
`checklist.json`, V1-C abierto), el estado por campo del perfil (H6) y los
campos de una reevaluación (H4).

## El repositorio privado consume esta misma implementación

Sin duplicar nada. Su workflow hace checkout de los dos repositorios:

```yaml
- uses: actions/checkout@v4                        # el repositorio de datos
- uses: actions/checkout@v4
  with:
    repository: seba-gonzalez/entrenador-ia
    path: .validador
- run: node .validador/validacion/validar.mjs --config validacion.config.json
```

Los esquemas viajan con el validador, no con los datos: el contrato es uno solo.

## Las pruebas, que son otra cosa

`comprobaciones/` valida **datos reales**. `pruebas/` valida **los contratos y
el producto** contra mutaciones sintéticas: que el esquema rechace lo que debe y
que la vista se comporte.

Las suites de navegador van separadas por caso. `navegador.mjs` vigila
`demo-001` y `navegador-piloto.mjs` vigila `piloto-001`; que la primera siga
pasando **sin haber sido tocada** es la evidencia de que el piloto no cambió lo
que ya funcionaba.

## La comparación visual se queda fuera de CI

Necesita el artefacto visual de referencia, que contiene datos personales y
sanitarios reales de una persona identificable y no puede vivir en un
repositorio público. `pruebas/navegador.mjs` omite esa comprobación y reporta 79
en lugar de 80, diciéndolo por consola.

Para hacerla en local: servir ese HTML en el puerto 4174 con el `estilos.css`
del repositorio enlazado en lugar de su `<style>` inline —así se mide el CSS que
está en el repositorio, no una copia— y volver a correr la suite.

## `navegador.mjs` escribe en el repositorio, a propósito

Las pruebas que comprueban que cambiar el dato cambia la vista **republican de
verdad**: modifican la publicación, recalculan su hash, actualizan el índice y
restauran ambos al terminar. Si el proceso se interrumpe a mitad,
`git checkout casos/` lo devuelve a su sitio. El workflow comprueba con
`git diff --exit-code` que no quedó nada tocado.
