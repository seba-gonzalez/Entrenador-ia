# CERCA — Propuesta de arquitectura operacional

**Estado: PROPUESTA. Nada de esto está aprobado ni construido**, salvo la sección 8,
que sí se hizo y ya está andando.

Para leer esto no hace falta saber programar. Donde use una palabra técnica, la
explico la primera vez.

---

## Estado al 2026-09-02 — lo que ya está construido

Dirección aprobó concretar. Los pasos 1 y 2 de la hoja de ruta de §5 **están
hechos y probados en navegador**; el resto de este documento queda como estaba,
porque las preguntas de §7 siguen abiertas.

| | Qué | Dónde |
|---|---|---|
| ✅ | El estilo definido de la vista de alumno: nueve roles tipográficos con piso de 12px, y el cyan reservado a lo que está activo o elegido | `cerca/alumno/cerca-alumno.css` |
| ✅ | El reproductor: una sola página que dibuja cualquier sesión escrita como dato | `cerca/s/` |
| ✅ | La semana de Nico convertida a dato | `cerca/sesiones/` |
| ✅ | El publicador: pegar, revisar, publicar y llevarse el enlace estable, sin commit | `cerca/publicar/` |
| ✅ | El SQL de instalación, para pegar una vez en Supabase | `cerca/sql/001-entregas.sql` |
| ✅ | Las instrucciones de uso | `COMO_PUBLICAR.md` |

Medido a 320, 390 y 768 px: **39 → 2 bordes cyan**, **25 → 10 roles de texto**,
piso de 9,9px → 12px, todos los campos a 16px, sin scroll horizontal.

Las decisiones quedaron registradas en `REGISTRO_APROBADOS.md` §14 bis, con su
justificación y con lo que se pierde en cada una.

---

## 0. Tres cosas que encontré antes de diseñar nada

Las pongo primero porque cambian el encargo.

### 0.1 El feedback de Nico sí se estaba guardando en Supabase

El encargo dice que el feedback de Nico "queda en el teléfono del alumno
(localStorage)". Revisé la página línea por línea: **no es así**. Cuando Nico
apretaba enviar, su esfuerzo y su comentario viajaban a la tabla
`cerca_workout_feedback`, la misma de Panchi.

Lo único que sí quedaba solo en su teléfono era **qué misión eligió el Día 3**.

Pero lo que encontré en su lugar es peor, porque no se nota:

| Lo que llegaba a Supabase | Por qué está mal |
|---|---|
| `session_id: "nico-plan-v1-prototype"` para los tres días | El Día 1, el Día 2 y el Día 3 llegaban con **el mismo nombre**. No había forma de saber cuál era cuál, salvo leyendo el texto del comentario. |
| `completion: "si"` siempre | La página **afirmaba que Nico completó la sesión** sin haber observado nada. Nadie se lo preguntó y él no marcó nada. Es un dato inventado con forma de hecho. |
| `blocks_completed: 0` siempre | Un cero que no significa cero: significa "esta página no mira eso". |
| `snapshot_hash: "proto:nico-v1-2026-09-01"` | No es una huella de nada. No permite saber si el papel que Nico vio cambió entremedio. |
| Sin casilla de consentimiento | Panchi y Pali la tienen. Nico enviaba su información **sin haber aceptado nada**. |

O sea: el problema no era que el dato no llegara. Era que **llegaba un dato falso
y no había cómo darse cuenta**. Eso es peor que no tener el dato, porque un dato
que ya está escrito nadie lo vuelve a cuestionar.

Lo arreglé. Está en la sección 8.

### 0.2 La arquitectura que me pides diseñar ya existe en este repositorio

En la raíz del repositorio, fuera de la carpeta `cerca/`, hay una segunda vía de
trabajo que está detenida desde el 26 de agosto:

- `ARQUITECTURA.md` — 801 líneas.
- `DECISIONES.md` — 36 decisiones registradas, cada una con su motivo y con lo que se descartó.
- `esquemas/` — cinco contratos de datos: alumno, sesión, ejecución, feedback, devolución.
- `app/` — una página de alumno que **se arma sola desde un archivo de datos**.
- `casos/` — dos sesiones completas escritas en ese formato.
- `validacion/` — 169 comprobaciones automáticas. **Las corrí hoy: pasan todas.**

Ahí está resuelto, con más cuidado del que yo tendría hoy en una tarde:

- la sesión como dato en vez de como página escrita a mano (decisión D-023);
- lo prescrito congelado y lo ejecutado aparte (D-007, D-008);
- los estados de la evidencia (D-033);
- registrar una vez por ejercicio en vez de una vez por serie, para no convertir
  el entrenamiento en una planilla (D-034);
- qué hacer cuando no se sabe una carga: **no rellenarla con un número plausible** (D-029).

**Por qué se detuvo:** esa vía terminaba con el alumno **copiando un texto al
portapapeles** para mandárselo al entrenador por WhatsApp. Nunca llegó a guardar
nada sola. Las páginas de `cerca/` tomaron el camino contrario: feas por dentro,
pero **guardan de verdad**.

Entonces no tengo que diseñar de cero. Tengo que **juntar las dos mitades**:
el modelo de datos de una, el camino de guardado de la otra.

### 0.3 Hay una regla del propio proyecto que hoy se está cruzando

`cerca/MATRIZ_DE_DATOS.md` dice, textual:

> **BLOQUEADO** — Enviar información de salud a Supabase, a servicios externos o
> incluirla en URLs.

Y también:

> **REGLA DE FRONTERA:** mientras el bloqueo esté vigente, todo campo de texto
> libre que pueda recibir información de salud se trata como si la contuviera.

Hoy hay dos campos de texto libre que viajan a Supabase desde las páginas de
entrenamiento: el comentario del feedback y el chat/bitácora. El encargo mismo
me pide clasificar frases como *"me cargó la espalda en la segunda ronda"*, que
es exactamente información de salud.

No lo estoy señalando para frenar nada. Lo señalo porque **es la decisión más
cara de las que hay pendientes**, hay que tomarla con el abogado, y todo lo que
construyamos encima de la bitácora depende de cómo se resuelva.

---

## 1. Qué está roto hoy, en mis palabras

### Urgente (hay un alumno entrenando esta semana)

1. **~~El feedback de Nico llegaba mentido.~~** Arreglado hoy. Sección 8.
2. **~~No había registro de lo ejecutado.~~** Arreglado hoy, en los lugares donde
   el número podía variar. Sección 8.
3. **La bitácora guarda posibles datos de salud y el propio proyecto lo tiene
   bloqueado.** No lo toqué: apagarlo sería romper lo único que hoy funciona bien.
   Necesita una decisión tuya y del abogado, no mía.

### Importante (rompe el crecimiento, no rompe hoy)

4. **Cada alumno es una página escrita a mano.** Tres alumnos, tres páginas, tres
   maneras distintas de nombrar y guardar lo mismo. Con cinco alumnos son cinco
   sistemas incompatibles y ninguna vista tuya puede leerlos a todos.
5. **La rutina vive dentro del HTML.** Cambiar una repetición es editar código.
   Eso te convierte a ti en el cuello de botella y en el que se puede equivocar.
6. **Publicar depende de un enlace que caduca.** Un enlace de vista previa de
   Vercel dura un día; una rutina tiene que durar una semana o más.
7. **No hay dónde mirar.** No existe una pantalla donde veas a tus alumnos.
   Hoy la única forma es entrar a Supabase a mirar filas.

### Puede esperar

8. **No hay editor de sesiones.** Pegar un archivo de texto sirve para diez alumnos.
9. **El chat casi no sabe responder.** Hoy sirve como libreta, y como libreta ya
   está cumpliendo. No lo toquemos todavía.

---

## 2. El diseño

La idea de fondo es una sola:

> **Hoy escribimos páginas. Hay que pasar a escribir sesiones, y que la página
> sea siempre la misma.**

Cinco piezas.

### 2.1 La sesión es un archivo de datos, no una página

Hoy, la rutina de Nico está escrita dentro de su página. Si quieres cambiarle
las repeticiones, hay que editar la página.

En vez de eso, una sesión se describe **una sola vez**, en un archivo de texto
con una forma fija. Algo así, en simple:

```
Día 1 · Fuerza base · máximo 60 minutos
  Bloque B · Fuerza base · circuito de 3 vueltas
    recorrido: B1 → B2 → B3 → descansa 75–90 s → vuelve a B1
    B1 · Goblet squat
        se muestra:  10–12 reps · 10 kg
        se registra: repeticiones          (porque 10–12 lo elige él)
        no se registra: la carga           (porque 10 kg es la única mancuerna)
    B2 · Jalón en polea alta
        se muestra:  10–12 reps
        se registra: repeticiones Y peso de la polea
        el peso NO viene prescrito: "todavía no sabemos cuál te queda bien"
```

Dos columnas distintas, y esto es lo importante:

- **lo que se muestra** — el texto que Nico lee;
- **lo que se registra** — dónde va un casillero vacío.

Los dos los escribes tú. **El código nunca deduce uno del otro.** Si el código
decidiera solo dónde poner casilleros, estaría tomando una decisión de
entrenamiento que es tuya.

Este formato **ya está escrito y probado** en `esquemas/sesion.schema.json`. Le
faltan tres cosas para servirle a Nico, y son agregados chicos:

- un tipo de bloque **circuito**, que muestre el recorrido completo (A1 → A2 → A3
  → descanso → volver a A1) en vez de decir "3 vueltas";
- **cronómetros dentro del ejercicio** (el botón "⏱ 20 s" que ya existe en la página de Nico);
- un tipo de bloque **misión**, con sus opciones.

### 2.2 Una sola página que sabe leer ese archivo

En vez de una página por alumno, **una sola página** —llamémosla el *reproductor*—
que recibe un archivo de sesión y lo dibuja.

- Panchi deja de ser una página y pasa a ser un archivo.
- Nico deja de ser una página y pasa a ser un archivo.
- El alumno número diez es **un archivo más**, no una página más.

El reproductor no sabe nada de Nico ni de Panchi. Sabe dibujar bloques, circuitos,
ejercicios, casilleros, cronómetros y feedback. Nada más.

Esto ya existe a medias en `app/alumno/vista-sesion.js`. Hay que traerlo al
mundo de `cerca/` y enseñarle los tres tipos de bloque nuevos.

### 2.3 Lo prescrito se congela; lo ejecutado se guarda aparte

Este es el principio fundador, y en la práctica se ve así:

**Cuando publicas una sesión**, se guarda una fila nueva que tiene:
el archivo completo de la sesión, la fecha, y una **huella** (un código largo que
se calcula a partir del contenido; si el contenido cambia aunque sea una coma, la
huella cambia).

**Esa fila no se edita nunca.** Ni para arreglar una falta de ortografía. Si hay
que cambiar algo, se publica una fila nueva y la anterior queda marcada como "ya
no vigente", pero sigue existiendo. Así, la sesión que Nico entrenó el martes
sigue existiendo exactamente como él la vio, aunque el jueves publiques otra.

**Cuando el alumno registra lo que hizo**, se guarda en otro lugar, y esa fila
lleva la huella de la sesión que tenía delante. Meses después puedes preguntar
"¿estas dos ejecuciones vieron el mismo papel?" y la respuesta es sí o no, no
"creo que sí".

Y una regla que sale de ahí, incómoda pero necesaria: **una sesión que ya se
entrenó no se corrige.** Si le mandaste 12 repeticiones donde querías 10, eso
queda. La corrección viaja a la sesión siguiente. Reescribirla haría que su
historial dijera algo que no pasó.

### 2.4 Cómo se guarda lo ejecutado, con los tres estados

Por cada casillero se guardan **tres cosas separadas**:

| | qué guarda |
|---|---|
| **lo prescrito** | lo que tú mandaste, o la declaración explícita de que no mandaste nada y por qué |
| **lo registrado** | lo que el alumno escribió, o la declaración explícita de que no escribió nada |
| **el estado** | la relación entre los dos |

El estado tiene tres valores, más un cuarto caso que te quiero explicar:

- **desconocido** — el casillero quedó en blanco. No es cero. No es lo prescrito.
  Es que no sabemos.
- **confirmado** — el alumno anotó un número y cae dentro de lo que mandaste.
- **modificado** — anotó un número y no coincide con lo que mandaste.

Y el cuarto, que apareció con la polea de Nico:

- **registrado sin prescripción** — anotó un número, pero **nunca hubo un número
  que confirmar o modificar**. No sabíamos qué peso le quedaba bien en la polea.
  Ese dato no cumple ni incumple nada: **es el que crea la referencia.**

Los tres estados no me alcanzaban para ese caso, y forzarlo habría sido mentir.
Preferí un cuarto caso con nombre propio antes que meter la polea en "confirmado".

**De dónde sale la confirmación.** Este es el punto que hay que cuidar:

- En Panchi, el casillero **viene con el peso prescrito ya escrito adentro**. Ahí
  el silencio no vale: hace falta el acto explícito de marcar el bloque como listo.
- En Nico, los casilleros **nacen vacíos** y al lado dice, en letra chica, "Seba
  mandó 10–12". Ahí escribir el número **sí es** el acto explícito. No hay que
  confirmarlo dos veces.

La regla real, que cubre los dos casos, es: **la confirmación nunca puede venir
de un número que puso el sistema.** Si el número lo puso el sistema, hace falta un
acto aparte. Si lo escribió la persona, ese es el acto.

### 2.5 Dónde vive cada cosa

Aquí me aparto de la arquitectura dormida, y quiero decirlo claro.

Esa arquitectura guarda las sesiones **como archivos dentro del repositorio de
código**. Eso tiene una ventaja grande —el historial de Git te asegura que nadie
editó una sesión ya publicada sin que quede rastro— y dos problemas que la matan:

1. **Publicar exigiría un commit.** Tú trabajas desde el iPad. Publicar una
   sesión no puede requerir una computadora.
2. **Las sesiones reales de alumnos reales no pueden vivir en el repositorio
   público.** El propio `DECISIONES.md` lo prohíbe (D-002), por buenas razones.

Entonces propongo:

| Qué | Dónde | Por qué |
|---|---|---|
| El reproductor (la página) | repositorio, publicado por Vercel | es código, no tiene datos de nadie |
| Las sesiones publicadas | Supabase, una fila por entrega | para poder publicar desde el iPad |
| Lo ejecutado, el feedback, la bitácora | Supabase | ya está ahí y funciona |
| Los esquemas y las decisiones | repositorio | son el contrato, y tienen que poder revisarse |

**El costo de esta decisión, dicho de frente:** hoy hay 169 comprobaciones
automáticas que verifican que ninguna sesión publicada se modificó. Si las
sesiones pasan a ser filas de Supabase, esas comprobaciones dejan de verlas. Hay
que moverlas al momento de publicar (mismo código, otra entrada) y configurar la
base para que una entrega **solo se pueda insertar, nunca modificar ni borrar**.
Es más débil que Git. Es el precio de que puedas publicar desde el teléfono.

---

## 3. Los puntos concretos que preguntaste

### 3.1 Cómo entregas tú una sesión

Hoy editas un archivo. Así se vería, por etapas:

**Etapa 1 — pegar y publicar (esto es lo que propongo construir).**
Entras a `admin.html` con tu clave —esa pantalla ya existe—, eliges el alumno,
pegas el archivo de la sesión, aprietas *Publicar*. La pantalla te devuelve el
enlace. Sin computador, sin commit, sin Vercel.

Con un botón más que hace el 90% del trabajo real:
**"Duplicar la semana pasada"**. Porque casi nunca escribes una sesión de cero:
tomas la anterior y le cambias tres números. Ese botón es lo que hace que el
alumno número diez sea barato.

**Etapa 2 — un editor simple.** Elegir tipo de bloque, escribir los ejercicios,
marcar con una casilla dónde va un casillero de registro. Solo cuando pegar texto
empiece a doler de verdad.

**Etapa 3 — que la IA proponga el borrador.** Fuera de alcance por ahora. El Core
no se conecta.

### 3.2 Cómo se agrega un alumno nuevo

Tres pasos, ninguno toca código:

1. Creas el alumno (nombre corto, sin datos de salud).
2. Escribes o duplicas su sesión.
3. Publicas y le mandas el enlace.

### 3.3 Cómo se publican las vistas, con dirección estable

Hoy usas vistas previas de Vercel que caducan en un día.

Propuesta:

- Una sola dirección de producción, del estilo `cerca.tudominio/s/?e=xxxxxxxx`.
- La parte `xxxxxxxx` es un código largo al azar (22 caracteres o más). No se
  puede adivinar y **no dice nada de la persona**: no lleva el nombre ni el correo.
- Ese código identifica **la entrega**, no al alumno. Si se filtra un enlace, se
  desactiva esa entrega y se publica otra. No se compromete el historial.
- La página lleva la marca de "no indexar" para que no aparezca en Google.
- Lo interno sigue separado: `build.sh` ya publica con **lista blanca** (solo sale
  lo que está escrito a mano en la lista). Eso se conserva tal cual: está bien
  pensado y falla del lado seguro.

### 3.4 Cómo se identifica cada vez que se ejecuta una sesión

Tres niveles, y hacen falta los tres:

| | qué responde | ejemplo |
|---|---|---|
| **sesión** | ¿qué le mandaste? | `nico-dia1` |
| **entrega** | ¿qué versión de eso publicaste? | el código del enlace + la huella |
| **ejecución** | ¿cuál de las veces que lo hizo? | un código único por vez |

Si Nico hace el Día 1 esta semana y otra vez la próxima: misma sesión, misma
entrega, **dos ejecuciones distintas**. Hoy quedaron distinguibles. La *entrega*
es lo que falta y llega con el paso 2.

### 3.5 Cómo se distingue en la bitácora lo urgente de lo trivial

*"Me cargó la espalda en la segunda ronda"* y *"¿cuánto descanso?"* no pueden
quedar en la misma fila.

Lo mínimo que funciona:

1. Cada mensaje de la bitácora se guarda con una **marca de prioridad**:
   normal o **para revisar**.
2. La marca la decide una **lista de palabras que escribes tú**: dolor, molestia,
   punzada, se me cargó, tiré, crujió, mareo, no pude terminar... La lista es
   tuya, no del código. Es criterio de entrenamiento, y ese no lo escribo yo.
3. **Ante la duda, marca.** El costo de equivocarse marcando de más es que leas
   un mensaje que no hacía falta. El costo de equivocarse marcando de menos es
   que no te enteres de un dolor. No son comparables.
4. **La marca no cambia nada del entrenamiento.** No modifica la rutina, no
   sugiere nada, no avisa a nadie. **Solo cambia el orden en que tú lo lees.**
5. El alumno ve que quedó marcado ("esto se lo dejé anotado a Seba como
   importante"), sin prometerle una respuesta inmediata que el sistema no puede
   cumplir.

**Advertencia grande:** este punto es justo el que choca con el bloqueo de la
matriz de datos. Construir un clasificador de molestias es construir un sistema
que trata información de salud. **No lo haría antes de que el abogado responda.**

Y una cosa que conviene tener presente mientras tanto. El encargo menciona, sobre
uno de los alumnos, un antecedente corporal que **no está escrito en ninguna parte
del sistema**, y está bien que no lo esté mientras el bloqueo siga vigente: este
repositorio es el público, y los antecedentes de personas reales no van aquí
(decisión D-002).

Pero significa que, hoy, la única red que hay eres tú leyendo lo que escriben.
El sistema no la tiene. Vale la pena que sepas que esa es la red, porque de aquí
a que exista la marca de prioridad no va a haber otra.

### 3.6 Privacidad

- **Las tablas nuevas con el mismo candado.** Se puede escribir, no leer. Igual
  que el feedback de Panchi. Con un detalle: la matriz de datos dice que **eso
  nunca se verificó**. Hay que confirmarlo mirando la configuración real, no
  suponerlo.
- **Consentimiento versionado.** Hoy la casilla existe pero no se guarda *qué
  texto* aceptó la persona. Si el texto cambia, no hay forma de saber qué aceptó
  cada uno. Hay que guardar la versión del texto junto con la aceptación.
- **Ley 21.719, vigente el 1 de diciembre de 2026.** Quedan unos quince meses.
  Antes de sumar gente hace falta: política de privacidad publicada, consentimiento
  específico para datos de salud (o la decisión firme de no capturarlos), plazo
  de conservación definido, y saber en qué país está alojado el proyecto de
  Supabase (define si hay transferencia internacional). Las preguntas ya están
  escritas en `PREGUNTAS_ABOGADO_PRIVACIDAD.md`. Falta la respuesta.

---

## 4. Qué se conserva y qué se descarta

### De la vista de Panchi — se conserva

- Bloques que se abren y cierran, con progreso.
- Marcar el bloque como listo como acto de confirmación.
- Audio de hasta 90 segundos: es la vía de menor fricción que tiene el sistema.
- Consentimiento antes de enviar.
- El cronómetro con sonido y pantalla encendida.

### De la vista de Panchi — se descarta

- El esfuerzo con **7 puesto por defecto**. Es un valor inventado esperando ser
  enviado. Pali y Nico ya usan botones sin selección previa; Panchi tiene que
  igualarse.
- Que el chat no guarde nada. Nico ya lo resolvió mejor.

### De la vista de Nico — se conserva

- **El circuito mostrado literalmente.** Es la mejor idea de las dos páginas.
- Descripción y consejo por ejercicio.
- Cronómetros dentro de la pantalla, sin salir a buscar el del teléfono.
- Feedback **por sesión**, no uno global de la semana.
- El chat como libreta: guarda aunque no sepa responder.

### De la vista de Nico — se descarta

- ~~`completion` siempre "sí"~~. Ya está.
- ~~El mismo nombre de sesión para los tres días~~. Ya está.
- ~~Enviar sin consentimiento~~. Ya está.
- La huella falsa. Ya está: ahora se calcula de verdad.

### Se conserva de la arquitectura dormida

Los esquemas, el registro de decisiones y la idea de que la sesión es un dato.
Son la parte más valiosa del proyecto y no costaron poco.

### Se descarta de la arquitectura dormida

- **Copiar al portapapeles.** Es lo que la dejó sin entregar nada.
- **Las sesiones como archivos del repositorio.** Por las dos razones de 2.5.
- **Verificar la huella y no mostrar nada si falla.** Está muy bien pensado, pero
  hoy dejaría a un alumno mirando una pantalla en blanco en el gimnasio. Se
  recupera cuando haya forma de avisarte al instante.

### No se toca

El Core. La landing. El perfil. El motor de ocho roles.

---

## 5. En qué orden lo haría

La regla: **cada paso deja algo que se puede usar el lunes siguiente.**

| | Qué | Cuánto | Qué se puede hacer al terminar |
|---|---|---|---|
| **0** | Los dos arreglos urgentes de Nico | **hecho** | Ves lo que Nico hizo de verdad, no lo que la página suponía |
| **1** | El reproductor: una página que arma una sesión desde un archivo. La sesión de Nico convertida a archivo | días | La pantalla de Nico se ve igual, pero ya no tiene HTML propio |
| **2** | Publicar sin commit: pegar el archivo en `admin.html`, obtener el enlace estable | días | Publicas una sesión desde el iPad y el enlace no caduca |
| **3** | Panchi al mismo reproductor | ~1 semana | El formato queda probado contra los dos casos difíciles: peso por serie y polea sin referencia |
| **4** | "Duplicar la semana pasada" | días | Preparar la semana pasa de escribir a corregir |
| **5** | La bitácora con prioridad | *después de la respuesta legal* | Ves primero lo que importa |
| **6** | Tu pantalla: todos los alumnos con la misma lupa | ~1 semana | Dejas de entrar a Supabase a mirar filas |
| **7** | El editor de sesiones | cuando pegar texto duela | — |

Los pasos 1 a 4 son unas dos o tres semanas de trabajo, y después de eso agregar
un alumno cuesta una tarde.

**Y una condición del paso 1:** no tocar la página de Nico mientras esté
entrenando esta semana. El reproductor se construye al lado, se compara pantalla
contra pantalla, y recién cuando se ve igual se cambia el enlace.

---

## 6. Riesgos de mi propia propuesta

1. **El reproductor puede convertirse en el nuevo motor de ocho roles.** Cada
   alumno nuevo va a traer un tipo de bloque que no existe, y la tentación va a
   ser agregarlo. **Regla dura que propongo: un tipo de bloque nuevo se agrega
   cuando lo piden dos alumnos, no uno.** Con uno se escribe como texto normal.

2. **Mover las sesiones a Supabase debilita la garantía de que no se editan.**
   Hoy Git no deja mentir. Supabase depende de configurar bien la base. Es más
   frágil. Lo asumo a cambio de que puedas publicar desde el iPad, pero es una
   pérdida real y no la quiero disimular.

3. **Se pierden 169 comprobaciones automáticas** el día que las sesiones dejen de
   ser archivos, salvo que se muevan al momento de publicar. Eso es trabajo que
   no aparece en la lista de arriba como una fila propia y debería.

4. **Todo lo que digo del esquema de Supabase lo deduje leyendo el código de las
   páginas.** No tengo acceso a la base desde aquí. Puedo estar equivocado sobre
   qué columnas existen y qué valores aceptan.

5. **La clasificación de la bitácora por palabras se va a equivocar.** Un falso
   negativo significa que no te enteres de un dolor. Por eso el sesgo tiene que
   ser marcar de más, y por eso **no puede ser lo único**: tú sigues leyendo todo.

6. **Estoy proponiendo unificar dos páginas que hoy funcionan.** Toda unificación
   pierde algo. El riesgo concreto es que el reproductor genérico dibuje la sesión
   de Nico un poco peor de lo que se ve hoy escrita a mano. Por eso el paso 3
   compara pantalla contra pantalla antes de cambiar nada.

7. **El riesgo de siempre en este proyecto: construir de más.** Si al terminar el
   paso 2 no puedes publicar una sesión desde el iPad, no seguimos al 3. Paramos
   y revisamos.

---

## 7. Lo que no entendí y necesito preguntarte

### Lo que más me traba

**1. Panchi y Pali.** El encargo describe la vista de Panchi con registro de carga
por serie, tres estados y el chat guardado en Supabase. **Abrí `cerca/pancha/index.html`
y no tiene nada de eso**: no tiene ningún casillero de registro, el esfuerzo viene
con 7 puesto por defecto y el chat no guarda nada en ninguna parte.

Lo que sí existe es `cerca/pali/index.html`, que **sí** guarda la ejecución en
Supabase, **sí** tiene el esfuerzo sin valor por defecto y **sí** manda una huella
de verdad. Es la mejor de las tres páginas.

Entonces: ¿"Panchi" y "Pali" son la misma persona con dos páginas? ¿Hay una
versión de la página de Panchi que quedó fuera del repositorio? Necesito saber
cuál es "la buena" antes de decidir qué conservar de ella.

**2. La arquitectura dormida.** ¿La conoces? ¿La aprobaste tú? ¿Es de este
proyecto o de una etapa anterior? Contesta casi todo lo que me preguntas y no la
quiero revivir a ciegas ni tirar sin preguntar.

**3. El bloqueo de datos de salud.** ¿Sigue vigente? Porque la bitácora los está
recibiendo hoy. Mi lectura es que sí sigue vigente y que hay que decidir qué
hacer, pero es tu decisión, no mía.

### Para poder trabajar sin adivinar

4. **¿Puedo tener acceso de lectura al esquema de Supabase?** Hoy deduzco las
   columnas leyendo el código de las páginas. Es la principal fuente de error.
5. **¿Existe el repositorio privado `entrenador-ia-datos`** que menciona
   `DECISIONES.md`? Si existe, ¿qué hay ahí?
6. **¿Hay dominio propio?** ¿O el paso 2 se apoya en la dirección de producción
   de Vercel?

### Decisiones de entrenamiento que no me corresponden

7. **¿Un casillero por ejercicio o uno por vuelta?** Los circuitos de Nico son de
   3 vueltas. Hoy puse **un solo casillero por ejercicio**, que vale para las tres
   vueltas, y el registro lo dice explícitamente ("se anotó en conjunto"). Anotar
   vuelta por vuelta serían 12 casilleros en un solo bloque. ¿Te sirve el conjunto
   o necesitas la vuelta?
8. **Los rangos que dejé fuera.** Registré los rangos de los ejercicios de fuerza.
   Dejé fuera los de movilidad y zona media —bird dog 6–8, dead bug, plancha
   lateral 15–20 s, sentadilla en pared— porque no me pareció que ese número
   cambie una decisión tuya. Si me equivoco, se agregan en cinco minutos.
9. **La lista de palabras de alerta de la bitácora.** Esa la tienes que escribir tú.

---

## 8. Lo que ya quedó hecho, sin esperar el diseño

Todo esto está en `cerca/nico/index.html` y probado en un navegador de verdad
(pantalla de teléfono, los tres días, con las llamadas a Supabase interceptadas
para no ensuciar la base real).

### 8.1 El feedback de Nico ahora dice la verdad

| Antes | Ahora |
|---|---|
| Los tres días llegaban como `nico-plan-v1-prototype` | `nico-dia1-v1`, `nico-dia2-v1`, `nico-dia3-v1` |
| `completion: "si"` siempre | Sale de los bloques que Nico marcó: ninguno → *no*; todos → *sí*; algunos → *casi* |
| `blocks_completed: 0` siempre | El número real de bloques marcados |
| Huella inventada | Huella real, calculada sobre lo prescrito de ese día |
| Sin consentimiento | Casilla de consentimiento obligatoria, con el mismo texto que Pali |
| La misión elegida quedaba solo en el teléfono | Viaja dentro del registro de ejecución |
| No se podía distinguir una vez de otra | Cada envío lleva su propio código único |

### 8.2 Casilleros de registro donde el número podía variar

**Sí llevan casillero:**

| Día | Ejercicio | Qué se pregunta | Por qué |
|---|---|---|---|
| 1 | B1 · Goblet squat | repeticiones | el rango 10–12 lo elige él |
| 1 | **B2 · Jalón en polea** | **peso de la polea** + repeticiones | la polea tiene muchos pesos y no hay referencia todavía |
| 1 | B3 · Flexiones | repeticiones | rango 6–12 |
| 1 | C2 · Floor press | repeticiones | rango 10–12 |
| 2 | C3 · Flexiones | repeticiones | rango 8–12 |
| 2 | C4 · Press de hombro | repeticiones | rango 8–10 |
| 2 | C5 · Elevación de cadera | repeticiones | rango 15–20 |
| 3 | Misión | minutos que se movió | lo elige él |

**No llevan casillero, a propósito:** todo lo que usa las mancuernas de 10 kg
(son las únicas que tiene: preguntar el peso sería preguntar algo que ya sabemos),
las repeticiones fijas, los tiempos de plancha, la bicicleta y el EMOM.

**Cómo se comportan:**

- **Nacen vacíos.** Al lado, en letra chica, dice *"Seba mandó 10–12"*. El número
  prescrito nunca se escribe **dentro** del casillero: si estuviera adentro, no
  tocarlo se leería como haberlo confirmado.
- En la polea dice *"Todavía no hay referencia"* y explica por qué: *"la polea
  tiene muchos pesos y todavía no sabemos cuál te queda bien. El primero que
  anotes es el que vamos a usar de referencia."*
- Una vez por día, bajo el primer casillero: *"Si no lo anotaste, déjalo en blanco.
  En blanco significa «no sabemos», y eso es más útil que un número inventado."*
- Antes de enviar hay un resumen de una línea con lo que se va a guardar, con los
  valores a la vista. Un `70` escrito como `700` se ve ahí.

### 8.3 Lo que llega a Supabase, verificado

Probado con un caso real: Nico marca 4 de 5 bloques, anota 12 en el goblet
(dentro del rango), 25 kg en la polea, 8 repeticiones en el jalón (fuera del
rango 10–12), 11 en el floor press, y **deja las flexiones en blanco**.

Lo que se guarda:

```
goblet      · reps 12  · Seba mandó 10–12 · confirmado
polea carga · 25 kg    · sin prescripción · registrado sin prescripción
polea reps  · 8        · Seba mandó 10–12 · MODIFICADO
flexiones   · en blanco· Seba mandó 6–12  · DESCONOCIDO
floor press · reps 11  · Seba mandó 10–12 · confirmado
completion  · "casi"   (4 de 5 bloques)
```

Fíjate en las dos últimas líneas del cuerpo de la tabla: **"modificado" y
"desconocido" son cosas distintas**, y las dos son información. Antes de hoy, las
dos habrían llegado como nada.

### 8.4 Lo que NO toqué, y por qué

- **La bitácora sigue guardando texto libre tal cual.** Clasificar molestias es
  construir un sistema que trata datos de salud, y eso lo tiene bloqueado la
  propia matriz de datos del proyecto. Espera tu decisión y la del abogado.
- **No agregué audio a Nico.** No lo pediste y sería una función nueva.
- **No toqué Panchi ni Pali.** Cambiarlas mientras están en uso, sin saber cuál es
  la buena (pregunta 1), sería trabajar a ciegas.
- **No creé ninguna tabla ni columna nueva.** No tengo acceso a la base. Todo lo
  de arriba usa columnas que Pali ya está usando hoy y que sabemos que funcionan.

### 8.5 Un defecto chico que arreglé de paso

El área de comentarios y el campo del chat se dibujaban en letra de máquina de
escribir en vez de la tipografía de CERCA: no heredaban la familia tipográfica.
Una línea de CSS.

---

*Este documento es interno. No se publica: `build.sh` bloquea todo archivo `.md`
en la salida pública.*
