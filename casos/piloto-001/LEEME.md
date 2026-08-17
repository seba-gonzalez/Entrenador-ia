# Caso `piloto-001` — el circuito completo, con alumna ficticia

**Marta Ruiz no existe.** Todo lo que hay en esta carpeta es sintético: la
persona, su historia, sus molestias, sus cargas, sus respuestas y lo que el
entrenador le contesta. **Ningún dato de esta carpeta puede presentarse como
evidencia sobre una persona** (D-019).

Existe para demostrar el circuito entero dentro de la experiencia web ya
aprobada:

```
datos del alumno → sesión → revisión → publicación → vista alumno
       → ejecución → feedback → devolución → borrador de la sesión siguiente
```

## Qué hay

| Archivo | Qué es | Quién lo escribe |
|---|---|---|
| `alumno.json` | Lo que se sabe de ella, **y lo que no**: cada campo con su estado epistémico | Entrenador (onboarding) |
| `sesiones/sesion-piloto-001.json` | Documento interno de la sesión 1: v1 del sistema, v2 del entrenador, observaciones, checklist, publicaciones | Entrenador |
| `publicado/1.json` + `indice.json` | El artefacto que ve la alumna, con su hash | Extracción manual |
| `ejecuciones/sesion-piloto-001.json` | Lo que realmente pasó, copiado desde la vista | La alumna, en el navegador |
| `feedback/sesion-piloto-001.json` | Lo que ella cuenta después, en sus palabras | La alumna, en el navegador |
| `devoluciones/sesion-piloto-001/1.json` + `indice.json` | La respuesta del entrenador, en tres capas, publicada y con hash | Entrenador |
| `sesiones/sesion-piloto-002.json` | **Borrador** de la sesión 2, construido después de la devolución | Sistema, sin revisar aún |

La ejecución y el feedback **no se escribieron a mano**: salieron de recorrer la
vista en un navegador real y pegar lo que el botón copió. Es la única forma de
que prueben algo.

## Cuándo pasó cada cosa

| Momento | Fecha |
|---|---|
| Ficha de la alumna (onboarding) | jueves 13 de agosto de 2026, 18:30 |
| Sesión v1, escrita por el sistema | viernes 14, 08:45 |
| Sesión v2, corregida por el entrenador | viernes 14, 09:15 |
| Aprobación y publicación | viernes 14, 09:20 y 09:30 |
| **Ejecución y feedback** | **domingo 16, 19:06** |
| Lectura del entrenador y devolución publicada | lunes 17, 20:10 y 20:15 |
| Borrador de la sesión 2 | lunes 17, 21:05 |

Las dos fechas en negrita **no son ficticias**: son la hora real en que se
recorrió la vista y se copiaron los archivos, y por eso están en UTC dentro del
JSON. El resto de la cronología se construyó alrededor de ellas, no al revés.
Falsear el momento en que se generó un registro sería el mismo error que
rellenar una carga desconocida.

## Lo que este caso está demostrando

### 1. Un desconocido no se rellena con algo plausible

Marta lleva dos años sin entrenar de forma constante. En `alumno.json`,
`carga_sentadilla`, `carga_press_banca`, `carga_remo` y
`tolerancia_a_la_frecuencia` están en `estado: "desconocido"`, cada uno con
`por_que_se_desconoce`. No hay ningún número.

La **v1 de la sesión 1, escrita por el sistema, comete el error a propósito**:
prescribe 60 kg de sentadilla, 12 de press y 35 de remo. Son tres invenciones
con apariencia de prescripción. La observación `dato_inventado` las señala y la
v2 del entrenador las sustituye por una tarjeta que explica cómo encontrar la
carga por aproximación y RIR, dejando el campo `carga` como
`prescrito: false` con su motivo.

Los 70 kg **nacen de la ejecución**, no de una estimación:

| Momento | Qué dice sobre la sentadilla |
|---|---|
| `alumno.json` | `desconocido` — «no hay referencia actual» |
| `publicado/1.json` | carga no prescrita, con protocolo para encontrarla |
| `ejecuciones/…json` | 70 kg × 8, RIR 3 / 3 / 2 — registrado por ella |
| `devoluciones/…/1.json` | referencia con `derivado_de` apuntando a esas series |
| `sesiones/sesion-piloto-002.json` | 75 kg, y el texto dice de dónde sale |

`lo desconocido → propuesta conservadora → prueba → ejecución → nueva referencia`.

### 2. Restringir por un dato que no aplica también es un error

La v1 añade una precaución lumbar en la sentadilla. La molestia de Marta aparece
al final del día tras horas sentada, nunca entrenando. La observación
`sobre_restriccion` la retira y la sesión explica por qué ese dato no condiciona
el entrenamiento — y qué sí sería información nueva.

### 3. Las cinco capas no se mezclan

| Capa | Dónde vive |
|---|---|
| PROGRAMADO | `publicado/1.json` |
| EJECUTADO | `ejecuciones/…json`, campo `series[].ejecutado` |
| SENSACIÓN | `ejecuciones/…json`, campo `sensaciones[]` — y `feedback/…json` |
| INTERPRETACIÓN | `devoluciones/…/1.json`, campo `entendido`, con `es_interpretacion: true` |
| DECISIÓN | `devoluciones/…/1.json`, campo `para_la_proxima`, separando `decision` de `observar` |

Los cuatro botones de sensación (`muy fácil` / `adecuado` / `muy exigente` /
`molestia o dolor`) **capturan, no adaptan**. Marcar «muy exigente» no baja
ninguna carga: lo lee una persona. Un bloque sin marcar no vale «adecuado»: sale
como `registrado: false` con su motivo.

Y lo que la alumna cree que causó algo no se convierte en un hecho. Ella dice que
la fuerza estuvo «demasiado fácil»; la devolución lo recoge literal en `dijo`, y
lo que el entrenador concluye de eso va aparte, rotulado como lectura suya.

### 4. La ausencia sigue siendo un dato

La devolución reconoce que la cuarta serie de sentadilla que Marta cuenta **no
está registrada**: la ficha sólo tenía tres casillas. Se dice con esas palabras
—«la tengo por lo que me cuentas y no por el registro»— y queda como algo a
arreglar en la ficha. No se completa el registro con lo que ella contó.

### 5. El borrador de la sesión 2 no está limpio, y así debe estar

`sesion-piloto-002.json` está en `estado: "borrador"`: sin `version_aprobada`,
sin `checklist_aprobacion` y sin `publicaciones`, porque nadie la ha aprobado.
Lleva **tres observaciones sin resolver**, y una de ellas es la misma familia de
error de la sesión 1 en una forma más difícil de ver: la devolución decidió
partir de 14 kg y 40 kg, pero **no decidió ningún incremento**, y el generador
puso 16 y 45 por su cuenta. Que el punto de partida sea real no convierte el
salto en un dato.

## Qué cambió en la sesión 2 por evidencia de la sesión 1

| Cambio | De dónde sale |
|---|---|
| Sentadilla 3 → 4 series y carga 75 kg | RIR 3/3/2 a 70 kg registrado + decisión de la devolución |
| Press y remo ya vienen con número (16 y 45 kg) | Las cargas 14 y 40 registradas en la ejecución |
| Desaparece la tarjeta de aproximación por RIR | Ya cumplió su función: las referencias existen |
| El bloque de acondicionamiento no cambia nada | Marcado `adecuado` y confirmado en el comentario libre |
| La sentadilla sigue sin advertencia lumbar | La molestia no apareció ni con 70 kg encima |
| La cuarta serie ya viene programada | Ella la hizo y no había dónde anotarla |

## Cómo verlo

Con el repositorio servido por HTTPS o desde `localhost` (`crypto.subtle` no
existe fuera de un contexto seguro, y sin él la vista **no muestra nada**):

```bash
python3 -m http.server 4173 --bind 127.0.0.1
# http://127.0.0.1:4173/app/alumno/?caso=piloto-001
```

`demo-001` sigue siendo el caso por defecto y no cambió.

## Publicar y devolver

Manual, igual que en `demo-001`, y por el mismo motivo: hace explícito el
congelamiento. La devolución se publica con exactamente el mismo mecanismo que
una sesión —archivo numerado, hash sha256 de sus bytes, entrada en su índice—
porque una devolución alterada pondría en boca de la alumna palabras que no dijo.

**No es una segunda publicación de la sesión.** §6.2 exige cero publicaciones
vigentes en cuanto la ejecución empieza; la devolución es otra entidad, con otra
fecha y otro índice.

## Lo que este caso NO es

No es H2. El lado del entrenador sigue siendo manual y en GitHub: no hay panel,
ni generación automática, ni adaptación. Tampoco es H6: `alumno.json` tiene la
forma epistémica correcta (D-004) pero no está versionado ni hay vista de perfil.
Es una instantánea inicial, para no nacer torcida.
