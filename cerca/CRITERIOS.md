# CERCA — Criterios de Sebastián

**Qué es esto.** La lista de los criterios propios de Sebastián que gobiernan
CERCA: los que salieron de discusiones reales, uno por uno, y que si algo rompe,
está mal.

**Por qué existe.** Hasta hoy estos criterios vivían en tres sitios a la vez —el
razonamiento largo en `REGISTRO_APROBADOS.md`, la aplicación en el código, y el
resto en conversaciones sueltas— y no había una sola página donde leerlos todos.
Sin esa página, la única forma de saber si faltaba uno era que Sebastián se
acordara de decirlo. Eso es exactamente lo que este archivo viene a eliminar.

**Qué NO es.** No es el razonamiento. Cada criterio tiene una línea aquí y su
argumentación completa en el registro. Esta página se lee en tres minutos a
propósito: sirve para mirarla entera y decir *«falta uno»*.

**Cómo se lee la tabla.**

- **Dónde se razona** — el documento que explica de dónde salió y qué cuesta.
- **Dónde se aplica** — el archivo que lo hace cumplir. `—` significa que no lo
  puede hacer cumplir ningún programa: es criterio de entrenador y lo aplica una
  persona al escribir la sesión.
- Los criterios marcados **`[revisor]`** los comprueba el publicador antes de
  dejar publicar. Son los únicos que fallan solos.

---

## Método — los aplica el entrenador, no el código

| | Criterio | Dónde se razona | Dónde se aplica |
|---|---|---|---|
| **C-01** | **Prescrito ≠ ejecutado.** Lo que el entrenador manda es una hipótesis; lo que el alumno hizo es la evidencia. | `REGISTRO_APROBADOS.md` §14 bis | `s/reproductor.js` |
| **C-02** | **Un dato se captura porque puede cambiar una decisión futura.** Si el número no pudo variar, no se pregunta. | `REGISTRO_APROBADOS.md` §10, §14 bis | — |
| **C-03** | **No se pregunta lo que ya se sabe.** Si marcó los seis bloques, no se le pregunta si completó la sesión. | `PROPUESTA_OPERACIONAL.md` | `s/reproductor.js` |
| **C-04** | **Nada se da por obvio.** Un circuito se muestra con su recorrido completo, no con «3 vueltas». | `REGISTRO_APROBADOS.md` §14 bis | — |
| **C-05** | **El tiempo es un presupuesto.** Si la sesión dice 60 minutos, tiene que caber en 60 minutos. | *este archivo* | — |
| **C-06** | **Registrar menos no es acompañar menos.** Bajar casilleros no baja precauciones ni cronómetros. | `REGISTRO_APROBADOS.md` §14 bis | — |
| **C-07** | **Una diferencia entre dos alumnos solo se sostiene si nace de una diferencia entre sus entrenamientos**, no del orden en que se escribieron las páginas. | `REGISTRO_APROBADOS.md` §14 bis | auditoría |
| **C-08** | **Estándar la estructura, no el contenido.** Todos tienen check-in; qué se pregunta lo decide el entrenador por persona. | `REGISTRO_APROBADOS.md` §14 bis | `publicar/publicador.js` |
| **C-09** | **El calentamiento nace de lo que viene después.** La sesión se ejecuta calentamiento → desarrollo → cierre, y se diseña desarrollo → cierre → calentamiento. | *este archivo* | — |
| **C-10** | **Una primera sesión puede ser una hipótesis conservadora.** El error no es ser prudente al principio: es fosilizar esa prudencia cuando llega evidencia nueva. | *este archivo* | — |

## Evidencia — qué puede y qué no puede afirmar el producto

| | Criterio | Dónde se razona | Dónde se aplica |
|---|---|---|---|
| **C-11** | **El silencio no confirma nada.** Un campo prellenado que nadie tocó no dice que se hizo ese peso. | `REGISTRO_APROBADOS.md` §14 bis | `s/reproductor.js` |
| **C-12** | **La confirmación nunca puede venir de un número que puso el sistema.** Hace falta un acto del alumno: escribirlo, moverlo, o marcar el bloque. | `REGISTRO_APROBADOS.md` §14 bis | `s/reproductor.js` |
| **C-13** | **Un campo movido y devuelto a su valor no es un campo intacto.** Que alguien dude de una carga y la deje igual es una observación. | `REGISTRO_APROBADOS.md` §14 bis | `s/reproductor.js` |
| **C-14** | **«No sabemos» es un estado, no un hueco.** Un casillero sin número prescrito lleva un motivo, o después se lee como un olvido. **`[revisor]`** | `REGISTRO_APROBADOS.md` §14 bis | `publicar/publicador.js` |
| **C-15** | **Nunca se borra historia.** Se agrega evidencia y se recalcula lo que sabemos hoy. | `REGISTRO_APROBADOS.md` §14 bis | `sql/001-entregas.sql` |
| **C-16** | **Una entrega publicada no se edita.** Publicar de nuevo crea otra y jubila la anterior, que no se borra. | `COMO_PUBLICAR.md` · `REGISTRO_APROBADOS.md` §14 bis | `sql/001-entregas.sql` |
| **C-17** | **Repetir una sesión no autoriza a inventar la historia.** «No sabemos qué carga usaste» sigue siendo distinto de una carga prescrita. | `REGISTRO_APROBADOS.md` §14 bis | `sesiones/*.json` |

## Cuerpo y datos — lo que no se pregunta

| | Criterio | Dónde se razona | Dónde se aplica |
|---|---|---|---|
| **C-18** | **No se pregunta por el cuerpo.** El feedback pregunta por el entrenamiento. Si el alumno decide contar algo suyo, lo cuenta él. **Excepción única y acotada:** la pantalla de bienvenida, razonada en la entrada B-02. | `MATRIZ_DE_DATOS.md` · `REGISTRO_APROBADOS.md` §14 bis | `s/reproductor.js` |
| **C-19** | **Ninguna pregunta pide la causa corporal de una restricción.** (Regla B→C.) | `MATRIZ_DE_DATOS.md` | `s/reproductor.js` |
| **C-20** | **Nada sale a Supabase sin consentimiento explícito**, y el consentimiento va versionado. | `MATRIZ_DE_DATOS.md` | `s/reproductor.js` · `hola/bienvenida.js` |
| **C-21** | **Nunca se escribe un diagnóstico en algo que viaja dentro de la entrega.** La entrega la lee quien tenga el enlace. | `MATRIZ_DE_DATOS.md` | — |

## Convenciones de sesión

| | Criterio | Dónde se razona | Dónde se aplica |
|---|---|---|---|
| **C-22** | **Tabata = 4 minutos. Tabata doble = 8. Siempre 20 s / 10 s.** **`[revisor]`** | `REGISTRO_APROBADOS.md` §14 bis | `publicar/publicador.js` · `s/reproductor.js` |
| **C-23** | **Un día con 5 bloques o más se pliega en acordeón.** Con menos, se ve entero. | `REGISTRO_APROBADOS.md` §14 bis | `s/reproductor.js` |
| **C-24** | **El código de un ejercicio identifica dentro de su bloque**, no dentro del día. **`[revisor]`** | `REGISTRO_APROBADOS.md` §14 bis | `publicar/publicador.js` · `s/reproductor.js` |
| **C-25** | **Toda sesión termina preguntándole algo al alumno.** Una sesión que no pregunta nada al final no se publica. **`[revisor]`** | *este archivo* | `publicar/publicador.js` |
| **C-26** | **El comentario final es uno solo para todos**, vive en el código y pregunta por el entrenamiento. | `REGISTRO_APROBADOS.md` §14 bis | `s/reproductor.js` |
| **C-27** | **Una precaución es una instrucción escrita: ni pregunta ni registro.** Un consejo mejora la técnica; una precaución dice cuándo parar. | `REGISTRO_APROBADOS.md` §14 bis | `alumno/cerca-alumno.css` |
| **C-28** | **El audio del alumno dura lo que dura lo que tiene que decir.** Un comentario de sesión son 90 s; una historia de entrada, hasta 20 min. El tope se declara por pantalla y se justifica. | *este archivo* | `s/reproductor.js` · `hola/bienvenida.js` |

## Pantalla

| | Criterio | Dónde se razona | Dónde se aplica |
|---|---|---|---|
| **C-29** | **Piso de 12 px, y los casilleros a 16 px** para que el iPhone no haga zoom al escribir. | `REGISTRO_APROBADOS.md` §14 bis | `alumno/cerca-alumno.css` |
| **C-30** | **El cyan marca lo que está activo o elegido, no lo disponible.** El azul es lo que aporta el alumno. El ámbar es lo que escribió el entrenador, o lo que el alumno movió. | `REGISTRO_APROBADOS.md` §1, §14 bis | `alumno/cerca-alumno.css` |
| **C-31** | **El entrenador revisa mirando la pantalla del alumno, no el código.** | `REGISTRO_APROBADOS.md` §14 bis | `publicar/index.html` |
| **C-32** | **La vista previa no escribe nada.** Ni ejecución, ni feedback, ni bienvenida. | `REGISTRO_APROBADOS.md` §14 bis | `s/reproductor.js` · `hola/bienvenida.js` |
| **C-33** | **La vista previa mide lo que mide un teléfono.** Un marco más corto esconde cosas que sí existen. | `REGISTRO_APROBADOS.md` §14 bis | `publicar/index.html` |

## Operación

| | Criterio | Dónde se razona | Dónde se aplica |
|---|---|---|---|
| **C-34** | **Publicar es un acto, no un commit.** Desde el iPad, sin tocar código. | `COMO_PUBLICAR.md` | `publicar/` |
| **C-35** | **La auditoría recorre todas las sesiones, no la última que se tocó.** | `REGISTRO_APROBADOS.md` §14 bis | auditoría |
| **C-36** | **Ningún documento interno se publica.** La salida es lista blanca: falla cerrada. | `build.sh` | `build.sh` |
| **C-37** | **Sin build step.** El producto es HTML y JS plano, porque Sebastián trabaja desde el iPad. | `DECISIONES.md` D-001 | `.github/workflows/validar.yml` |

---

## Cómo entra un criterio nuevo

El problema no es escribir el criterio: es que aparezca sin que nadie lo note.
Un criterio aparece casi siempre igual — **como una corrección de Sebastián**:
*«son 4, no 8»*, *«deja la kettlebell sin número»*, *«baja el día 3»*. En ese
momento no parece un criterio; parece un arreglo. Se convierte en criterio
cuando la misma frase vuelve a servir para un caso que todavía no existe.

**La regla, y es de quien escribe el código, no de Sebastián:**

> Ninguna corrección suya se implementa sin quedar en esta tabla, con su número.
> Si la corrección es un caso particular, se escribe el criterio general que hay
> detrás; si no hay ninguno, se dice que fue un caso particular y no entra.

Sebastián no tiene que acordarse de nada. Tiene que poder **leer esta página y
decir «falta uno»**, que es una tarea de tres minutos y no de memoria.

**Tres capas, de la más barata a la más cara:**

1. **Esta página.** Corta a propósito. Si crece hasta no poder leerse de una
   sentada, deja de servir para lo único que sirve.
2. **`criterios.sh`.** Comprueba que la tabla y el código no se separen: que
   cada `C-nn` escrito en el código exista aquí, y que cada criterio marcado
   `[revisor]` esté de verdad citado en el publicador. Corre en cada push, en
   `.github/workflows/validar.yml`. Falla si algo no cuadra. **No toca el
   despliegue:** falla la comprobación de GitHub, no la publicación en Vercel.
3. **El registro.** El razonamiento largo, lo que costó y qué se descartó, sigue
   yendo a `REGISTRO_APROBADOS.md`. Esta tabla es el índice; el registro es la
   memoria.

**Lo que esto NO garantiza, dicho claro.** `criterios.sh` comprueba que la tabla
y el código no se contradigan. No puede comprobar que la tabla esté completa:
un criterio que nunca se escribió no deja hueco. Contra eso solo hay una cosa
—leer la página cada tanto— y por eso la página es corta.

---

## Regla de gobernanza de este archivo

- Un criterio revertido **no se borra ni se edita**: se marca aquí como anulado
  y se escribe el nuevo con su propio número. Misma regla que `DECISIONES.md`.
- Un criterio con excepciones las nombra en su propia fila (ver C-18).
- La numeración no se reutiliza nunca. Un `C-nn` retirado queda retirado.
