# CERCA — Matriz de datos

> **ESTADO: BORRADOR PARA REVISIÓN. NO APROBADO.**
> Este documento no autoriza ninguna captura ni persistencia. Existe para ser revisado
> antes de escribir código de persistencia, no después.
>
> Principio: **la privacidad no es un texto que agregamos al final. Es una restricción de
> diseño del producto desde el principio.**

Fecha: 2026-08-30 · Autor: análisis técnico · Pendiente de revisión jurídica.

---

## 0. Por qué existe este documento

La Ley chilena **21.719** entra en vigencia el **1 de diciembre de 2026**. Trata los datos
relativos a la salud como **datos personales sensibles** y contiene reglas específicas
—incluido el artículo 16 bis— que pueden afectar especialmente a información recogida en
contexto deportivo.

Consecuencia de diseño, no de redacción: **el problema no se resuelve usando `sessionStorage`
en vez de Supabase.** Cambiar el lugar de almacenamiento no cambia la categoría del dato ni
la finalidad del tratamiento. Por eso la decisión se toma dato por dato, aquí, antes de
implementar.

### Estado de bloqueo vigente

| | |
|---|---|
| **BLOQUEADO** | Captura y persistencia real de información de salud: lesiones, diagnósticos, molestias, dolor, antecedentes médicos y cualquier otra información explícitamente relativa a salud. |
| **BLOQUEADO** | Enviar información de salud a Supabase, a servicios externos o incluirla en URLs. |
| **BLOQUEADO** | Construir lógica de IA que procese información de salud. |
| **BLOQUEADO** | Asumir que el consentimiento del formulario de pre-lanzamiento cubre estos datos. |
| **PERMITIDO** | Construir la arquitectura visual y de estados necesaria para que ese bloque exista más adelante, con la captura desactivada. |

---

## 1. Las tres categorías

No son tres formas de decir lo mismo. Se distinguen por **quién las puede cambiar, cómo las
trata el producto y qué régimen legal les aplica.**

### A · PREFERENCIA
> *"No me gusta correr."*

Un gusto. La persona lo puede cambiar de opinión mañana y el producto puede, con tacto,
proponerle una variante más adelante (*"¿probamos 10 minutos de trote suave?"*).

- **Trato del producto:** informa la selección de ejercicios. Es negociable.
- **Categoría legal:** dato personal común.
- **Captura:** permitida.

### B · RESTRICCIÓN FUNCIONAL NO MÉDICA
> *"Prefiero no hacer saltos."*

Un límite que la persona declara **sin invocar una causa corporal**. No dice por qué. No
tiene que decirlo.

- **Trato del producto:** se respeta como frontera, no se negocia ni se pone a prueba. El
  producto no propone saltos "por si acaso".
- **Categoría legal:** dato personal común **mientras no se pregunte la causa**.
- **Captura:** permitida.

### C · INFORMACIÓN DE SALUD
> *"Me operaron la rodilla." · "Tengo tendinitis." · "Me duele el hombro."*

- **Trato del producto:** **ninguno por ahora.** No se captura, no se persiste, no se procesa.
- **Categoría legal:** dato personal **sensible**.
- **Captura:** **BLOQUEADA** hasta cerrar la revisión jurídica.

### La frontera peligrosa es B/C, y es una frontera que el producto puede cruzar solo

*"Prefiero no hacer saltos"* (B) y *"no puedo saltar porque me operaron el menisco"* (C)
describen **la misma decisión de entrenamiento** con estatus legal distinto. Lo único que
separa una de la otra es la causa.

De ahí sale una regla operativa para todo el producto, y en particular para el motor de
repreguntas:

> **REGLA B→C: ninguna pregunta de CERCA puede pedir la causa corporal de una restricción.**
> Preguntar *"¿por qué?"* sobre una restricción convierte un dato común en un dato sensible.
> El producto no necesita la causa para respetar el límite.

Esta regla descalifica explícitamente la repregunta que existía en la rama
`onboarding-conversacional-chatgpt`:

```
'Sobre esa molestia: ¿qué movimientos la hacen aparecer y cómo se siente hoy, del 1 al 10?'
```

Eso es captura de información de salud con escala de severidad. **No se revive.**

### La categoría es una propiedad del contenido, no del campo

Un campo de texto libre pensado para A puede recibir C. *"No me gusta correr, además me
molesta la rodilla"* llega por el campo de preferencias. Por eso:

> **REGLA DE FRONTERA: mientras el bloqueo esté vigente, todo campo de texto libre que pueda
> recibir información de salud se trata como si la contuviera.**

Esto no es teórico: **ya está ocurriendo en producción** (ver D-08 y D-10).

---

## 2. Convenciones de la matriz

- **ESTADO ACTUAL** = lo que hoy hace el código en producción. Verificado en el repositorio.
- **PROPUESTA** = lo que sugiero, sujeto a esta revisión. No implementado.
- **NO VERIFICADO** = no lo pude comprobar desde este entorno y no lo voy a inventar.

**Lo que no pude verificar y hace falta para cerrar esta matriz:**

1. El esquema real de la tabla `cerca_prelaunch_signups` (no hay SQL versionado en el repositorio).
2. Qué columnas automáticas añade (`created_at`, `id`, y si registra IP o user-agent).
3. Si hay Row Level Security configurada y con qué políticas.
4. Quién tiene acceso al proyecto Supabase y con qué rol.
5. La región de alojamiento del proyecto (determina si hay transferencia internacional).
6. Si existe política de retención o borrado automático. **No hay política de privacidad
   versionada en el repositorio.**

Los campos 6, 7, 8, 9 y 10 de la matriz no se pueden dar por cerrados hasta responder eso.

---

## 3. Condiciones comunes del grupo "landing" (D-01 a D-12)

Para no repetir doce veces lo mismo, lo que es idéntico se declara una vez. Cada dato
declara después solo lo que le es propio.

- **Origen:** formulario público de la landing (`cerca/index.html`), escrito o elegido por la
  propia persona. No hay obtención indirecta ni enriquecimiento de terceros.
- **Dónde se almacena (ESTADO ACTUAL):** Supabase, tabla `cerca_prelaunch_signups`, vía
  `POST /rest/v1/` con clave publicable desde el navegador (`cerca/app.js:115`).
- **Quién tiene acceso (NO VERIFICADO):** las personas con acceso al proyecto Supabase.
  Falta enumerarlas.
- **Comunicación a un tercero (ESTADO ACTUAL):** sí. **Supabase actúa como encargado de
  tratamiento.** No se comunica a nadie más. No hay analítica de terceros en la landing.
- **Cómo se corregiría (ESTADO ACTUAL):** no hay mecanismo. La persona no puede editar ni
  consultar lo que envió.
  **PROPUESTA:** correo de contacto publicado + procedimiento manual documentado, hasta que
  exista backend propio.
- **Cómo se eliminaría (ESTADO ACTUAL):** no hay mecanismo ni plazo.
  **PROPUESTA:** borrado a solicitud por el mismo canal, y borrado automático del registro
  completo a los **24 meses** desde el alta si no se convirtió en cuenta.
- **Consentimiento (ESTADO ACTUAL, texto literal):**
  > *"Acepto que CERCA guarde estas respuestas y mi correo para contactarme sobre el
  > pre-lanzamiento y la beta."*

  **Este texto no menciona datos de salud, no identifica al responsable, no indica plazo de
  conservación, no nombra a Supabase como encargado y no describe los derechos de la
  persona.** Por instrucción vigente, no se asume que cubre datos sensibles — y en mi lectura
  tampoco cubre con holgura los datos comunes, para el estándar que entra en vigencia.

---

## 4. Matriz — Datos que YA se recogen y persisten (producción)

Estos doce datos **ya se están capturando y enviando a Supabase hoy**. No son hipótesis.

### D-01 · `name` — Nombre
- **Por qué lo necesitamos:** para dirigirse a la persona por su nombre y no como a un registro.
- **Finalidad exacta:** personalizar el contacto del pre-lanzamiento y, más adelante, el saludo del perfil.
- **Categoría:** personal.
- **Conservación (PROPUESTA):** mientras dure la relación; 24 meses si no se convierte en cuenta.
- **Si no lo recogemos:** el contacto se vuelve impersonal. **No se rompe ninguna función.**

### D-02 · `email` — Correo
- **Por qué lo necesitamos:** es el único canal para avisar de la apertura. Es el dato que da sentido al formulario.
- **Finalidad exacta:** contactar sobre el pre-lanzamiento y la beta. Nada más.
- **Categoría:** personal. **Es el identificador que vuelve identificable a todo lo demás.**
- **Conservación (PROPUESTA):** igual que D-01. Es el primero que hay que poder borrar.
- **Si no lo recogemos:** **el formulario deja de tener función.** Es el único dato realmente indispensable de este grupo.

### D-03 · `country` — País
- **Por qué lo necesitamos:** CERCA se lanza primero en Chile; hay que saber a quién se puede atender ya y a quién no.
- **Finalidad exacta:** segmentar el orden de apertura y dimensionar la demanda fuera de Chile.
- **Categoría:** personal.
- **Conservación (PROPUESTA):** igual que D-01.
- **Si no lo recogemos:** no se puede priorizar la apertura ni avisar con honestidad "todavía no llegamos a tu país". Degrada, no rompe.

### D-04 · `city` — Ciudad (opcional)
- **Por qué lo necesitamos:** hoy, para nada operativo. Es granularidad que aún no usamos.
- **Finalidad exacta:** ninguna en firme.
- **Categoría:** personal.
- **Conservación:** —
- **Si no lo recogemos:** **no se rompe nada.**
- **RECOMENDACIÓN:** *si no hay una finalidad concreta, no se recoge.* Es el candidato más claro a eliminarse del formulario. Un dato sin finalidad es un pasivo, no un activo.

### D-05 · `trains_now` — Entrena actualmente (Sí / No)
- **Por qué lo necesitamos:** bifurca el formulario y describe al público real.
- **Finalidad exacta:** elegir qué preguntas mostrar y entender la mezcla de quien ya entrena vs. quien no empieza.
- **Categoría:** personal. **No es información de salud:** describe una conducta, no una condición corporal.
- **Conservación (PROPUESTA):** igual que D-01.
- **Si no lo recogemos:** el formulario pierde su ramificación y el bloque siguiente pierde sentido.

### D-06 · `training_type` — Tipo de entrenamiento (lista cerrada)
- **Por qué lo necesitamos:** para saber de qué está hecha la audiencia antes de decidir qué construye CERCA primero.
- **Finalidad exacta:** priorización de producto.
- **Categoría:** personal. Lista cerrada: no puede recibir texto de salud.
- **Conservación (PROPUESTA):** igual que D-01.
- **Si no lo recogemos:** las decisiones de producto se toman a ciegas. No rompe el registro.

### D-07 · `training_support` — Solo/a, con profesor/a, ambas (lista cerrada)
- **Por qué lo necesitamos:** distingue a quien busca reemplazar acompañamiento de quien busca complementarlo. Es la pregunta que define el posicionamiento de CERCA.
- **Finalidad exacta:** entender la relación de la persona con el acompañamiento humano.
- **Categoría:** personal. Lista cerrada.
- **Conservación (PROPUESTA):** igual que D-01.
- **Si no lo recogemos:** se pierde la señal más útil del formulario para el discurso de producto. No rompe el registro.

### D-08 · `training_challenge` — "¿Qué es lo que más te cuesta hoy?" — **TEXTO LIBRE**
- **Por qué lo necesitamos:** es la frase en la que la persona nombra su problema con sus palabras. Es material de producto de primera calidad.
- **Finalidad exacta:** entender el problema real que CERCA tiene que resolver.
- **Categoría:** **POR REVISAR.** El campo está pensado para A/B, pero **acepta texto libre y puede contener información de salud**. Basta con que alguien responda *"me cuesta por el dolor de espalda"*.
- **Conservación:** **bloqueada la decisión** hasta la revisión.
- **Si no lo recogemos:** perdemos la voz del usuario. El registro sigue funcionando.
- **HALLAZGO ACTIVO:** este campo **ya está en producción y ya puede haber recibido datos de salud.** Ver §6.

### D-09 · `start_barriers[]` — Qué falta para empezar (hasta 3, lista cerrada)
- **Por qué lo necesitamos:** describe el obstáculo de quien no entrena, que es el público que CERCA quiere activar.
- **Finalidad exacta:** priorización de producto para el segmento que aún no empieza.
- **Categoría:** personal. Lista cerrada de seis opciones; ninguna es de salud.
- **Conservación (PROPUESTA):** igual que D-01.
- **Si no lo recogemos:** se pierde el diagnóstico del segmento que no entrena. No rompe el registro.

### D-10 · `start_comment` — "Cuéntanos un poco más" — **TEXTO LIBRE**
- **Por qué lo necesitamos:** matiza la barrera elegida, sobre todo cuando marcaron "Otra cosa".
- **Finalidad exacta:** la misma que D-09, con más precisión.
- **Categoría:** **POR REVISAR.** Mismo riesgo que D-08, agravado: una pregunta abierta sobre *por qué no entrenas* invita directamente a responder con una lesión.
- **Conservación:** **bloqueada la decisión** hasta la revisión.
- **Si no lo recogemos:** se pierde matiz. **No rompe nada.**
- **HALLAZGO ACTIVO:** ver §6.

### D-11 · `consent_contact` — Consentimiento
- **Por qué lo necesitamos:** es la base del tratamiento. Sin él no se guarda nada.
- **Finalidad exacta:** acreditar que la persona aceptó, y qué aceptó.
- **Categoría:** personal. **Es el dato que legitima a todos los demás, por lo que su texto exacto y su fecha importan tanto como el booleano.**
- **Conservación (PROPUESTA):** mientras se conserve cualquier otro dato de la persona, **más el texto literal y la versión del consentimiento vigente al momento de aceptar.** Hoy solo se guarda `true`, lo que no permite demostrar *a qué* consintió.
- **Si no lo recogemos:** **no se puede recoger nada.**
- **BRECHA:** falta versionar el texto del consentimiento junto al booleano.

### D-12 · `source` — Origen del registro (`landing_prelaunch`)
- **Por qué lo necesitamos:** distinguir registros de la landing de futuros orígenes.
- **Finalidad exacta:** trazabilidad interna.
- **Categoría:** personal por asociación (no describe a la persona, pero viaja con ella).
- **Conservación (PROPUESTA):** igual que D-01.
- **Si no lo recogemos:** se pierde trazabilidad cuando haya más de una vía de alta. No rompe nada hoy.

### D-13 · Metadatos implícitos — **NO VERIFICADO**
- **Qué son:** columnas y registros que Supabase pueda añadir por su cuenta: `id`, `created_at`, logs de la API, dirección IP, user-agent.
- **Por qué importa:** **son datos personales que nadie decidió recoger.** No aparecen en el `payload` de `cerca/app.js` y por eso son fáciles de olvidar en una matriz.
- **Categoría:** personal (la IP lo es).
- **Todo lo demás:** **NO VERIFICADO.** Requiere entrar al proyecto Supabase.
- **ACCIÓN:** enumerarlos antes de cerrar esta matriz.

---

## 5. Matriz — Datos del Perfil V0 (futuros, NO implementados)

Ninguno de estos datos se captura hoy. La matriz existe para decidir **antes**, no para
documentar después.

**Condiciones comunes propuestas para este grupo:**

- **Origen:** conversación de perfil, escrita por la propia persona.
- **Dónde se almacenaría (PROPUESTA V0):** **solo en memoria de la sesión del navegador.
  Sin Supabase, sin URL, sin servicio externo.** Ver §7 para el motivo.
- **Quién tendría acceso (PROPUESTA V0):** solo la persona, en su propio dispositivo. Nadie más.
- **Comunicación a terceros (PROPUESTA V0):** **ninguna.**
- **Corrección (PROPUESTA):** la conversación es editable hacia atrás; la pantalla
  *"Esto entendí de ti"* existe precisamente para que la persona corrija antes de avanzar.
- **Eliminación (PROPUESTA V0):** se elimina al cerrar la pestaña, por construcción.
  No hay nada que borrar después.

### P-01 · `objetivo`
- **Necesidad:** es la dirección. Sin objetivo no hay criterio para decidir nada.
- **Finalidad:** orientar la propuesta de entrenamiento.
- **Categoría:** personal. **Riesgo de frontera:** un objetivo puede venir formulado como salud (*"recuperarme de una operación"*). Ver §6.
- **Si no lo recogemos:** **el producto no tiene función.** Es el dato indispensable.

### P-02 · `experiencia`
- **Necesidad:** fija el punto de partida y el techo razonable de la primera propuesta.
- **Finalidad:** calibrar complejidad y carga inicial.
- **Categoría:** personal.
- **Si no lo recogemos:** la propuesta se vuelve genérica: el defecto exacto que CERCA existe para no cometer.

### P-03 · `disponibilidad` (días por semana · minutos por sesión)
- **Necesidad:** determina la estructura del microciclo. Es el dato más estructural de todos.
- **Finalidad:** decidir cuántas sesiones y de qué duración.
- **Categoría:** personal.
- **Si no lo recogemos:** no se puede construir una semana. **Rompe la función.**

### P-04 · `otras_actividades`
- **Necesidad:** evitar sumar carga sobre carga que ya existe.
- **Finalidad:** ajustar volumen total.
- **Categoría:** personal.
- **Si no lo recogemos:** se corre el riesgo de sobrecargar. Degrada la calidad, no rompe.

### P-05 · `lugar` y `equipamiento`
- **Necesidad:** un ejercicio que la persona no puede ejecutar no es una propuesta, es un error.
- **Finalidad:** restringir el catálogo a lo ejecutable.
- **Categoría:** personal.
- **Si no lo recogemos:** la propuesta puede ser literalmente inejecutable. **Rompe la función.**

### P-06 · `preferencias` — **CATEGORÍA A**
- **Necesidad:** que la propuesta sea sostenible, no solo correcta.
- **Finalidad:** seleccionar entre alternativas equivalentes la que la persona vaya a hacer.
- **Categoría:** personal. **Riesgo de frontera:** campo abierto, puede recibir C.
- **Si no lo recogemos:** la propuesta es correcta y nadie la sigue. Degrada mucho, no rompe.
- **Trato:** negociable. CERCA puede proponer variantes más adelante.

### P-07 · `restricciones_funcionales` — **CATEGORÍA B**
- **Necesidad:** respetar un límite declarado por la persona.
- **Finalidad:** excluir del catálogo lo que la persona no quiere hacer.
- **Categoría:** personal **mientras no se pregunte la causa**. Si el producto pregunta por qué, se convierte en sensible. Ver REGLA B→C.
- **Si no lo recogemos:** CERCA propone lo que la persona ya dijo que no quiere. Rompe la confianza, que es el producto.
- **Trato:** **no negociable.** No se propone "por si acaso", no se pone a prueba, no se pregunta la causa.

### P-08 · `aclaraciones` — traza de repreguntas
- **Necesidad:** una repregunta que se olvida se vuelve a hacer. Repetir una pregunta ya respondida es la señal más clara de que nadie estaba escuchando.
- **Finalidad:** garantizar que el bucle de repregunta termina y no se repite.
- **Categoría:** personal; hereda la categoría del contenido de cada respuesta.
- **Si no lo recogemos:** el bucle de repreguntas no puede terminar de forma demostrable. **Rompe la función.**

### P-09 · `interpretación` — **dato derivado, creado por CERCA**
- **Necesidad:** es lo que la pantalla *"Esto entendí de ti"* muestra y lo que la persona confirma.
- **Finalidad:** hacer visible y corregible el criterio antes de proponer.
- **Categoría:** **POR REVISAR, y es el caso más delicado de la matriz.** No lo escribió la persona: **lo creamos nosotros.** Y una inferencia sobre la salud de alguien **es** información de salud, aunque la persona nunca haya escrito una palabra clínica. Si CERCA concluye *"parece haber una limitación de rodilla"* a partir de *"prefiero no hacer saltos"*, CERCA acaba de crear un dato sensible por su cuenta.
- **Si no lo recogemos:** desaparece el paso de confirmación, que es la diferencia entre acompañar y adivinar. **Rompe el modelo.**
- **REGLA DERIVADA:** mientras el bloqueo esté vigente, **la interpretación no puede inferir,
  nombrar ni sugerir causas corporales.** Puede decir *"no propondré saltos"*. No puede decir
  *"por tu rodilla"*. Esto es exigible y verificable en el texto que genere.

---

## 6. BLOQUEADO — Información de salud (categoría C)

### B-01 · `antecedentes` — lesiones, molestias, dolor, diagnósticos, cirugías
- **Por qué CERCA lo querría:** para no proponer un movimiento que haga daño. La necesidad es real y es la razón por la que este bloque existía en el prototipo.
- **Finalidad que tendría:** excluir o adaptar movimientos por razones corporales.
- **Categoría:** **SENSIBLE.**
- **Origen:** lo escribiría la persona.
- **Dónde se almacenaría:** **en ningún sitio. BLOQUEADO.**
- **Quién tendría acceso:** **nadie. BLOQUEADO.**
- **Conservación:** **no aplica mientras esté bloqueado.**
- **Corrección / eliminación:** no aplica: no hay dato.
- **Comunicación a terceros:** **prohibida.**
- **Qué deja de funcionar sin él:** CERCA no puede adaptar por razones médicas. **Puede seguir
  adaptando por restricciones funcionales declaradas (P-07), que cubren la mayoría de los casos
  prácticos sin recoger un solo dato sensible.** Esta es la razón por la que el bloqueo es
  viable y no paraliza el producto: *"prefiero no hacer saltos"* produce exactamente la misma
  decisión de entrenamiento que *"me operaron el menisco"*, sin el dato sensible.
- **Compensación obligatoria:** mientras el bloque esté desactivado, la propuesta debe llevar
  una advertencia visible. El prototipo ya tenía la frase correcta y se conserva:
  > *"Si aparece dolor agudo o una molestia que aumenta, detén el ejercicio. Este prototipo no
  > sustituye la evaluación de un profesional sanitario."*

### El prompt que NO se implementa

El onboarding actual de la raíz contiene este texto, que **no pasa a CERCA**:

```
'¿Hay algo de tu cuerpo que debamos cuidar — alguna molestia, lesión antigua o algo
 que te preocupe al moverte?'
```

Es una pregunta bien escrita y humana. Es también captura directa de datos sensibles.

### HALLAZGO ACTIVO — el bloqueo no cubre lo que ya está en producción

El bloqueo, tal como está enunciado, impide **implementar** captura nueva de salud. Pero
**D-08 (`training_challenge`) y D-10 (`start_comment`) ya están vivos en la landing, son texto
libre, y ya pueden haber recibido información de salud** que hoy está en Supabase.

No es hipotético: *"¿qué es lo que más te cuesta hoy con tu entrenamiento?"* y *"¿qué sientes
que te falta para empezar?"* son exactamente las preguntas que alguien responde con una lesión.

**Esto no lo puedo resolver desde el código y no debo resolverlo por mi cuenta.** Requiere una
decisión que es del proyecto, no mía. Las opciones, para la revisión:

1. **Auditar** lo ya recibido en esas dos columnas y decidir sobre lo que haya.
2. **Acotar los campos** con microcopy que pida explícitamente no incluir información de salud
   (mitiga, no elimina: el campo sigue siendo libre).
3. **Retirar D-10**, cuya utilidad es baja (*"no rompe nada"*) y cuyo riesgo es el más alto.
4. **Reforzar el consentimiento** antes del 1 de diciembre de 2026.

Ninguna de las cuatro está implementada. Ninguna se implementa sin aprobación.

---

## 7. Por qué el Perfil V0 se propone sin persistencia

La instrucción vigente dice que el problema **no se resuelve usando `sessionStorage` en vez de
Supabase.** Estoy de acuerdo, y la consecuencia es más incómoda de lo que parece.

La categoría de un dato es una propiedad de **lo que la persona escribe**, no del campo que se
lo pidió. Un perfil conversacional es casi todo texto libre. Por lo tanto:

- No se puede garantizar que P-01, P-06, P-07 y P-08 no contengan información de salud.
- No hay forma fiable de clasificar ese texto en el navegador. Un filtro por palabras clave
  daría falsos negativos, y un falso negativo aquí significa un dato sensible persistido.
- Enviarlo a un servicio para clasificarlo **ya sería enviarlo a un servicio externo**, que es
  justamente lo prohibido.

Por eso la propuesta para V0 es la única que es honesta: **el Perfil V0 no persiste nada.**
Vive en memoria mientras dura la sesión y desaparece al cerrar la pestaña.

Esto se puede decir en pantalla sin vergüenza, y el prototipo ya tenía la frase:

> *"🔒 Tus respuestas se quedan en este dispositivo durante el prototipo."*

Habría que ajustarla, porque *"se quedan en este dispositivo"* describe `sessionStorage`,
y la propuesta es más estricta: no se quedan en ninguna parte.

**Lo que se pierde:** la persona no puede cerrar y volver. Tiene que completar el perfil de una
sentada. Es un coste real de producto y hay que decidirlo con los ojos abiertos, no descubrirlo
después.

**Lo que no se pierde:** el flujo completo *conocer → interpretar → confirmar → aclarar →
propuesta* funciona entero sin persistir nada. La persistencia hace falta para **volver**, no
para **funcionar**.

---

## 8. Lo que esta matriz pide decidir

Ordenado por urgencia, no por comodidad.

| # | Decisión | Urgencia |
|---|---|---|
| 1 | Qué hacer con D-08 y D-10, que **ya están recogiendo texto libre en producción**. | **Alta — ya está ocurriendo** |
| 2 | Verificar los seis puntos NO VERIFICADOS de §2 (esquema, RLS, accesos, región, retención, IP). | Alta |
| 3 | Reforzar el texto de consentimiento y **versionarlo junto al booleano** (D-11). | Alta — antes del 1-dic-2026 |
| 4 | Publicar la política de privacidad prometida en la propia landing. | Alta |
| 5 | Confirmar o rechazar la propuesta de Perfil V0 sin persistencia (§7). | Media — bloquea la Fase C |
| 6 | Eliminar `city` (D-04) si no se le encuentra finalidad. | Baja, pero es gratis |
| 7 | Fijar plazos de conservación reales. Los 24 meses de este documento son una propuesta mía, no un criterio del proyecto. | Media |

---

## 9. Lo que este documento NO hace

- **No aprueba nada.** Es un borrador para revisión.
- **No autoriza implementar persistencia.** La instrucción vigente es explícita: *"No implementes
  la persistencia a partir de esa matriz. Primero la revisamos."*
- **No es una política de privacidad.** Es el insumo interno del que una política se escribiría.
- **No es asesoría jurídica.** Es un inventario técnico honesto de qué datos hay, de dónde vienen
  y a dónde van, para que quien haga la revisión jurídica tenga sobre qué trabajar.

---

## 10. Trazabilidad

- Datos D-01 a D-12 verificados en `cerca/app.js:95-107` y `cerca/index.html:147-207` (HEAD `8787873`).
- Prompt bloqueado citado desde `index.html` de la raíz (commit `bc30e17`).
- Repregunta descalificada citada desde `app.js` de la rama `onboarding-conversacional-chatgpt` (commit `f09eb0d`).
- Advertencia sanitaria y frase de privacidad citadas desde la rama `reconstruir-flujo-post-onboarding-chatgpt` (commit `5849625`).
