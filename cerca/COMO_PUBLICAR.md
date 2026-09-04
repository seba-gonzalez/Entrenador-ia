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

En `/publicar/`, arriba, tienes tres botones:

- **Traer la última entrega de este alumno** — el camino normal. Trae lo que le
  mandaste la semana pasada para que le cambies los números.
- **La semana de Nico** / **La sesión de Panchi** — para empezar desde una que
  ya existe. La primera vez de cada alumno, o cuando quieras copiar la
  estructura de otro.

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
