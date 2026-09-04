# Cómo mandarle una sesión a un alumno

Cuatro pasos. El primero se hace **una sola vez en la vida**; los otros tres son
los de cada semana y se pueden hacer desde el iPad.

---

## Paso 1 · Una sola vez: preparar Supabase

1. Abre **supabase.com** → tu proyecto → menú izquierdo → **SQL Editor**.
2. Abre el archivo `cerca/sql/001-entregas.sql` de este repositorio.
3. **Antes de pegarlo**, busca `'CAMBIA-ESTA-CLAVE'` y pon ahí tu clave.
   **Tiene que tener 20 caracteres o más**, y conviene que sea al azar, no una
   palabra. El SQL se niega a funcionar con una clave corta: es lo único que
   protege de verdad la pantalla de publicar, que vive en internet.
4. Pega todo y aprieta **Run**.

Si dice *Success*, listo.

> **Qué queda garantizado después de esto.** Una entrega publicada **no se
> puede modificar ni borrar**, ni desde la API ni desde el Table Editor del
> panel, ni siquiera como `service_role`. No es una promesa: hay un disparador
> en la base que lanza un error, y los disparadores se ejecutan para todos los
> roles. Probado contra un Postgres real.
>
> El único que puede saltárselo es quien sea dueño de la base, desactivando el
> disparador a propósito. Eso ya no es un descuido. Y aunque lo hiciera, cada
> ejecución que registra un alumno lleva la huella de la sesión que tuvo
> delante, escrita por su teléfono: para falsificar sin dejar rastro habría que
> editar también todas esas filas.

## Paso 2 · Traer la sesión

En `/publicar/`, arriba, tienes estos botones:

- **Traer la última entrega de este alumno** — el camino normal. Trae lo que le
  mandaste la semana pasada para que le cambies los números.
- **La semana de Nico** / **La sesión de Panchi** / **La semana de Lili** /
  **Las sesiones de Pali** — para empezar desde una que ya existe. La primera
  vez de cada alumno, o cuando quieras copiar la estructura de otro.
- **Bienvenida para alguien nuevo** — eso no es una sesión. Está explicado
  abajo, en *Cómo le mando la bienvenida a alguien nuevo*.

---

## Paso 3 · Mirarla y publicar

Debajo aparece **la pantalla del alumno tal cual**, dentro de un teléfono. No es
un dibujo ni una aproximación: es la misma página que ella va a abrir, con los
mismos bloques, dosis, descansos y casilleros. Puedes tocarla, abrir bloques y
probar el cronómetro: nada de lo que hagas ahí se guarda.

Arriba de la vista hay **una sola frase**:

- *Todo bien. 1 día · 6 bloques · 19 ejercicios · 4 casilleros para anotar.*
- o *Hay 2 cosas que arreglar antes de publicar*, con las dos cosas escritas en
  castellano y diciendo en qué día y en qué ejercicio están.

Si necesitas cambiar algo, abre **Ver el código** al final, edita, y la vista se
actualiza sola cuando paras de escribir. **Lo que hay que entender del texto:**

- **`dosis`** es lo que ella lee: `"10–12 · 10 kg"`.
- **`registro`** es dónde va un casillero. Solo donde el número pudo variar. Si
  el peso es fijo, no se pone.
- `"prescrito": true` va con el valor y con el rango. `"prescrito": false` va con
  un `"motivo"` que explica por qué todavía no hay referencia.
- `"prellenado": true` hace que el casillero nazca con el número escrito, como
  los 50 kg del squat. Ahí el silencio no confirma nada: hace falta que ella
  marque el bloque como listo o mueva el campo.

Cuando la frase diga que todo está bien, aprieta **Publicar**. Te devuelve el
enlace.

---

## Paso 4 · Mandarlo

Copias el enlace y se lo mandas por donde quieras.

---

## Cosas que conviene saber

**Publicar de nuevo no borra lo anterior.** Crea una entrega nueva y jubila la
vieja. La vieja sigue existiendo porque lo que el alumno ya entrenó apunta a
ella: si se borrara, su historial quedaría apuntando a algo que no existe.

**El enlace cambia cada vez que publicas.** Es a propósito: cada entrega es una
entrega distinta. Hay que mandar el nuevo.

**Una sesión que ya se entrenó no se corrige.** Si le mandaste 12 repeticiones
donde querías 10, eso queda. La corrección viaja a la sesión siguiente.
Reescribirla haría que el alumno abriera hoy algo distinto de lo que tuvo
delante cuando entrenó.

**Si algo falla al publicar**, la pantalla te dice qué pasó con palabras, no con
un código de error. Los tres casos comunes son que la clave no coincida, que sea
más corta de 20 caracteres, o que falte correr el SQL del paso 1.

**Si algo falla, mándame el texto que salió en pantalla.** Está escrito para que
sirva de diagnóstico: con esa frase sé exactamente en qué paso se cortó.

---

## Cómo le mando la bienvenida a alguien nuevo

Es lo que hoy mandas por WhatsApp cuando invitas a alguien. Ahora es una página
con su propio enlace, y lo que la persona cuenta llega a la base de datos en vez
de quedarse en una conversación.

**Una sola vez en la vida**, igual que el paso 1: abre `cerca/sql/002-bienvenidas.sql`,
pégalo entero en el **SQL Editor** de Supabase y aprieta **Run**. Este no lleva
clave que cambiar.

Después, cada persona nueva son cuatro toques:

1. Abre `/publicar/` y aprieta **Bienvenida para alguien nuevo**.
2. Arriba, en **Alumno**, escribe su nombre corto: `javiera`, `mati`, `ana-luz`.
   Minúsculas, sin tildes ni espacios. **Eso es todo lo que tienes que
   escribir.** La plantilla viene sin nombre a propósito, para que sirva para
   cualquiera, y el publicador le pone el que escribiste sin que tengas que
   abrir el código.
3. Mira la vista previa: es la página que ella va a abrir, con tu texto entero.
4. Aprieta **Publicar** y copia el enlace. Termina en `/hola/?e=…`, no en `/s/`.

Lo que le llega a ella: tu texto tal cual, un botón para grabar y un cuadro para
escribir. Puede usar los dos o solo uno, y **no hay ningún campo obligatorio**.
El audio puede durar hasta veinte minutos, y puede pausar, seguir, escucharlo
antes de mandarlo y volver a grabar si no le gustó. Antes de enviar tiene que
marcar el consentimiento; si no lo marca, el botón no la deja.

Cuando envía, ve un mensaje diciendo que te llegó y que le vas a devolver lo que
entendiste antes de armarle nada.

**Dónde queda lo que te manda.** En Supabase, tabla `cerca_bienvenidas`: el
nombre corto, la fecha, el texto y la ruta del audio, que vive en el mismo sitio
que los audios de feedback. **El audio no lo lee ninguna IA.** Lo escuchas tú y
escribes el resumen a mano, como hiciste con Nico y con Lili.

**Una cosa que tienes que decidir tú, y no es técnica.** Ese relato puede traer
lesiones u operaciones, y hoy **no hay ningún plazo de conservación**: se queda
guardado hasta que alguien lo borre a mano. El consentimiento le promete a la
persona que puede pedirte que lo borres, y hoy eso significa que entras a
Supabase y borras la fila y el archivo. Con cuatro personas funciona. Está
escrito entero, con lo que sí quedó protegido, en `MATRIZ_DE_DATOS.md`, entrada
**B-02**.

---

## Qué pasa con las páginas viejas

`cerca/nico/`, `cerca/pancha/` y `cerca/pali/` siguen funcionando y **no se
tocan** mientras haya alguien entrenando con ellas. La de Nico ya está también
como dato, y se ve mejor. Cuando quieras, le mandas el enlace nuevo y esa
carpeta se puede borrar.

**Panchi ya está convertida** desde la v4-evidence, con todo lo suyo: registro
por serie con los 50 kg escritos, carga compartida del circuito, audio de 90
segundos, consentimiento que bloquea, esfuerzo sin valor por defecto y el tabata
con sonido. De Pali no convertí nada: era la misma sesión que Panchi en una
versión anterior.
