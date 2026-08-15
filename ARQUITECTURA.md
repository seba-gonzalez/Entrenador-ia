# ARQUITECTURA — Entrenador IA (MVP)

**Estado:** dirección aprobada; base para aplicación
**Versión:** 0.2
**Fecha:** 2026-08-14

Este documento define la arquitectura técnica del MVP. No define metodología de
entrenamiento: la metodología vive en la Constitución, el Manual del Entrenador,
la Bitácora de Aprendizaje y el Libro de Casos. Lo que este documento sí hace es
definir **dónde termina el territorio de la herramienta y dónde empieza el del
entrenador**, y garantizar estructuralmente que esa frontera no se cruce.

Los puntos todavía no resueltos están marcados como `[ABIERTO V1-x]` y
listados completos en la sección 15. Ninguno bloquea el primer hito.

---

## 1. Principios de arquitectura

Cinco principios gobiernan todas las decisiones que siguen. Cuando una decisión
futura entre en conflicto con uno de ellos, gana el principio.

**1.1 El esquema es la frontera.**
Los contratos de datos (JSON Schema) los escribe el entrenador desde la
metodología. El código se adapta al esquema, nunca al revés. Este es el
mecanismo concreto de "la tecnología sirve a la lógica del entrenador".

**1.2 La metodología no vive en el código.**
El código puede *aplicar* una regla metodológica, nunca *contenerla*. Si un
umbral, una progresión, un criterio de dosificación o un mapeo de decisión
aparece escrito dentro del código, es un defecto — aunque funcione. Debe venir
de un documento o archivo de configuración que el entrenador posee.

**1.3 Nada se sobrescribe en silencio.**
Versiones, publicaciones y ejecuciones son registros acumulativos. Corregir
crea; no reemplaza. El historial es el producto, no un subproducto.

**1.4 Una inferencia nunca se presenta como un hecho.**
Todo dato sobre un alumno lleva su estado epistémico explícito. Ningún proceso
—validación, formulario, generador— puede rellenar un campo faltante con un
valor por defecto plausible.

**1.5 La ausencia es un dato, no un silencio.**
No responder, no ejecutar, no cerrar un ciclo son estados representables y
registrados. Nunca se leen como confirmación.

---

## 2. Restricciones operativas

**Sebastián trabaja principalmente desde iPad.** Esto no es una preferencia: es
la restricción que más decisiones técnicas determina.

Se puede hacer desde iPad:

- Sesiones cloud de Claude Code (pestaña Code de la app de Claude, contra un
  repositorio de GitHub, terminan en PR).
- Revisar PRs y editar archivos desde GitHub web.
- GitHub Actions (validación automática).
- Probar el producto en Safari vía GitHub Pages.

Requiere Mac / PC / entorno remoto:

- Claude Code en terminal, y por lo tanto la mitad de gstack que depende de
  navegador, daemon local o Keychain (`/browse`, `/qa`, `/design-review`,
  `/canary`, `/land-and-deploy`).
- Remote Control (refleja una sesión local; la máquina debe permanecer despierta).

**Consecuencia arquitectónica:** el producto no lleva build step. Sin bundler,
sin React/Next/Vite. HTML + JS plano con módulos ES. Cualquier paso de
compilación convierte "editar un archivo desde el iPad" en "necesito una
máquina", y rompe la restricción principal.

---

## 3. Repositorios

Dos repositorios separados, por razones de privacidad y no de organización.

| Repo | Visibilidad | Contenido |
|---|---|---|
| `entrenador-ia` | público o privado | código, esquemas, metodología, casos de ejemplo |
| `entrenador-ia-datos` | **privado, obligatorio** | alumnos reales, perfiles, sesiones, ejecuciones |

Los datos incluyen restricciones articulares, lesiones, dolor y juicios clínicos
sobre personas identificables. No pueden convivir con el repositorio que sirve
páginas públicas.

> **Verificar antes de decidir:** servir GitHub Pages desde un repositorio
> privado puede requerir un plan de pago. Si no está disponible, la Vista Alumno
> se sirve desde el repo público leyendo únicamente artefactos publicados
> (sección 10), nunca datos de origen.

### Estructura de `entrenador-ia`

```
/esquemas          contratos de datos (JSON Schema)
/app               renderizadores estáticos → GitHub Pages
  /entrenador      Vista Entrenador
  /alumno          Vista Alumno
/metodologia       Constitución, Manual, Bitácora, Libro de Casos
  checklist.json   checklist de aprobación (documento versionado)
  familias.json    vocabulario de familias de corrección
/casos             1–2 casos migrados como datos
ARQUITECTURA.md
DECISIONES.md      una entrada corta por decisión de arquitectura
```

### Estructura de `entrenador-ia-datos`

```
/alumnos/{alumno_id}/
  alumno.json
  perfil/{fecha}.json
  plan/{plan_id}.json
  sesiones/{sesion_id}.json
  check-ins/{sesion_id}.json
  ejecuciones/{sesion_id}.json
  feedback/{sesion_id}.json
  adaptaciones.jsonl
/publicado/{sesion_id}/{publicacion_id}.json
```

---

## 4. Las tres capas

**Contratos** — JSON Schema en `/esquemas`. Propiedad del entrenador.

**Datos** — archivos JSON versionados en git. Git aporta historial, diff y
rollback sin construir nada, y se edita desde GitHub web.

**Vistas** — renderizadores estáticos. Funciones puras de datos a HTML.

Todo acceso a datos pasa por un módulo único `repositorio.js` que expone
funciones de dominio (`obtenerPerfil(alumnoId)`, `obtenerPublicacionVigente(sesionId)`).
El día que exista backend se reemplaza ese módulo y nada más. Ninguna vista lee
archivos directamente.

**Preparación para backend futuro:** `id` estable y `schema_version` en toda
entidad; fechas ISO-8601 con zona horaria; ninguna lógica codificada en nombres
de archivo. Nada más — no se construye auth, base de datos ni sincronización.

---

## 5. Modelo de datos

### 5.1 Entidades

| Entidad | Naturaleza |
|---|---|
| `alumno` | identidad, estable |
| `perfil` | estado versionado, con estado epistémico por campo |
| `plan` | dirección estratégica; vive por encima de las sesiones |
| `sesion` | documento vivo con versiones, observaciones y publicaciones |
| `check_in` | señal previa a la ejecución |
| `ejecucion` | lo que ocurrió en la realidad |
| `feedback` | lo que el alumno reporta después |
| `adaptacion` | registro transversal de todo cambio, con nivel y motivo |

### 5.2 Perfil

Cada campo lleva su estado epistémico. Es la implementación del principio 1.4:
la puerta de información mínima deja de depender de disciplina y se vuelve una
consulta ejecutable.

```json
{
  "alumno_id": "…", "version": 3, "fecha": "2026-08-14T10:00:00-04:00",
  "campos": {
    "objetivo": { "valor": "…", "estado": "confirmado", "fuente": "onboarding 2026-07-02" },
    "disponibilidad_semanal": { "valor": 3, "estado": "confirmado", "fuente": "…" },
    "equipamiento": { "valor": "…", "estado": "inferido", "fuente": "foto del gimnasio" },
    "historial_lesion_hombro": { "valor": null, "estado": "desconocido", "fuente": null }
  },
  "alcance_acordado": { "sesiones_semana": 2, "otorgado": "2026-07-02", "…": "…" }
}
```

`estado` ∈ `confirmado | inferido | desconocido`.
`alcance_acordado` es independiente de la información disponible: saber más
sobre un alumno no autoriza intervenir más.

### 5.3 Plan

Contiene objetivo, criterios de progresión y **criterios de salida**. Existe para
que la sesión siguiente se derive del plan y no de la sesión anterior — es el
antídoto estructural al eco de sesión.

### 5.4 Sesión

El documento vivo. Reúne versiones, observaciones, checklist, contingencias y
publicaciones.

```json
{
  "id": "…", "alumno_id": "…", "plan_id": "…",
  "schema_version": 1,
  "estado": "publicada",
  "generador_version": "…",

  "versiones": [
    { "v": 1, "autor": "sistema",    "fecha": "…", "contenido": { } },
    { "v": 2, "autor": "entrenador", "fecha": "…", "contenido": { }, "deriva_de": 1 }
  ],

  "observaciones": [
    { "sobre_version": 1, "familia": "falta_movilidad", "tipo": "correccion",
      "observacion": "…", "modificacion": "…", "motivo": "…", "resuelta_en": 2 }
  ],

  "checklist_aprobacion": {
    "checklist_version": "1.0",
    "respuestas": [ { "item_id": "cal-01", "respuesta": "…", "justificacion": "…" } ]
  },

  "contingencias": [
    { "id": "c1", "condicion": "…", "accion": "…", "clase": "sustitucion" }
  ],

  "version_aprobada": 2,
  "aprobada_por": "sebastian", "fecha_aprobacion": "…",

  "publicaciones": [
    { "p": 1, "de_version": 2, "fecha": "…", "hash": "…",
      "vigente": false, "sustituida_por": 2 },
    { "p": 2, "de_version": 3, "fecha": "…", "hash": "…",
      "vigente": true, "origen": "check_in", "check_in_ref": "…", "motivo": "…" }
  ]
}
```

**`autor` es lo que hace medible el aprendizaje del sistema.** Solo se puede
evaluar si el sistema mejoró si consta que la v1 la escribió el sistema.
`generador_version` es un string barato hoy que después permite atribuir una
mejora a un cambio concreto en vez de a la suerte.

**Métrica de salud del sistema:** cuánta corrección necesita la v1 antes de
aprobarse — número de observaciones por sesión y qué familias. Si ambos bajan
en el tiempo, hubo aprendizaje transferido.

### 5.5 Ejecución

Registro separado. Nunca modifica la publicación.

```json
{
  "sesion_id": "…",
  "publicacion_ejecutada": 2,
  "check_in": { "estado_respuesta": "respondido", "ref": "…" },
  "inicio": "…", "fin": "…",
  "series": [
    { "ejercicio_id": "…", "serie": 1,
      "programado": { "reps": 8, "carga": 60, "unidad": "kg" },
      "ejecutado":  { "reps": 6, "carga": 60, "unidad": "kg" },
      "motivo_diferencia": "…" }
  ],
  "resultado": "completada"
}
```

`publicacion_ejecutada` congela qué publicación estaba vigente al iniciar. Sin
ese campo, toda la evidencia posterior apunta a un blanco móvil.

`resultado` ∈ `completada | parcial | pospuesta | omitida`.
Posponer y omitir son resultados legítimos y registrables, no fallos.

### 5.6 Feedback

```json
{ "sesion_id": "…", "estado_respuesta": "sin_respuesta", "contenido": null, "fecha": "…" }
```

`estado_respuesta` ∈ `respondido | parcial | sin_respuesta`, **separado del
contenido**. Ausencia de respuesta es un valor explícito, no un `null` que el
sistema pueda leer como conformidad.

---

## 6. Ciclos de vida

Son tres máquinas de estado distintas y no deben unirse en una sola cadena. La
primera describe un documento; la tercera, la realidad.

### 6.1 Documento

```
borrador(v1) → en_revision → [observaciones] → borrador(v2) → en_revision
             → aprobada → publicada
                        ↘ descartada        [ABIERTO V1-B]
```

"Corregida" no es un estado sino el resultado de una transición: una corrección
crea una versión nueva que vuelve a revisión. Así los ciclos múltiples de
corrección funcionan sin inventar estados, y "corregida" queda como dato
derivable (`versiones.length > 1`), no almacenado.

### 6.2 Publicación

Cada publicación individual es **inmutable**. Una sesión aún no iniciada puede
recibir una publicación nueva que sustituya a la anterior.

```
p1 vigente → [check-in aporta información] → p2 vigente, p1 sustituida
           → [inicio de ejecución] → ninguna vigente; p2 congelada en la ejecución
```

**Invariante:** exactamente una publicación `vigente` mientras el estado sea
`publicada`; cero desde que empieza la ejecución.

### 6.3 Realidad

```
publicada → [check-in] → ejecutada | pospuesta | omitida → feedback
```

Los cambios ocurridos *durante* la sesión no reescriben la publicación: se
registran como diferencia entre `programado` y `ejecutado`, con motivo.

---

## 7. Check-in y reevaluación previa a la ejecución

Una sesión futura se considera **viva hasta el momento en que comienza su
ejecución**. El check-in inmediatamente anterior puede aportar información que
la cambie.

### 7.1 Clases de señal

El check-in recoge señales que **no pertenecen a la misma clase de decisión**.
Modelarlas con la misma aritmética sería un error de diseño con consecuencias
clínicas.

**Clase A — graduables.** Sueño, fatiga, energía/disposición, carga de otros
entrenamientos, tiempo disponible, equipamiento. Admiten escala y modulan dosis.
Se prestan a ajuste fino y, en parte, a contingencias pre-aprobadas.

**Clase B — molestia.** Requiere atención pero no interrumpe necesariamente.
Comparte estructura descriptiva con la clase C, con disposición por defecto
distinta.

**Clase C — dolor / alerta.** No es una intensidad alta de fatiga ni una
variable binaria. Se describe en varias dimensiones:

```json
{
  "clase": "dolor",
  "ubicacion": "…",
  "intensidad": "…",
  "comportamiento": "…",
  "novedad": "nuevo | conocido",
  "evolucion": "mejora | estable | empeora",
  "respuesta_al_movimiento": "…"
}
```

El espacio de decisión disponible es:
`observar | modificar | sustituir | detener | escalar`.

**Regla arquitectónica central de esta sección:** el esquema captura las
dimensiones descriptivas y enumera el espacio de decisión, pero **el mapeo entre
descripción y decisión no está en el código**. No todo dolor produce la misma
respuesta, y no hay escalamiento automático. La decisión es del entrenador o,
en su caso, de una contingencia que el entrenador escribió explícitamente para
esa situación concreta. `[ABIERTO V1-F]`

**El silencio cuesta el doble.** Un check-in sin responder no solo no abre la
puerta de información mínima: tampoco permite adaptar. La publicación vigente
sigue vigente pero **sin verificar**, y eso queda escrito en la ejecución
(`check_in.estado_respuesta = "sin_respuesta"`), nunca asumido como
conformidad.

### 7.2 Contingencias pre-aprobadas

Existen porque el check-in llega minutos antes de la sesión y una republicación
que siempre espera revisión humana no funciona en la práctica justo cuando más
importa.

Son **decisiones humanas tomadas por anticipado**: al aprobar la sesión, el
entrenador adjunta condiciones explícitas y su acción asociada. Siguen siendo
supervisión humana, solo que anterior.

Límites, deliberados y no negociables:

- Solo sustituciones, omisiones o recortes que el entrenador escribió.
- Nunca programación nueva.
- Son datos, no lógica. No hay motor de inferencia que las combine ni las
  extienda por analogía.
- No se generalizan a otras sesiones ni a otros alumnos automáticamente.

`[ABIERTO V1-D]` — formato exacto de la condición y alcance permitido.

### 7.3 Reevaluación fuera de contingencia

Cuando el check-in entrega **información nueva materialmente relevante** que
ninguna contingencia contempla, **no** aplica una regla absoluta de no ejecutar.
Lo que se dispara es una **reevaluación antes de ejecutar la sesión tal como
estaba**.

Resultados posibles, todos legítimos:

| Resultado | Efecto |
|---|---|
| `nueva_publicacion` | publicación aprobada que sustituye a la vigente |
| `adaptacion_conservadora` | ajuste ya autorizado dentro del margen existente |
| `reduccion` | recorte de volumen o alcance |
| `sustitucion` | cambio de ejercicio o bloque |
| `posponer` | la sesión se traslada |
| `omitir` | la sesión no se realiza |
| `escalamiento` | requiere decisión del entrenador, o derivación externa |

Una mala noche de sueño y un dolor agudo nuevo disparan ambos una reevaluación,
pero no pertenecen a la misma clase de decisión ni admiten los mismos
resultados. Por eso el registro de reevaluación lleva `clase_señal`.

**La reevaluación es un evento registrado en sí mismo**, incluso cuando su
resultado es ejecutar sin cambios. "Se ejecutó lo publicado tras una
reevaluación" es evidencia distinta de "se ejecutó lo publicado sin que pasara
nada".

`[ABIERTO V1-E]` — qué cuenta como "materialmente relevante".

### 7.4 Aprendizaje descriptivo sobre las decisiones

Que el mapeo señal → decisión no viva en el código no significa que el sistema
no pueda aprender de esas decisiones. **No automatizar la decisión ≠ no aprender
de la evidencia.**

El objetivo es poder detectar después patrones del tipo *"ante esta clase de
señal, en este alumno y contexto, las decisiones del entrenador suelen ser
estas"*, para alimentar la Vista Entrenador y generar hipótesis. Nunca para
convertirse en regla.

Para que eso sea posible, cada reevaluación se registra como una decisión
completa y consultable, no solo como un resultado:

```json
{
  "sesion_id": "…", "check_in_ref": "…",
  "clase_señal": "dolor",
  "señal": { "ubicacion": "…", "novedad": "nuevo", "evolucion": "…", "…": "…" },
  "contexto": { "perfil_version": 3, "plan_id": "…", "publicacion_vigente": 2 },
  "decidido_por": "entrenador",
  "alternativas_disponibles": ["modificar", "sustituir", "posponer", "escalar"],
  "resultado": "sustitucion",
  "motivo": "…",
  "fecha": "…"
}
```

Tres campos hacen la diferencia entre un registro consultable y uno inútil:

**`alternativas_disponibles`.** Sin él, una frecuencia no se puede interpretar.
"El entrenador eligió sustituir seis veces" no dice nada si en cinco de esas
sustituir era la única opción sobre la mesa. Registrar el espacio de decisión
abierto es lo que convierte un recuento en evidencia.

**`decidido_por`** ∈ `entrenador | contingencia`. Cuando dispara una
contingencia pre-aprobada, lo que se ejecuta es una decisión *anterior* del
entrenador repitiéndose, no una decisión nueva. Contarlas juntas infla
artificialmente la consistencia aparente de un patrón. Las contingencias no
cuentan como evidencia independiente.

**`contexto`** por referencia a versiones, no por copia. El perfil es versionado
e inmutable, así que basta apuntar a la versión vigente en ese momento.
Consultarlo después daría el perfil actual, no el que había cuando se decidió.

#### Cómo se muestra un patrón

Aquí está el riesgo real, y no es de código. Un patrón descriptivo mostrado en
el momento de decidir funciona como recomendación, se lo etiquete como se lo
etiquete. "En 7 de 9 casos similares decidiste sustituir", leído justo antes de
decidir, ancla la decisión. La regla se instalaría igual, solo que por un canal
psicológico en vez de uno técnico — y sería más difícil de auditar, no menos.

Por eso las reglas de presentación son parte de la arquitectura:

1. **Separación de momentos.** Los patrones viven en la vista retrospectiva
   (H7), no en el flujo de decisión pre-sesión.
2. **El patrón es una pregunta, no una respuesta.** "Esta clase de señal
   apareció 9 veces en este alumno — ¿vale la pena revisarlo?" en lugar de
   "usualmente decides sustituir".
3. **Siempre con denominador y distribución completa**, nunca la moda sola.
4. **Un `n` mínimo antes de mostrar nada.** `[ABIERTO V1-G]`
5. **Un patrón nunca prellena un campo.** Consistente con el principio 1.4: un
   valor sugerido por frecuencia es una inferencia, y aparecería como hecho.

Un patrón detectado es material para la Bitácora de Aprendizaje y para
hipótesis que el entrenador decide probar. Su camino hacia una regla pasa por
el checklist —que es un documento versionado que se edita a mano— y por ningún
otro lugar.

---

## 8. Los cuatro niveles de adaptación

| Nivel | Cuándo | Quién decide | Qué cambia |
|---|---|---|---|
| `pre_sesion` | tras el check-in, antes de iniciar | entrenador, o contingencia pre-aprobada | nueva publicación vigente |
| `intra_sesion` | durante la ejecución | alumno, dentro de lo autorizado | nada del documento; solo `ejecutado ≠ programado` + motivo |
| `entre_sesiones` | tras el feedback | entrenador | la sesión siguiente |
| `de_plan` | explícito y poco frecuente | entrenador | objetivo y criterios; todas las sesiones futuras |

Cada adaptación se registra en `adaptaciones.jsonl` con `nivel`, `familia`,
`motivo` y referencia a la sesión.

**Regla de acumulación.** Las adaptaciones de nivel bajo no deben acumularse en
silencio hacia el nivel alto. Tres modificaciones intra-sesión en la misma
dirección a lo largo de cuatro sesiones no son tres incidentes: son señal de que
el plan está mal calibrado. Deben aparecer como alerta en la Vista Entrenador en
lugar de ser absorbidas sesión a sesión.

---

## 9. Checklist de aprobación

`checklist.json` en `/metodologia`. **Documento versionado, no código.**

```json
{ "version": "1.0",
  "items": [
    { "id": "cal-01", "bloque": "calentamiento",
      "pregunta": "¿De qué deriva este calentamiento?",
      "familia_asociada": "…", "requiere_justificacion": true }
  ] }
```

Cada aprobación registra `checklist_version`. Eso permite medir si un ítem
añadido efectivamente redujo la recurrencia de la familia que lo originó — ahí
se cierra el bucle de aprendizaje transferido.

### Reglas de redacción

El riesgo principal es que el checklist se vuelva mecánico: cualquier ítem con
forma "¿incluye movilidad?" se satisface agregando movilidad, y el resultado son
sesiones infladas en vez de sesiones bien armadas — el problema opuesto al que
se quiere resolver, generado por el instrumento puesto para resolverlo.

1. **Pedir una decisión justificada, no una presencia.** No "¿hay
   calentamiento?" sino "¿de qué deriva este calentamiento?".
2. **"Ninguna" debe poder aprobar.** "¿Qué capacidad secundaria aprovecha esta
   sesión, o por qué ninguna?" El campo obligatorio es `justificacion`, no la
   presencia del elemento. Si "ninguna, porque el principal demanda todo el
   descanso" no puede pasar el ítem, el ítem es un mandato disfrazado.
3. **Un ítem holístico al final.** La linealidad es propiedad del conjunto: se
   pueden aprobar todos los bloques y aun así entregar una sesión de ejercicios
   aislados. Ese ítem no se puede descomponer sin perder lo que persigue.

### Dominios que la V1 debe cubrir

- **Calentamiento** — de qué deriva; qué zonas y capacidades prepara; si es
  suficiente sin producir fatiga innecesaria.
- **Estructura y emparejamientos** — si el principal necesita descanso completo
  o admite combinación inteligente; accesorios, movilidad, zona media,
  estabilidad, cuello u otra capacidad secundaria; ningún complemento puede
  degradar el objetivo principal.
- **Pausas** — no asumir pasiva ni activa por defecto; decidir conscientemente
  cuál aporta más en ese bloque.
- **Holístico** — ¿es una secuencia que se aprovecha entre sí, o ejercicios
  aislados puestos en fila?

`[ABIERTO V1-C]` — redacción concreta de los ítems, a producir sobre la sesión
de Juan Pablo.

---

## 10. Vistas

No son dos aplicaciones: son dos renderizadores sobre los mismos datos, con una
regla de separación estricta.

**Publicar = extraer, no filtrar.**

La publicación genera un artefacto derivado y reducido en `/publicado/` que
contiene únicamente el contenido de la versión publicada. No es un render que
carga el documento completo y esconde los borradores.

Las observaciones son juicios clínicos y críticos sobre el alumno. Si viajan en
el mismo archivo que la sesión, viajan al alumno — con o sin herramientas de
desarrollo de por medio.

| | Vista Entrenador | Vista Alumno |
|---|---|---|
| Lee | `sesion.json` completo | solo `/publicado/{sesion_id}/{p}.json` |
| Muestra | versiones, observaciones, checklist, publicación vigente, alertas | la sesión vigente, clara y ejecutable |
| Ubicación | repo privado | puede servirse públicamente |

**Restricción de diseño para la Vista Entrenador:** registrar una observación
debe poder completarse en menos de un minuto — familia desde una lista, dos
campos de texto corto. Si revisar cuesta diez minutos por sesión, el paso no
sobrevive al contacto con la realidad y se omite justo cuando más importa.

---

## 11. Fronteras: dónde puede vivir la lógica metodológica

La frontera no separa "quién puede planificar" sino **dónde puede residir una
regla metodológica** (principio 1.2). Confundir ambas cosas paralizaría el
sistema: el objetivo es impedir que la metodología quede codificada, no impedir
que el agente entrenador planifique.

Tres capas con permisos distintos:

**11.1 Herramientas de construcción y código de aplicación**
Claude Code, Codex, gstack y el código de `/app` construyen, revisan y prueban
el producto. **No toman decisiones metodológicas de entrenamiento ni contienen
esas reglas.** No deciden selección de ejercicios, dosis, estructura,
progresiones, criterios de avance, ni qué información es suficiente para
programar.

La prueba operativa: si un umbral, una progresión o un criterio de dosificación
aparece escrito dentro del código de aplicación, es un defecto — aunque
funcione. Debe venir de la metodología versionada.

**11.2 Cerebro Maestro / agente entrenador**
**Sí puede producir propuestas de planificación** aplicando la metodología
versionada: ejercicios, dosis, estructura, progresiones y adaptaciones. Es su
función. Consulta el corpus, el perfil y el plan, y propone.

Lo que no puede hacer es *crear* reglas metodológicas ni fijarlas fuera de los
documentos que el entrenador posee. Aplica la metodología; no la escribe.

**11.3 Entrenador**
Único autor de la metodología. Durante el MVP, además, **toda propuesta del
agente nace como `borrador` y requiere revisión y aprobación antes de
publicarse** (§6.1). El agente propone; el entrenador dispone.

Esta condición es del MVP, no permanente: puede relajarse si la evidencia
acumulada lo respalda, y hacerlo será una decisión registrada en
`DECISIONES.md`, no un cambio silencioso.

### Reservado al entrenador en todos los casos

- el alcance acordado con un alumno;
- el mapeo entre descripción de dolor y clase de respuesta (§7.1, V1-F);
- la aprobación de cualquier sesión antes de su publicación;
- **la clasificación de las correcciones al trabajo del propio agente**: si el
  sistema asigna la `familia` a una observación sobre un borrador propio,
  corrige su propia prueba. El entrenador elige la familia desde una lista.

### Fronteras que no son de código

A lo anterior se añade una frontera de presentación (§7.4): ningún patrón
descriptivo se muestra en el momento de decidir, ni prellena un campo, ni se
enuncia como tendencia del entrenador. Una regla puede instalarse por anclaje
tan efectivamente como por automatización, y por esa vía es más difícil de
auditar.

Y la tentación técnica que hay que nombrar explícitamente porque es lo que haría
cualquier programador razonable: **ninguna validación puede rellenar campos
faltantes con valores por defecto plausibles.** Convertiría una inferencia en un
hecho, en silencio y a escala. Tampoco puede normalizar el texto libre del
alumno a categorías sin conservar el original.

---

## 12. Invariantes verificables

Se validan en GitHub Actions. Corren sin Mac. Son lo que hace confiable la
evidencia.

- Todo archivo de datos valida contra su esquema.
- Una sesión `publicada` tiene `version_aprobada`, `aprobada_por` y
  `checklist_aprobacion`.
- Exactamente una publicación `vigente` mientras el estado sea `publicada`.
- El `hash` de una publicación no cambia entre commits.
- Toda `ejecucion` referencia una publicación existente de su sesión.
- Toda observación tiene `familia` (del vocabulario vigente), `tipo` y `motivo`.
- Toda respuesta de checklist con `requiere_justificacion` tiene
  `justificacion` no vacía.
- Todo campo de perfil tiene `estado`; ningún campo `confirmado` tiene
  `fuente` nula.
- Toda reevaluación registrada tiene `clase_señal`, `decidido_por`,
  `alternativas_disponibles`, `resultado` y `motivo`, y su `contexto` referencia
  versiones existentes.

---

## 13. Hitos

**H1 — Una sesión existente convertida en dato.**
Esquemas de sesión y ejecución; una sesión escrita como JSON; una página que la
renderiza de forma indistinguible del HTML ya aprobado; registro de ejecución
que emite JSON al portapapeles; el entrenador lo pega de vuelta al repo desde
GitHub web. Publicar es copiar manualmente la versión aprobada a `/publicado/`
— manual está bien: hace explícito el congelamiento.

**Caso a utilizar.** Si el artefacto de prueba queda en el repositorio público,
se usa un **caso demo anónimo derivado de Juan Pablo**: misma estructura y misma
forma de sesión, sin nombre, sin datos personales y sin datos sanitarios reales.
Las restricciones o molestias que existan se sustituyen por equivalentes
ficticios que preserven la estructura del problema. El caso real permanece en el
repositorio privado.

Esto no afecta al trabajo del checklist (V1-C), que se hace mirando la sesión
real de Juan Pablo en el repositorio privado. Lo anonimizado es el artefacto
público, no el material de análisis.

Verificable, reversible (es una carpeta), íntegramente operable desde iPad. Es
la bifurcación de la que depende todo lo demás: después de esto ya no se escribe
HTML por alumno, se escriben datos.

**H2 — Vista Entrenador, solo lectura.**
v1 y vN lado a lado, observaciones, checklist respondido, publicación vigente.
Sin editor: se edita el JSON desde GitHub web. Lo valioso es ver el delta.

**H3 — Validación de esquemas en CI.**
Los invariantes de la sección 12.

**H4 — Check-in como dato y republicación.**
Estrena el mecanismo completo: clases de señal, contingencias, reevaluación,
`sin_respuesta`, `pospuesta`, escalamiento.

**H5 — Feedback como dato.**

**H6 — Perfil versionado con estado por campo**, y vista que muestra confirmado
vs inferido antes de programar: la puerta de información mínima hecha visible.

**H7 — Vista retrospectiva.**
Tablero de familias de corrección, alerta de acumulación (§8) y patrones
descriptivos de decisión (§7.4). Es la única vista donde aparecen patrones, y
por eso es un hito tardío: requiere volumen de evidencia y no puede
adelantarse.

---

## 14. Qué no se construye todavía

Backend, base de datos, login, cuentas de alumno. Multi-entrenador o
multi-tenant. Cualquier build step. PWA, app nativa, notificaciones. Motor de
progresión automática. Editor visual de sesiones. Colaboración en tiempo real.
Diff visual entre publicaciones. Múltiples aprobadores. Motor de contingencias
más allá de condiciones literales escritas por el entrenador. Republicación
automática sin intervención humana. Clasificación automática de familias. Panel
con gráficos antes de que haya datos que graficar. Rediseño del sistema visual.
Migración de los siete casos — uno, máximo dos. Tests más allá de la validación
de esquemas.

---

## 15. Puntos abiertos (V1 por validar con casos reales)

Ninguno bloquea H1. Todos son trabajo metodológico, no técnico.

| ID | Punto | Cómo se cierra | Qué no se construye mientras siga abierto |
|---|---|---|---|
| **V1-A** | Vocabulario inicial de familias de corrección (5–8 valores, extensible) | Sobre las observaciones reales de Juan Pablo | H7 |
| **V1-B** | `descartada` como estado de primera clase | Cuando ocurra el primer rechazo completo de un borrador | Nada; el esquema ya lo admite |
| **V1-C** | Redacción concreta de los ítems del checklist | Sobre la sesión de Juan Pablo, no en abstracto | H2 muestra el checklist pero no lo impone |
| **V1-D** | Formato y alcance permitido de las contingencias | Primera sesión real que las use | H4 |
| **V1-E** | Qué cuenta como información "materialmente relevante" | Acumulación de check-ins reales | Cualquier disparo automático de reevaluación |
| **V1-F** | Mapeo entre descripción de dolor y clase de decisión | Casos reales; posiblemente nunca se automatice | Toda automatización sobre señales de clase B y C |
| **V1-G** | `n` mínimo antes de mostrar un patrón descriptivo (§7.4) | Cuando exista volumen real de decisiones | H7 |

Sobre **V1-B**: si un borrador puede rechazarse entero, es la señal de
aprendizaje más fuerte disponible y conviene que sea un estado registrado, no un
borrado.

Sobre **V1-F**: es legítimo que este punto quede abierto de forma permanente. Un
mapeo dolor → decisión codificado sería una regla metodológica dentro del
código, y eso viola el principio 1.2.

---

## 16. Herramientas

**Método Indio / Cerebro Maestro** — lógica de entrenamiento y decisión. No se
sustituye ni se delega.

**Claude Code** — arquitectura, programación, revisión. Desde iPad vía sesiones
cloud contra GitHub, terminando en PR.

**gstack** — si se adopta: vendorizado en `.claude/` del proyecto, no global;
`auto_upgrade` desactivado; `DESIGN.md` y `CLAUDE.md` bajo control del
entrenador, no reescritos por la herramienta.

Aportan: `/plan-eng-review` (arquitectura y modos de falla), `/review` (auditoría
de código), `/office-hours` (una vez, al inicio), `/careful` y `/freeze`
(prevención de ediciones accidentales), `/codex` (segunda opinión de otro
modelo).

Redundantes con lo ya existente: `/plan-ceo-review` (el Head Coach ya decide
dirección), `/retro` y `/learn` (la Bitácora de Aprendizaje ya existe; duplicar
memoria en dos sistemas es como se pierde la trazabilidad).

No operables desde iPad: `/browse`, `/qa`, `/design-review`, `/design-shotgun`,
`/canary`, `/benchmark`, `/land-and-deploy`, `/setup-browser-cookies`.

**LLM Council** — decisiones estratégicas puntuales.
**Codex** — segundo revisor en momentos puntuales.

Ninguna de estas herramientas entra en el territorio de la sección 11.

---

## Registro de cambios

| Versión | Fecha | Cambio |
|---|---|---|
| 0.1 | 2026-08-14 | Primera versión completa para revisión |
| 0.2 | 2026-08-14 | Aprobada la dirección de v0.1. Nueva §7.4 (aprendizaje descriptivo sobre las decisiones); frontera de presentación añadida a §11; invariante de reevaluación en §12; H7 redefinido como vista retrospectiva; nuevo punto abierto V1-G. Correcciones previas al commit: §11 reformulada en tres capas de permiso (herramientas / agente entrenador / entrenador); H1 usa caso demo anónimo si el artefacto queda en repositorio público |
