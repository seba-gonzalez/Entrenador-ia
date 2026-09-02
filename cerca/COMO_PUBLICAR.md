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

## Paso 2 · Escribir la sesión

Una sesión es un archivo de texto con una forma fija. El que ya existe, y que
sirve de molde, es `cerca/sesiones/kecJVd0cI2VQVobjAof6xg.json`: es la semana
de Nico entera.

**La primera vez** se copia ese y se le cambia el contenido.
**Las siguientes**, no se escribe nada de cero: se aprieta *Traer la última
entrega de este alumno* y se le cambian los números.

Lo único que hay que entender de la forma:

- **`dosis`** es lo que Nico lee: `"10–12 · 10 kg"`.
- **`registro`** es dónde va un casillero. **Solo se pone donde el número pudo
  variar.** Si el peso es fijo, no se pone: preguntar algo que ya sabemos es
  fricción sin información.
- Dentro de un casillero, `"prescrito": true` va con el valor (`"texto"`) y con
  el rango (`"min"`, `"max"`). `"prescrito": false` va con un `"motivo"` que
  explica por qué todavía no hay referencia. **El revisor no te deja publicar un
  desconocido sin motivo**, porque un desconocido sin explicación se lee después
  como un olvido.

---

## Paso 3 · Publicar

1. Abre **`/publicar/`** de tu sitio en el navegador del iPad y entra con tu clave.
2. Escribe de quién es (`nico`) y el plan (`nico-v1`).
3. Pega la sesión, o trae la última y edítala.
4. Aprieta **Revisar**. Te dice qué está mal, con el día y el ejercicio.
5. Aprieta **Publicar**. Te devuelve el enlace.

El enlace **no caduca** y **no se puede adivinar**.

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

De Panchi y Pali no convertí nada, porque antes necesito que me digas cuál de
las dos es la buena (está preguntado en `PROPUESTA_OPERACIONAL.md`).
