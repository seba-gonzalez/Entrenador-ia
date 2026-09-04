# CERCA — Registro de decisiones aprobadas

> Fuente de verdad operativa para decisiones ya aprobadas de marca, landing y pre-lanzamiento.
> Regla: si una decisión cambia, no se borra la anterior; se registra la nueva versión y el motivo.

Última actualización: 2026-08-30 — revisión de dos copies de la landing: la frase protegida «Cuéntanos a tu manera» y el copy de entrada del pre-lanzamiento.

## 1. Identidad de marca

### APROBADO — Logo maestro CERCA
- Isotipo: fusión lineal y delicada de **Ulises (bulldog inglés) + dragón**.
- Construcción visual: el bulldog se integra dentro del recorrido circular del dragón; no son dos animales pegados ni una mascota caricaturesca.
- Estilo: tecnológico, premium, limpio y reconocible.
- Base cromática: negro profundo + celeste/cyan eléctrico; azul y violeta solo como secundarios/acento.
- Evitar: versiones pesadas, agresivas, demasiado realistas, deportivas genéricas o tipo gaming/suplementos.
- Tipografía de CERCA: limpia/futurista, con el isotipo pudiendo vivir solo o acompañado por el nombre.
- La lámina aprobada por el usuario el 2026-08-25 es la referencia visual maestra. No reinterpretar el logo sin aprobación explícita.

### APROBADO — Familia tipográfica: Archivo (2026-08-27)

**Archivo es la familia tipográfica principal aprobada para CERCA.**

> **Nota de la Fase 4A.1 (2026-08-27), conservada como historia:** *"Aprobada no significa implementada. La landing todavía no la carga. La implementación es trabajo de la Fase 4A.2."*

**ESTADO ACTUAL: Archivo está aprobada E IMPLEMENTADA en la landing.** Se implementó en la Fase 4A.2, commits `42f5653`, `d304651` y `89d589f`. Aquella nota describe el estado del 4A.1, no el de hoy.

**Razón de diseño**
- Aporta algo más de identidad propia que Inter.
- Mantiene una personalidad contemporánea, sólida y atlética sin caer en clichés fitness.
- Funciona tanto en titulares y caja alta como en conversación, UI, formulario y texto largo.
- Su personalidad es suficientemente sutil como para no convertirse en protagonista.

**Razón de validación**
- Comparación visual controlada Inter vs Archivo, con la única variable siendo la familia.
- Prueba en navegador real.
- Validación técnica con Archivo variable real sobre la versión actual de la landing.
- Comprobada a 390, 768 y 1440 px.
- Sin problemas materiales de legibilidad.
- Sin desbordamiento horizontal.
- Sin fallback de glifos en las piezas revisadas.
- Sin problemas materiales con la Ñ, las tildes ni las mayúsculas acentuadas.

**Sobre Inter.** Inter **no queda rechazada**: es una alternativa técnicamente válida y excelente que simplemente no fue la seleccionada.

**Lo que esta decisión NO decidía todavía en la Fase 4A.1 — histórico.** Nada de lo siguiente está aprobado y todo pertenece a la implementación de la Fase 4A.2: método de instalación, proveedor, autoalojamiento, subsets, pesos, tamaños, estrategia de precarga, `font-display` y el eje de ancho.

**Observaciones de la Fase 4A.1 que pasaron a 4A.2 — histórico**
- El hero móvil cae en tres líneas.
- El descriptor pequeño tiene muy poca holgura.
- La escala actual tiene demasiados tamaños.
- Hay demasiados pesos declarados.
- El tracking y el interlineado todavía no forman un sistema racionalizado.

### APROBADO — Sistema tipográfico CERCA · Fase 4A.2 (2026-08-27)

**Familia.** Archivo variable, **autoalojada** en el repositorio. Sin dependencia de Google Fonts en ejecución. Solo el eje de peso; **el eje de ancho no se usa**.

**Carga.** Un único subset `latin` en woff2, con `preload` y `font-display: swap`, y un fallback ajustado para reducir el salto mientras la fuente llega.

**Sistema: 15 roles tipográficos semánticos.**
`promesa` · `manifiesto` · `titular` · `declaracion` · `bloque` · `guia` · `lectura` · `remate` · `etiqueta` · `marca` · `descriptor` · `accion` · `pregunta` · `campo` · `apunte`

Dos ausencias deliberadas:
- **No existe un token «conversación».** La conversación comparte la receta de `lectura` **a propósito**: debe sentirse como prosa natural, no como interfaz.
- **No existe un token «etiqueta-corta».** Existe una **variante compacta del rol `etiqueta`** para cuando el layout lo exige. Una restricción de layout justifica una variante, no una voz tipográfica nueva.

**Pesos.** `400` lectura y campo · `700` estructura y énfasis · `800` remate, acción y marca.

**Line-height.** `.95` · `1` · `1.05` · `1.2` · `1.3` · `1.55` · `1.65`

**Tracking base.** `-.05em` display · `0` lectura y campos · `+.05em` remate y variante compacta · `+.08em` cabecera de conversación · `+.12em` etiquetas · `+.16em` marca.

### APROBADO — Excepción del hero: tracking −.055em (2026-08-27)
El hero conserva **−.055em**, no el −.05em del sistema. A 44px, ese valor mantiene **«que te acompaña.» como unidad a 360px**; con −.05em se parte.

**Está aprobada porque protege significado. No debe normalizarse automáticamente a −.05em.**

### APROBADO — Decisiones tipográficas móviles (2026-08-27)

| Pieza | Valor |
|---|---|
| Hero | **44px**. Tres líneas aceptables a 320px; dos desde 360px en las pruebas realizadas |
| Descriptor `ENTRENAMIENTO QUE RECUERDA` | **11px** |
| Kicker | **12px / 800** |
| Lectura y conversación | **15px / lh 1.55** |
| `memory-line` | **15px** |
| **Pregunta** del formulario | **16px / 700** |
| **Campo** del formulario | **16px / 400** — incluye `input`, `textarea`, `select` y las *option pills* |
| Consentimiento | **13px / 400** |
| Nota de privacidad | **12px / 400** |
| `HOY` / `MAÑANA` | **12px / 800**, tracking compacto **+.05em**, columna de 64px conservada |
| Handle | Variante compacta, para mantener «@ENTRENA.CERCA · CUPOS POR OLEADAS» en una línea sin cambiar copy ni layout |

**Razón funcional del rol campo a 16px:** por debajo de ese tamaño, Safari en iOS hace zoom al enfocar un campo. Y separar `pregunta` de `campo` distingue visualmente lo que el formulario pregunta de lo que la persona responde.

### APROBADO — Trazabilidad de la implementación (2026-08-27)
- **`42f5653`** — implementa Archivo autoalojada **manteniendo la escala anterior**, para aislar el efecto de la familia del efecto del sistema.
- **`d304651`** — implementa los 15 roles, las variantes y la excepción del hero.
- **`89d589f`** — corrige el **único fallo detectado en el QA final**: las *option pills* en móvil se habían quedado accidentalmente en 15px cuando el rol `campo` aprobado era 16px. La corrección forma parte de la historia, no se esconde.

### APROBADO — Erratas de implementación detectadas después del cierre de 4A (2026-08-28)

La Fase 4A quedó cerrada el 2026-08-27 y **no se reabrió**. Nada de lo que sigue revisa una decisión tipográfica: las recetas de los quince roles son exactamente las mismas antes y después. Lo que se registra es que la hoja no estaba **entregando** decisiones que ya estaban aprobadas, y cómo se corrigió.

Las cuatro erratas aparecieron mientras se trabajaba el color, y todas resultaron ser la misma forma: una regla que selecciona **dónde vive** un elemento en lugar de **qué es**.

- **`306d0a3`** — la marca y el CTA de navegación recuperan sus roles *marca* y *acción*. `.nav-links a,.nav a` no describía un enlace de navegación: describía cualquier ancla dentro del contenedor `.nav`, así que alcanzaba también a `<a class="brand">` y `<a class="nav-cta">` y los dejaba en 15px/400 en vez de 16px/800, en las seis anchuras. Se retira el selector que sobraba.
- **`502e9a3`** — el rol *lectura* recupera los párrafos de las tarjetas de «Cómo funciona» y las respuestas de preguntas frecuentes, que salían a 18,88px en vez de 15/16px. **La causa fue una corrección anterior nuestra:** en `d304651`, para proteger al `.kicker`, se añadió `:not([class])` a `.section p`; esa negación subió la especificidad de (0,1,1) a (0,2,1) y con ello la regla general pasó a derrotar al rol que se estaba escribiendo en ese mismo commit. Se corrige reduciendo la fuerza de la regla general con `:where()`, no fortaleciendo los selectores específicos.
- **`13abe4c`** — los dos botones del hero móvil recuperan el rol *acción*. `.actions .btn-primary{font-size:.94rem}` y `.actions .btn-ghost{font-size:.86rem}`, anteriores a 4A, los dejaban en 15,04px y 13,76px, y además con tamaños distintos entre sí. Se retiran las dos declaraciones; no se sustituyen por 16px, porque el rol ya lo dice.
- **`5683f6a`** — el manifiesto móvil recupera `line-height` 1. Un `<style>` incrustado en `index.html` declaraba `line-height:1.03!important`, fuera del alcance de cualquier capa. Se retiran sólo esas declaraciones; las de layout del mismo bloque se conservan.

**Estado verificado el 2026-08-28**, sobre 168 nodos en 320, 360, 390, 430, 768 y 1440:
- **15/15 roles PASS.**
- **Cero discrepancias** donde una regla ajena derrote a un rol.
- **Archivo** se renderiza en los 168 nodos; ninguno cae al fallback.

Estos son aprendizajes técnicos y metodológicos nacidos de erratas reales. No son una reapertura del diseño tipográfico. Los dos principios que dejaron están en §12.

### APROBADO — Jerarquía cromática CERCA · Fase 4B (2026-08-28)

El cyan hacía demasiados trabajos sin jerarquía: repartido en veintitrés contornos, cuatro palabras y dos tonos casi iguales, no señalaba nada porque acompañaba a todo. La Fase 4B le da un trabajo.

**Roles cromáticos aprobados.** Un token nombra una **responsabilidad**, no necesariamente un color distinto:

| token | valor hoy | responsabilidad |
|---|---|---|
| `--color-brand` | `#fff` | tinta del logotipo |
| `--color-link` | `var(--cyan)` | enlace de texto |
| `--color-action` | `var(--cyan)` | el acento del que está hecha una acción primaria |
| `--color-on-accent` | `#041111` | tinta **sobre** acento — no significa «acción» |
| `--color-enfasis` | `var(--cyan)` | la palabra donde vive la diferencia |

Marca, enlace, acción y énfasis comparten hoy `#10e7ef` **sin ser el mismo rol**. El día que uno se separe, se separa en un solo sitio.

**Trazabilidad:**
- **`bc8378f`** — introduce los cuatro primeros roles y repara el modelo: la semántica del componente pasa a ganar a la regla genérica de enlace. Corrige tres síntomas de una sola causa — la marca salía gris pese a declarar blanco, el CTA de navegación conservaba su tinta sólo por un `!important`, y el CTA de Instagram salía cyan sobre cyan con **contraste 1,00:1**. La regla de enlaces de texto pasa a `:where(...)`, especificidad cero: deja de ser una autoridad y vuelve a ser un valor por defecto.
- **`5189375`** — corrige una **regresión propia**: al reducir aquella regla en `bc8378f` se retiró sin querer el `text-decoration:none` del que dependía el CTA de navegación, que quedó subrayado durante tres commits. El barrido de propiedades de `bc8378f` no lo vio porque `text-decoration` no estaba entre las propiedades medidas. Se corrige haciendo que el componente declare lo suyo. No se esconde: es el origen del criterio de QA de §12.
- **`6bfcb45`** — implementación cromática final: unificación de cyan, énfasis verbal y bordes de acento.

**Estado final medido** en 320, 390, 768 y 1440: marca `#fff` 16/800 · CTA de Instagram **12,53:1** · ningún botón subrayado · sin scroll horizontal · 15/15 roles tipográficos intactos.

### APROBADO — Énfasis verbal en cyan (2026-08-28)

Palabras en cyan, y son todas:

- **Acompañamos.**
- **conversación.**
- **SIMPLE**

Pasan a texto normal: **LO COMPLEJO.** y **pocas personas.**

En «TE RESPONDEMOS SIMPLE PORQUE ENTENDEMOS LO COMPLEJO», lo complejo ocurre por dentro; **lo simple es lo que la persona recibe**. El cyan estaba al final de la frase, subrayando el problema; ahora está en la promesa.

**No existe obligación de tener una palabra cyan en cada titular.** «Una buena rutina es solo el comienzo.» permanece sin énfasis cyan, y así debe quedarse mientras no aparezca una razón semántica propia.

### APROBADO — Cuándo un borde es cyan (2026-08-28)

Un borde cyan se reserva para lo que comunica: **acción, estado, identidad de hablante, marca, selección, foco funcional y componente destacado**. Cuando sólo hay estructura, el borde es neutro.

Conservan cyan por esa razón: el CTA de navegación, la pill de pre-lanzamiento, la burbuja de CERCA, la «C» del hero móvil, la tarjeta destacada y su etiqueta, el foco de campo y la opción seleccionada.

Los recuentos **23 → 4 en móvil** y **22 → 6 en escritorio** son la **consecuencia** de aplicar esa clasificación. No son objetivos de diseño y no deben usarse como meta en el futuro. Lo que importa no es cuántos quedan, sino que el foco de campo y la opción marcada pasaron de ser dos cyanes entre veintitrés a ser de los pocos que quedan.

### APROBADO — Decisiones cromáticas deliberadamente conservadas (2026-08-28)

No se tocaron, y no por olvido:

- **`#1ec0c3`** de la burbuja de la persona — protegido por contraste y por identidad de hablante.
- **`#6ff8fc`** de la pill de pre-lanzamiento — es un componente de estado de producto, no una etiqueta más.
- **Azul y violeta** — aportan transición, no son ruido por defecto.
- **Glows, flare del hero, superficies y fondos.**
- **El chat del hero**, que sigue siendo el bloque cyan dominante de la primera pantalla.

Y una heurística que **no** se convierte en regla del sistema: *«funcional = opaco»* y *«atmosférico = alpha baja»* sirvieron para observar durante la auditoría, pero no definen semántica. Un focus ring puede ser translúcido y funcional; un glow puede superar puntualmente .20 y seguir siendo atmósfera. **La función se determina por el trabajo que hace el elemento, no por su alpha.**

### APROBADO — Simbología
- Ulises = compañía, lealtad, presencia y fuerza constante.
- Dragón = evolución, energía, transformación y superación.
- Juntos = presencia + transformación.

### APROBADO — Revelación progresiva
- No revelar el símbolo completo demasiado temprano en campaña.
- Puede utilizarse una evolución progresiva del dragón/isotipo acercándose al logo final a medida que se aproxima el lanzamiento.

## 2. Frases protegidas

### APROBADO
- **UN ENTRENADOR QUE TE ACOMPAÑA.**
- **LA IA NOS AYUDA A ESTAR MÁS CERCA.**
- **NO SOLO PLANIFICAMOS. ACOMPAÑAMOS.**
- **LA DIFERENCIA NO ES LA IA. ES LA CONVERSACIÓN.**
- **NO PARTIMOS DE CERO. PARTIMOS DE TI.**
- **TU ENTRENAMIENTO DE HOY DEBERÍA SABER CÓMO TE FUE AYER.**
- **ENTRENAS. NOS CUENTAS. RECORDAMOS. ADAPTAMOS.**
- **NO TIENES QUE EXPLICARTE COMO EXPERTO.**
- **CUÉNTANOS A TU MANERA.**
- **TE RESPONDEMOS SIMPLE PORQUE ENTENDEMOS LO COMPLEJO.**
- **MAÑANA NO PARTES DE CERO.**

### AFINADO — «CUÉNTANOSLO» pasa a «CUÉNTANOS» (2026-08-30)

| | |
|---|---|
| **Versión vigente** | **CUÉNTANOS A TU MANERA.** — protegida |
| **Versión anterior** | ~~CUÉNTANOSLO A TU MANERA.~~ — **HISTÓRICA / SUPERADA.** No es una alternativa válida ni una variante intercambiable |
| **Cuándo** | 2026-08-30, por decisión explícita de dirección |
| **Implementación** | `bd432fba251f2056e98d6093b4f1d55c5d88d217` |

**Motivo.** «Cuéntanoslo» generaba fricción al hablar y se sentía más forzado; había vuelto a aparecer como problema repetidamente. «Cuéntanos» conserva íntegra la intención —la persona puede expresarse a su manera, sin necesidad de sonar experta— con una formulación más natural.

> **Si una frase necesita ser explicada para sonar natural, la frase está haciendo demasiado trabajo.**

Que esta frase estuviera protegida no la hacía intocable: la protección impide cambiarla por descuido, no revisarla por decisión. Cambiar una decisión no borra su historia; cambia cuál es la versión vigente.

### NO USAR COMO FRASE CENTRAL
- Variantes tipo “Hablamos normal, nosotros entendemos”, porque se percibieron forzadas.
- Evitar expresiones como **“te respondemos humano”**: la humanidad/cercanía debe sentirse en el tono, no declararse.

## 3. Posicionamiento del producto

### APROBADO
CERCA no se define como un generador de rutinas. El núcleo es un ciclo de acompañamiento:

**ENTRENAR → CONTAR CÓMO FUE → RECORDAR → INTERPRETAR → ADAPTAR LA PRÓXIMA DECISIÓN**

Idea diferencial protegida:
**CERCA no solo personaliza tu rutina. Personaliza la próxima decisión a partir de lo que pasó en la anterior.**

La tecnología aumenta presencia, memoria, seguimiento y continuidad. La IA es el motor, no el héroe.

### AFINADO — El ciclo visible de la landing pasa a cuatro tiempos (2026-08-26)
- Qué cambió: el ciclo de cinco tiempos registrado arriba **se mantiene como descripción del ciclo post-sesión**. Lo que la landing comunica son cuatro:
  **ENTRENAS → NOS CUENTAS → RECORDAMOS → ADAPTAMOS**
- Por qué: *interpretar* ocurre por dentro y no necesita ser un paso visible. Antes de este cambio, escritorio contaba tres pasos, móvil cuatro y el registro cinco.
- La formulación de cinco tiempos no se elimina. §9 la sitúa dentro de un acompañamiento más amplio, que incluye el **antes** y el **durante**.
- Jerarquía de modelos, para que dos cosas distintas no compartan nombre:
  - **4 tiempos** — loop visible simplificado de marketing.
  - **5 tiempos** — descripción del ciclo post-sesión.
  - **antes / durante / después** — los tres momentos amplios del acompañamiento (§9).
  - **modelo interno completo** — el flujo operativo que conecta esos momentos (§9).

### AFINADO — La idea diferencial se amplía (2026-08-26)
- Qué cambió: *"Personaliza la próxima decisión a partir de lo que pasó en la anterior"* describe solo la **memoria entre sesiones**. El acompañamiento de CERCA también incluye la **adaptación inmediata** (lo que pasa hoy puede cambiar lo de hoy) y el **aprendizaje acumulado**. Ver §9.
- La idea protegida sigue vigente tal cual: ahora se entiende como **una de las tres capacidades**, no como la definición completa del producto.

## 4. Landing — primera pantalla móvil

### APROBADO — Dirección visual 2026-08-25
- Fondo negro profundo.
- Celeste/cyan eléctrico como color principal.
- Destello/luz sutil en el costado derecho del hero: aprobado.
- Sensación visual: premium, tecnológica, deportiva y humana; no gamer.
- Firma visible: **CERCA**.
- Descriptor aprobado en esta exploración: **ENTRENAMIENTO QUE RECUERDA**.
- Headline: **Un entrenador que te acompaña.**
- Apoyo: **La IA nos ayuda a estar más cerca.**
- Demostración corta del concepto:
  - **HOY → NOS CUENTAS QUÉ PASÓ**
  - **MAÑANA → CERCA ADAPTA LA DECISIÓN**
- CTA principal visible desde la primera pantalla.
- El usuario aprobó explícitamente colores, destello lateral, presentación de CERCA, descriptor y secuencia HOY/MAÑANA.

### PRINCIPIO DE DISEÑO MÓVIL APROBADO
**En escritorio explicamos. En móvil demostramos.**

## 5. Conversación de ejemplo

### APROBADO
- Mantener el bloque post-sesión como demostración central del producto.
- Destacar:
  - **TÚ CUENTAS QUÉ PASÓ.**
  - **CERCA entiende lo importante y te responde claro.**
- Conservar:
  - **No tienes que explicarte como experto.**
- La conversación de marketing es una construcción inspirada en casos reales; no presentarla como cita literal histórica.

### AFINADO — El tríptico reemplaza el recuadro de cierre anterior (2026-08-26)
- Qué cambió: el bloque destacaba **"TÚ CUENTAS QUÉ PASÓ."** + **"CERCA entiende lo importante y te responde claro."** en un solo recuadro. La landing usa ahora el tríptico de tres tiempos y cierra con **"MAÑANA NO PARTES DE CERO."**
- Por qué: en la versión anterior el tercer tiempo —**ajustar lo que viene**— no llegaba a aparecer.
- La formulación anterior queda como historia. Su intención está contenida en los tres tiempos.

### APROBADO — Estructura visual/comunicacional del tríptico (2026-08-26)
- **1. TÚ CUENTAS**
- **2. CERCA ENTIENDE**
- **3. CERCA TE RESPONDE**
- Copy aprobada para el tercer bloque: **“Te respondemos claro y ajustamos lo que viene.”**
- Frase de cierre aprobada: **“MAÑANA NO PARTES DE CERO.”**
- La estructura debe entenderse en segundos y no transformarse en una explicación técnica del motor interno.

### APROBADO — Criterio de tono y longitud (2026-08-25)
- **Cercanía no significa más texto.** Una respuesta puede sentirse humana, tranquila y acompañante sin alargar el chat.
- CERCA debe responder con fluidez conversacional, no como informe ni como lista de variables detectadas.
- Evitar repetir literalmente lo que el usuario acaba de decir solo para demostrar comprensión.
- La respuesta ideal hace tres cosas con pocas palabras: **reconoce → interpreta → propone**.
- Puede usar lenguaje cercano y sereno como “ya, te entendí”, “lo ajustamos”, “vamos con esto”, “seguimos”, siempre sin impostar vulgaridad ni exceso de confianza.
- No convertir cada feedback en un resumen estructurado de 3–5 puntos si eso rompe la conversación.

### RECHAZADO — Exploración visual/post-entreno posterior del 2026-08-25
Motivos:
- Los chats se alargaron demasiado y perdieron naturalidad.
- En una variante se repitió la información del usuario en forma de resumen antes de tomar una decisión, generando redundancia.
- En la pieza central se introdujeron representaciones separadas de Ulises y del dragón con estilos distintos al logo maestro, rompiendo coherencia visual.
- La tercera variante convirtió una idea simple en una conversación excesivamente larga.
- La dirección anterior, más corta y visual, se considera mejor base.

### REGLA VISUAL — ULISES + DRAGÓN
- Si aparecen Ulises o el dragón como recurso gráfico, deben derivar del **mismo lenguaje lineal y delicado del logo maestro**.
- No usar un Ulises holográfico de un estilo y un dragón de otro.
- No inventar nuevas interpretaciones del símbolo para llenar espacio visual.

## 6. Cuestionario corto de pre-lanzamiento

### APROBADO — Estructura
Siempre:
- Nombre
- Correo
- País
- Ciudad opcional
- ¿Entrenas actualmente?

Si entrena:
- Qué entrena principalmente
- Cómo entrena: solo/a / con profesor/a / ambas
- Qué es lo que más le cuesta actualmente, opcional

Si no entrena:
- Qué siente que le falta para empezar
- Selección múltiple, mínimo 1 y máximo 3
- Barreras: saber qué hacer, tiempo, constancia, acompañamiento, lugar/equipo, otra cosa
- Comentario opcional

### APROBADO — Copy de entrada del pre-lanzamiento (2026-08-30)

Vigente: **«Queremos construir CERCA con personas que quieren entrenar.»**

Sustituye a *«…con personas que entrenan de verdad»*, que quedaba **HISTÓRICA / SUPERADA**: dejaba fuera a quien todavía no ha empezado.

**Motivo.** CERCA incluye tanto a quien ya entrena como a quien quiere comenzar, y el propio formulario de esta sección ya contempla *«No, quiero empezar»*. La promesa verbal tenía que ser coherente con esa inclusión: alguien que aún no entrena debe poder leer la frase y pensar *«esto también puede ser para mí»*.

> **CERCA acompaña un proceso. No exige que el proceso ya haya empezado.**

Es copy operativo de esta sección, no una frase maestra: no entra en §2.

**Implementación:** `bd432fba251f2056e98d6093b4f1d55c5d88d217`.

### APROBADO — Separación de formularios
- Formulario corto = interés/pre-lanzamiento.
- Onboarding largo = solo después, para usuarios/alumnos beta.
- No fusionarlos.

## 7. Centro de Control CERCA

### APROBADO — Flujo interno
**Nuevo → Contactado → Invitado beta → Probando → Activo / No siguió**

Cada inscripción mantiene:
1. Respuesta original de la persona.
2. Clasificación interna CERCA.

Clasificaciones/filtros relevantes:
- país/ciudad
- entrena / quiere empezar
- disciplina
- solo / con profesor / ambas
- barreras
- estado de lead
- oleada beta
- notas internas

## 8. Privacidad y datos

### APROBADO — Principio de desarrollo
La privacidad pasa a ser parte de la arquitectura de CERCA, no una tarea posterior.

Antes de agregar una nueva captura de datos se debe preguntar:
1. ¿Qué dato pedimos?
2. ¿Para qué lo necesitamos?
3. ¿Quién puede verlo?
4. ¿Cuándo se elimina?

Regla: **porque CERCA pueda preguntar algo no significa que necesite almacenarlo.**

Semáforo interno:
- Verde: datos básicos de contacto/contexto.
- Amarillo: datos de entrenamiento y sensaciones, revisar necesidad/finalidad.
- Rojo: lesiones, diagnósticos, patologías, medicamentos u otros datos de salud; requieren revisión específica antes de ampliar su almacenamiento.

## 9. Modelo de acompañamiento — antes, durante y después

### APROBADO — CERCA acompaña a "la persona de hoy" (2026-08-26)
CERCA no adapta solamente el entrenamiento a una persona en abstracto: busca adaptar **las decisiones a la persona de hoy**.

La misma persona puede llegar en días distintos con cambios en descanso, energía, ánimo, tiempo disponible, molestias, lugar, equipamiento, entrenamiento previo o contexto cotidiano.

**El objetivo puede mantenerse mientras la decisión del día cambia.**

Idea conceptual aprobada:
> No adaptar solo el entrenamiento a la persona. Adaptarlo a la persona de hoy.

No es necesariamente copy literal de marketing: es criterio de producto.

### APROBADO — El acompañamiento no empieza solo después (2026-08-26)
El modelo de producto es más amplio que el feedback post-sesión. CERCA puede acompañar **ANTES, DURANTE y DESPUÉS**:

- **ANTES** — tener en cuenta cómo llega la persona y aquello que pueda cambiar una decisión.
- **DURANTE** — aceptar que una sesión puede necesitar ajustes según lo que realmente ocurre.
- **DESPUÉS** — recoger feedback relevante y usarlo para decisiones futuras.

**Este modelo NO reemplaza el loop simple de marketing aprobado** (ENTRENAS → NOS CUENTAS → RECORDAMOS → ADAPTAMOS). Es una comprensión interna más completa del producto.

Regla: **la complejidad ocurre por dentro; la comunicación al usuario debe seguir siendo clara.**

### APROBADO — Modelo interno completo de acompañamiento (2026-08-26)

**CÓMO LLEGAS → DECIDIMOS → ENTRENAS → OBSERVAMOS / AJUSTAMOS → NOS CUENTAS → RECORDAMOS → LO USAMOS LA PRÓXIMA VEZ**

Este modelo conecta el acompañamiento antes, durante y después. **No es una secuencia que deba mostrarse literalmente en la landing.** Su función es ayudar al equipo a entender dónde puede intervenir CERCA a lo largo del proceso.

Relación con los otros modelos registrados:
- **antes / durante / después** — momentos amplios.
- **7 tiempos** — modelo interno operativo.
- **5 tiempos** — ciclo post-sesión histórico (§3).
- **4 tiempos** — comunicación simplificada de la landing (§3).

> La complejidad ocurre por dentro; la persona recibe claridad.

### APROBADO — Tres capacidades de acompañamiento (2026-08-26)
- **A. Adaptación inmediata** — lo que está pasando hoy puede cambiar lo que hacemos hoy.
- **B. Memoria entre sesiones** — lo que pasó anteriormente puede influir en lo que hacemos hoy.
- **C. Aprendizaje acumulado** — lo observado a lo largo del tiempo debe ayudar a mejorar futuras decisiones.

Estas capacidades explican el acompañamiento, pero **no deben convertirse automáticamente en más pasos visibles** en la landing.

### APROBADO — Adaptar no es cambiar por cambiar (2026-08-26)
Un cambio en el estado o contexto de la persona **no obliga automáticamente a modificar la sesión**. CERCA debe interpretar si ese cambio es relevante. A veces la mejor decisión será modificar; a veces será mantener lo planificado.

> La ausencia de cambio también puede ser una decisión.

Evitar el comportamiento reactivo `dato diferente → cambio automático`. La lógica correcta es:
**entiendo cómo llegaste → evalúo si importa → decido.**

### APROBADO — Un día adaptado no es un día fallido (2026-08-26)
Cumplir exactamente el plan no es siempre el único indicador de una buena sesión. Según el contexto puede tener sentido bajar intensidad, reducir volumen, acortar, cambiar un ejercicio, priorizar técnica, hacer movilidad, hacer cardio suave, o simplemente moverse con otro objetivo.

La adaptación debe **preservar el propósito de entrenamiento cuando sea posible**, sin convertir el plan en una obligación ciega.

### APROBADO — CERCA respeta la planificación (2026-08-26)
CERCA **no se posiciona contra la planificación**. La planificación tiene valor. El diferencial está en permitir que dialogue con la realidad cuando las circunstancias cambian.

> CERCA hace que la planificación pueda seguir teniendo sentido cuando la realidad cambia.

La marca no debe construir valor diciendo que los planes son malos, rígidos o inútiles.

## 10. Criterios de conversación y cercanía

### APROBADO — Preguntar no es el valor (2026-08-26)
CERCA no debe convertir el conocimiento de la persona en un interrogatorio. No se pregunta por recopilar información: se pregunta cuando la respuesta **puede cambiar una decisión** o cuando hace falta comprender algo relevante.

La información también puede venir de contexto previo, feedback espontáneo, historial o una conversación natural.

> Acompañar no es preguntar más. Es saber qué información importa y usarla bien.

**Aclaración — la regla es contextual, no un calendario.** Este principio **no** establece que "antes no se pregunta" ni que "después siempre se pregunta". Preguntar es válido en cualquier momento cuando la respuesta puede cambiar una decisión, y es evitable en cualquier momento cuando la información ya está disponible o no cambiaría nada. La asimetría que hoy tiene la landing —*"tiene en cuenta cómo llegas"* antes, *"te pregunta cómo te fue"* al terminar— es una decisión de esa pieza, no una regla general del producto.

**NO GENERALIZAR** — La fricción de una pregunta depende del momento, el contexto y la necesidad. No asumir como regla que un check-in previo es trámite ni que el feedback posterior siempre se vive como desahogo. Esta simplificación surgió durante la discusión del 2026-08-26 y fue descartada como principio operativo.

### APROBADO — La cercanía se demuestra, no se declara (2026-08-26)
Consolida el criterio de tono ya registrado en §5. Queremos que la persona pueda experimentar cosas como: CERCA se acordó; entendió lo relevante; no tuve que repetir todo; tuvo en cuenta cómo llegué; ajustó cuando tenía sentido; **mantuvo cuando no hacía falta cambiar**; me explicó una decisión con claridad.

No necesitamos declarar *"estamos contigo"*, *"somos humanos"* o *"te entendemos"*.

> Cercanía no significa escribir menos. Significa que cada frase tenga una función.

Una frase puede: reconocer · interpretar · decidir · explicar · tranquilizar · reducir fricción · generar confianza · cerrar una conversación.

Lo que se evita son las frases que solo existen para que CERCA parezca cercano, humano o inteligente.

## 11. Criterios de marketing y diferenciación

### APROBADO — Diferenciación por comportamiento, no por ataque (2026-08-26)
CERCA no necesita reducir el valor de otras alternativas para demostrar el suyo. Un plan personalizado, un chat de IA o un entrenador humano pueden aportar valor.

CERCA debe diferenciarse **mostrando comportamientos concretos** de su propuesta.

Evitar: caricaturizar competidores · atribuirles limitaciones absolutas · construir strawman · describirlos injustamente para que CERCA parezca mejor.

> Diferenciación por comportamiento, no por ataque.

## 12. Criterios de diseño

### APROBADO — El diseño sirve al significado, no al revés (2026-08-26)
**La precisión semántica está por encima de la simetría visual.** Si un contenido correcto no encaja perfectamente, primero debe intentarse adaptar disposición, ritmo, tamaño, espacio o jerarquía.

No se reescribe algo correcto solo para que una grilla quede geométricamente pareja.

Esto **no** significa que nunca se pueda editar copy por razones de diseño: significa que una versión nueva debe conservar la verdad, la precisión y la intención de la anterior.

### APROBADO — Cada bloque tiene un trabajo principal reconocible (2026-08-26)
No es "un único trabajo": un bloque puede además emocionar, generar confianza o aclarar. El problema aparece cuando intenta explicar, diferenciar, vender y tranquilizar a la vez y termina repitiendo a otros bloques.

Antes de agregar o modificar algo, preguntar:
1. ¿Qué trabajo principal hace?
2. ¿Qué entiende mejor la persona gracias a él?
3. ¿Reduce fricción o genera confianza?
4. ¿Demuestra CERCA o solo habla de CERCA?
5. ¿Repite algo que ya dijimos en otra sección?
6. ¿Se siente como CERCA o como una landing genérica de fitness/IA?
7. Si lo quitamos, ¿qué se pierde realmente?

### APROBADO — Cuándo una diferencia merece existir (2026-08-27)
> Menos valores no es el objetivo. Menos decisiones arbitrarias sí.

Una diferencia tipográfica, cromática o de espacio debe poder responder a la pregunta *¿qué trabajo hace?*. Si no puede, sobra. Pero reducir por reducir empobrece igual que acumular.

> Una excepción que protege significado no debilita el sistema; lo explica.

Cuando un valor de sistema y una unidad de significado entran en conflicto, gana el significado, y la excepción se registra con su razón.

### APROBADO — Cómo se aprueba una familia tipográfica (2026-08-27)
Una familia no se aprueba porque tenga una historia atractiva ni porque gane una captura aislada. Se aprueba cuando **aporta identidad sin impedir que el producto haga su trabajo**.

> La identidad puede aparecer con el tiempo; la fricción se siente inmediatamente.

Por eso la personalidad tipográfica nunca debe comprarse sacrificando claridad.

### APROBADO — Principios de color (2026-08-28)

> **El color de marca no tiene que estar en todas partes. Tiene que aparecer donde su presencia haga un trabajo.**

> **No unificamos colores porque se parecen. Los unificamos cuando hacen el mismo trabajo.**

> **El cyan verbal aparece donde vive la diferencia, no donde termina la frase.**

> **La acción gana porque alrededor hay menos ruido, no porque grita más.**

> **Identidad no es colorear más.**

Síntesis:

> **El cyan de CERCA no tiene que demostrar presencia. Tiene que demostrar criterio.**

Es la misma idea que sostiene el producto: CERCA acompaña tomando decisiones sobre qué importa, y su lenguaje visual debe hacer lo mismo. Un color que se reparte por igual dice *todo importa igual*, que es justo lo que dice un plan que no mira a nadie.

### APROBADO — Cuándo una implementación está correcta (2026-08-28)

Dos principios técnicos nacidos de erratas reales —las cuatro posteriores al cierre de 4A (§1) y las tres reparaciones cromáticas de 4B (§1)—, no de una discusión teórica. Seis instancias del mismo mecanismo.

> **La implementación no está correcta porque contenga la regla correcta. Está correcta cuando la decisión correcta llega a pantalla.**

Por eso la verdad de una decisión visual es el *computed style* del nodo real, no la regla escrita. Y no se atribuye al hijo el valor medido en el padre.

> **Una regla debe seleccionar aquello que significa, no todo lo que casualmente vive dentro del mismo contenedor.**

`.nav a`, `.section p`, `.actions .btn-primary` y `.footer a` describían **dónde vive** un elemento, no **qué es**, y por eso derrotaban a los componentes. La corrección nunca fue subir la especificidad del componente ni añadir `!important`: fue reducir la fuerza de la regla general para que vuelva a comportarse como valor por defecto.

Dos consecuencias de método, aprendidas a base de fallar:

- **Una corrección por especificidad no termina cuando el caso corregido pasa.** Termina cuando se comprueba a quién más alcanza la regla modificada. Añadir `:not([class])` para proteger un elemento creó una errata mayor en el mismo commit.
- **Un barrido de propiedades sólo demuestra las propiedades que enumera.** Decir «cambian N elementos» no prueba la página si sólo se compararon algunas propiedades: un subrayado se coló exactamente por ese hueco. Toda verificación visual lleva dos capas — computed styles para lo semántico y comparación de píxeles para lo que la lista no contempla.

### APROBADO — Símbolos y clichés de IA (2026-08-26)
**La IA es el motor, no el héroe** (§3), también en lo visual. No usar símbolos genéricos de IA solo para declarar que el producto tiene IA. Cuestionar especialmente elementos como el sparkle ✦ cuando su única función es comunicar "IA".

Los elementos visuales deben aportar función, dirección, estado, identidad, jerarquía o atmósfera. No decoración tecnológica genérica.

## 13. Landing — estado aprobado tras la Fase 3 (2026-08-26)

### APROBADO — #por-que
- Trabajo principal: **dimensión humana / realidad de quien entrena**.
- Salen los chips **Recuerda / Escucha / Adapta** (repetían el loop en miniatura).
- Se conserva: **"La diferencia no es la IA. Es la conversación."**
- Se conserva: **"Tu entrenamiento de hoy debería saber cómo te fue ayer."**
- El mecanismo de continuidad no se vuelve a explicar aquí: pertenece a `#como-funciona`.

### APROBADO — #posicionamiento
- Trabajo principal: **diferenciar**.
- Comparación justa entre **CERCA / Un plan personalizado / Un chat de IA**.
- CERCA se describe mediante **comportamientos**; las alternativas se describen **sin caricaturizarlas**.
- Tarjeta CERCA vigente:
  - Tiene en cuenta cómo llegas ese día
  - Si hoy llegas distinto, CERCA puede ajustar la sesión
  - Te pregunta cómo te fue cuando terminas
  - Se acuerda de lo que le contaste y lo usa para decidir lo que viene

### APROBADO COMO COPY ACTUAL — Título de #posicionamiento
**"Una buena rutina es solo el comienzo."**
Aprobado como copy vigente de la landing. **No pasa a frase protegida universal de marca**: sigue en evaluación.

### APROBADO — Pre-lanzamiento
- Titular: **"Estamos empezando con pocas personas."**
- Acceso por oleadas y de forma gradual.
- **Evitar escasez artificial**: el acceso gradual existe porque queremos aprender, escuchar y acompañar bien antes de crecer. Debe sentirse como cuidado del proceso, no como táctica de urgencia.

### APROBADO — Instagram
- Titular: **"Nos vemos en Instagram."**

### APROBADO — Símbolos en la landing
- CTA principal **sin ✦**.
- Fila **MAÑANA** usa **→**.
- Botón de Instagram **sin ◎**.
- Chips eliminados.

### APROBADO — Uso de la palabra "conversación"
Se protege para usos con verdadero valor de marca y para el intercambio **CERCA ↔ persona**. No se gasta en significados genéricos.

Proteger especialmente:
- **"Ver conversación"**
- **"La diferencia no es la IA. Es la conversación."**

## 14. Pendientes y exploraciones abiertas

Nada de esta sección está aprobado. Se registra para que no se dé por decidido.

### PENDIENTE — Producto y landing
- Una **sección visual antes / durante / después**. La comprensión de §9 ya mejora el criterio y el posicionamiento; una pieza propia no está decidida.
- Una **segunda conversación de ejemplo, antes de entrenar**.
- Mostrar **`#posicionamiento` en móvil** (hoy oculto bajo 560px).

### PENDIENTE — Identidad visual
- ~~**Tipografía**~~ — **CERRADO.** La Fase 4A está completa: Archivo está implementada y el sistema tipográfico registrado en §1. El problema original —`Inter` declarada y nunca cargada— ya no existe.
- ~~**Erratas tipográficas posteriores al cierre de 4A**~~ — **CERRADO** el 2026-08-28. Las cuatro están corregidas y registradas en §1; verificación final 15/15 roles PASS, cero discrepancias.
- ~~**Jerarquía global del cyan**~~ — **CERRADO** el 2026-08-28 con la Fase 4B. Los cinco roles cromáticos, el énfasis verbal y el criterio de bordes están en §1.
- ~~**CTA de Instagram: contraste incorrecto**~~ — **CERRADO.** Salía cyan sobre cyan, **1,00:1**, porque `.footer a,.faq-grid a,.instagram-card a,.eyebrow-row a` ganaba por especificidad a `.btn-primary`. Corregido en `bc8378f`: hoy es **12,53:1**.
- **Favicon** y **`og:image`**.
- **Flechas `→` y `↗`.** Quedan fuera del subset de Archivo —y también de `latin-ext`—, así que las dibuja un glifo del sistema y cambian de forma según el dispositivo. Evaluar su sustitución por iconos SVG como trabajo separado.

### DEUDA TÉCNICA MENOR — No bloquea Landing V1
- **`.choice-row` y sus reglas de selección viven en `styles.css` pero no existen en el HTML** desde que la Fase 1 pasó el formulario a `.option-pill`. Son reglas muertas, no un defecto visible ni funcional. Se retiran cuando toque limpiar CSS, no antes.

### PENDIENTE — Activos de marca
- El **logo maestro (Ulises + dragón)** no está en la landing; hoy hay una "C". Se necesita el activo aprobado del 2026-08-25. No reinterpretar de memoria (§1).

## 14 bis. Vista de alumno — sistema propio (2026-09-02)

Aprobado por dirección el 2026-09-02 con la instrucción explícita de concretar
y con luz verde para modificar lo existente justificándolo. Lo que sigue es la
decisión tomada, no una exploración.

### APROBADO — La vista de alumno es una sola página que lee un dato

Deja de haber una página por alumno. Existe **un reproductor**, `cerca/s/`, que
recibe una sesión escrita como dato y la dibuja. El alumno número diez es un
dato más, no una página más.

**Por qué:** con tres alumnos ya había tres formas distintas de nombrar y
guardar lo mismo, y ninguna pantalla del entrenador podía leerlas a todas.

**Qué NO hace el reproductor, a propósito:** no decide dónde va un casillero de
registro, no deduce lo que se registra a partir de lo que se muestra, no rellena
un casillero con lo prescrito y no interpreta lo que el alumno anota. Los dos
lados —lo que se muestra y lo que se registra— los escribe el entrenador, y el
código no deriva uno del otro.

### APROBADO — Nueve roles tipográficos, con piso de 12px

La landing tiene quince roles porque tiene quince trabajos. La pantalla de
entrenamiento tiene nueve: `portada` · `sesion` · `bloque` · `ejercicio` ·
`dosis` · `lectura` · `campo` · `etiqueta` · `accion` · `apunte`.

**El piso del sistema es 12px y no baja de ahí.** Antes de esta decisión el
texto más pequeño de la vista de Nico era **9,9px, repetido quince veces**.

**Por qué el piso es más alto que en la landing:** se lee a la distancia del
brazo, transpirado y entre rondas, no sentado en un escritorio. El contexto de
uso es distinto, así que corresponde una variante del sistema, no una copia.

**El rol `campo` se mantiene en 16px**, con la misma razón funcional ya
registrada en §1: por debajo de ese tamaño Safari en iOS hace zoom al enfocar.
Aquí protege más que en la landing, porque ese zoom ocurre en mitad de un
circuito. Medido: 320, 390 y 768 px, todos los campos a 16px.

### APROBADO — El cyan marca lo que está activo o elegido, no lo que está disponible

Es la Fase 4B (§1) aplicada a la vista de alumno, que nunca la había recibido.

Un botón que se puede apretar es **neutro**. El bloque que ya marcaste, el día
en curso y la opción que elegiste están **encendidos**. Así la pantalla está
callada mientras se lee y clara mientras se actúa, y el avance de la sesión se
ve solo, sin barra de progreso ni ningún elemento nuevo.

**Estado medido a 320, 390 y 768 px:**

| | bordes cyan | roles de texto | piso |
|---|---|---|---|
| Vista de Nico (antes) | **39** | 25 | 9,9px |
| Reproductor (ahora) | **2** | 10 | 12px |

Los dos que quedan son el día en curso y la tarjeta de feedback. Igual que Pali,
que era la más disciplinada de las tres vistas.

Como en la Fase 4B, **el recuento es la consecuencia de aplicar el criterio, no
la meta.** De los 39 anteriores, 26 eran estructura pura: 18 chips de código de
ejercicio, 4 recuadros de recorrido y 4 de consejo. Ninguno era acción, estado
ni selección.

### APROBADO — El azul nombra lo que aporta el alumno

Nuevo rol cromático, `--tuyo`, en el azul `#5577ff` que el registro ya conserva
para transición y profundidad (§1).

| | color | responsabilidad |
|---|---|---|
| `--activo` / `--accion` / `--foco` | cyan | la sesión: lo que Seba propone y tú accionas |
| `--tuyo` | azul | tu evidencia: lo que tú aportas |

**Por qué merece existir:** *prescrito ≠ ejecutado* es la idea que fundó el
proyecto, y hasta ahora solo vivía en la estructura de los datos. Esta es la
primera vez que la persona la ve. La distinción entre «esto te lo mandó tu
entrenador» y «esto lo pones tú» es la más importante de la pantalla, y por eso
tiene un token propio.

**Precedente, no invento:** en la vista de Pali, uno de los dos únicos bordes
destacados era el selector de kettlebell, es decir, el lugar donde el alumno
elige.

### APROBADO — Un cuarto estado de la evidencia, con nombre propio

`desconocido` · `confirmado` · `modificado`, más `registrado_sin_prescripcion`.

El cuarto apareció con la polea de Nico: el alumno anotó un número, pero nunca
hubo un número que confirmar o modificar. Ese dato no cumple ni incumple nada:
**es el que crea la referencia.** Meterlo en `confirmado` habría sido mentir.

Es la regla de §12 aplicada: cuando un valor del sistema y una unidad de
significado entran en conflicto, gana el significado y la excepción se registra
con su razón.

### APROBADO — El cronómetro manda sobre el chat en la jerarquía visual

El botón flotante del cronómetro lleva el tratamiento fuerte; el del chat queda
neutro. Antes el chat era el acento más fuerte de toda la pantalla.

**Por qué:** el cronómetro es lo que se necesita en mitad de una serie. El chat
acompaña; no manda. La acción gana porque alrededor hay menos ruido.

### APROBADO — Publicar es un acto, no un commit

`cerca/publicar/` es la pantalla interna donde se pega una sesión, se revisa y
se publica, y devuelve un enlace estable. Es interna: `build.sh` la bloquea.

**Reglas de la entrega:**
- El enlace lleva un token al azar de 22 caracteres. No dice el nombre de nadie.
- Una entrega publicada **no se edita nunca**. Publicar de nuevo crea una entrega
  nueva y **jubila** la anterior. La anterior no se borra: lo que el alumno ya
  entrenó apunta a ella por su huella, y ese blanco no se puede mover después.
- La tabla no tiene permiso de lectura directa. Se lee por función y solo con el
  token: **sin token no hay forma de listar las entregas de nadie.**
- Lo que el alumno escribe sigue siendo de solo escritura, en sus tablas de
  siempre. La entrega es lo único que se lee, y no contiene nada que él haya
  escrito.

**Lo que se pierde y hay que decir:** con las sesiones en archivos, el historial
de Git impedía editar una publicación sin dejar rastro. En Supabase eso depende
de la configuración. La compensación es que el revisor de invariantes se movió
al momento de publicar, que es cuando todavía se puede arreglar.

### APROBADO — La entrega es inmutable por construcción, no por acuerdo (2026-09-02)

Dirección preguntó qué impide **técnicamente** editar una entrega publicada, y
descartó de antemano la respuesta «nadie lo va a hacer». Tenía razón: la primera
versión de esto solo tenía Row Level Security, y **RLS detiene a internet, no al
dueño** — el Table Editor del panel trabaja como `service_role`, que se salta
RLS por diseño.

Lo que quedó, en orden:

1. **No hay nada que actualizar.** Se eliminó la columna `vigente`. La entrega
   vigente se deduce de cuál es la última, con un `seq` que asigna la base.
   Publicar pasó a ser solo insertar.
2. **Un disparador `BEFORE UPDATE OR DELETE` que lanza un error.** Los
   disparadores se ejecutan para todos los roles. Comprobado contra un Postgres
   real: `service_role` y el superusuario reciben el error; la fila no cambia.
3. **Un testigo independiente.** El reproductor recalcula la huella de lo que
   recibió, la compara con la que la entrega declara, y manda las dos dentro de
   la ejecución (`integridad`). Esas filas las escribe el teléfono del alumno.

**El techo, registrado para no olvidarlo:** el dueño puede desactivar el
disparador. Comprobado también. Eso deja de ser un descuido y pasa a ser un acto
deliberado. Hacerlo imposible de verdad exige un testigo fuera de la base —la
garantía de Git que se cambió por publicar desde el iPad—, y el punto 3 recupera
buena parte de eso sin volver al commit.

**Ante una huella que no cuadra, el reproductor NO detiene la sesión.** Registra
la discrepancia y sigue. Deja a alguien mirando una pantalla en blanco en mitad
del gimnasio es un daño seguro para evitar uno hipotético. Esto supera la parte
de D-025 (`ARQUITECTURA.md`) que exigía fallo cerrado, y la supera a propósito.

### APROBADO — La pantalla de publicar sí se despliega (2026-09-02)

`cerca/publicar/` sale en la salida pública, contra el criterio general de la
lista blanca. Sebastián publica desde el iPad: una pantalla que no está en
internet no se puede usar.

**Por qué no debilita nada:** no contiene ninguna decisión ni ningún dato, a
diferencia de los `.md` internos. Lo que la protege no es estar escondida —eso
no protege nada— sino que la clave se comprueba **dentro de Supabase**, en las
funciones. La página sin la clave no puede hacer nada. Por eso el SQL se niega a
operar con una clave de menos de 20 caracteres: una clave corta no es una clave.

### APROBADO — Tres formas de registrar, una sola regla de confirmación (2026-09-02)

Al convertir la Panchi v4-evidence apareció un caso que Nico no tenía: **un
casillero que nace con el valor prescrito ya escrito dentro**. Los 50 kg del
back squat están ahí desde que abre la página.

El reproductor pasa a tener tres formas de registrar, declaradas por la sesión:

| `tipo` | dónde | qué captura |
|---|---|---|
| `simple` | un ejercicio | una entrada por ejercicio, casilleros vacíos |
| `por_serie` | un ejercicio | una fila por serie, con series añadibles |
| `carga_compartida` | un bloque | un solo valor para todo el circuito |

Y **una sola regla** que cubre los tres, que es la que hay que recordar:

> **La confirmación nunca puede venir de un número que puso el sistema.**

- Casillero que **nace vacío** (Nico): escribirlo *es* el acto. Dentro del rango
  prescrito → `confirmado`; fuera → `modificado`.
- Casillero que **nace con lo prescrito escrito** (Panchi): el silencio no
  confirma nada. Hace falta un acto aparte — marcar el bloque como listo, o
  mover el campo.

**Un campo movido y devuelto a su valor no es un campo intacto.** La versión
anterior comparaba el valor final contra el prescrito, así que 50 → 55 → 50 se
guardaba idéntico a no haberlo tocado nunca. Ahora `tocado` se enciende en el
primer `input` y no se apaga: los dos casos dan `confirmado`, pero con
evidencias distintas (`campo_movido_y_devuelto_al_valor_prescrito` frente a
`bloque_marcado_listo`). Que alguien dude de una carga y la deje igual es una
observación, y perderla era borrar evidencia.

**Una serie añadida en ejecución** nace con todos sus campos vacíos —no estaba
prevista, así que nada en ella viene prescrito— y **solo se puede quitar
mientras esté vacía**: con datos escritos, borrarla sería destruir un registro
sin dejar constancia.

**Ámbar para el campo tocado.** Ni cyan ni azul: no es acción ni evidencia
cerrada. Es «esto lo moviste tú».

### APROBADO — El acordeón y el progreso se declaran por sesión (2026-09-02)

`vista: { acordeon: true, progreso: true }`. Seis bloques en una sola columna
obligan a scrollear con las manos ocupadas; tres con pestañas de día, no. No se
impone a todas las sesiones: la de Nico ya estaba probada plana y cambiarla
habría alterado lo que se iba a probar con una persona real.

El número del bloque se enciende al marcarlo listo, con el mismo criterio de
siempre: el cyan marca lo hecho, no lo disponible. Medido en la vista de Panchi
a 320, 390 y 768: **2 bordes cyan**, piso de 12px, campos a 16px.

### APROBADO — El identificador de la ejecución sobrevive a una recarga (2026-09-02)

Vive en `sessionStorage`, con la clave de la sesión. Recargar en mitad del
entrenamiento no puede crear una segunda ejecución; abrir la página otro día sí.
Tomado de la Panchi v4-evidence, que ya lo hacía bien.

### APROBADO — El entrenador revisa mirando la pantalla del alumno (2026-09-02)

La pantalla de publicar mostraba el JSON de la sesión. Sebastián no lee código,
así que no podía revisar si la rutina estaba bien: aprobaba a ciegas.

Ahora el paso 2 muestra **la pantalla del alumno dentro de un teléfono**, y el
código vive detrás de *Ver el código*.

**No es una imitación: es la pantalla.** El mismo `cerca/s/` que abre la alumna,
cargado en un marco y alimentado por `postMessage` desde el mismo origen. Una
segunda implementación para previsualizar se habría desviado del original con el
tiempo, y entonces lo revisado dejaría de ser lo entregado — que es la misma
clase de error que `prescrito ≠ ejecutado` existe para impedir.

En modo previsualización la pantalla **no escribe nada**: ni ejecución, ni
feedback, ni bitácora. Lo dice en pantalla en vez de fallar en silencio.

### APROBADO — Una frase, y los problemas solo cuando los hay (2026-09-02)

La lista de comprobaciones enumeraba también todo lo que estaba bien. Eran
muchas líneas técnicas que no le decían nada a nadie.

Ahora es **una sola frase**: *«Todo bien. 1 día · 6 bloques · 19 ejercicios · 4
casilleros para anotar.»* o *«Hay 2 cosas que arreglar antes de publicar»* con
las dos escritas en castellano, diciendo el día y el ejercicio.

Los aciertos no se enumeran. Un aviso solo existe si hay algo que hacer con él.

### APROBADO — Agregar series es opcional, y por defecto no está (2026-09-02)

El botón «+ agregar serie» solo aparece si la sesión declara un `maximo` mayor
que las series previstas. Se quitó de la de Panchi por decisión de dirección:
seis años entrenándola, casi nunca hace pasadas extra, y un botón que no se usa
ocupa sitio en una pantalla que se mira entre series. Si alguna vez ocurre, lo
cuenta en el audio.

La capacidad se conserva para quien la necesite. Lo que cambia es el defecto:
**ausente**, no presente.

### APROBADO — Lo que está en una vista está en la otra, salvo que haya un motivo (2026-09-02)

Al añadir el audio a Nico se auditaron las dos sesiones clave por clave. La
regla que sale de ahí:

> **Una diferencia entre dos alumnos solo se sostiene si nace de una diferencia
> entre sus entrenamientos, no de en qué orden se escribieron las páginas.**

Corregido, porque no se sostenía:

- **Audio de feedback.** Panchi lo tenía; Nico no. La capacidad ya estaba en el
  reproductor: la sesión de Nico simplemente no la pedía.
- **El aviso sobre el dolor.** Nico lo tenía; Panchi no. Un mensaje de seguridad
  no puede depender de qué página se escribió primero.
- **Cronómetro en una plancha de 30 s.** Todas las de Nico lo tenían; la de
  Panchi no.
- **Los presets del cronómetro llegaban hasta 1:30** y el bloque de potencia de
  Panchi pide descansos de 2:00. Se añadió el preset, y la rejilla pasa a
  acomodarse sola en vez de fijar cinco columnas.

Registrado como diferencia legítima, para no volver a levantarlo: los códigos de
ejercicio (A1, B2), el tipo de cronómetro, la forma de registrar, la misión y el
riel de días nacen de que los dos entrenamientos son distintos.

### RESUELTO — Los circuitos de Panchi ya muestran su recorrido (2026-09-02)

Estaba PENDIENTE desde la auditoría: cuatro de sus seis bloques eran circuitos y
ninguno decía el recorrido. Dirección dictó los cuatro y se escribieron con el
formato de Nico. **11 de 11 circuitos de los dos alumnos muestran ahora su
recorrido completo.**

**Los nombres van acortados en la cadena** —«Rotaciones → Pierna al lado →
Spiderman»— porque una cadena con los nombres completos no se lee. Nico resuelve
lo mismo con códigos (A1, B2); Panchi no los usa, así que cada nombre corto es
el comienzo exacto de un solo ejercicio de la lista que va justo debajo.
Comprobado: los cuatro recorridos nombran, en orden, los ejercicios de su
bloque.

**Consecuencia que hubo que resolver:** el aviso del final de cada bloque
repetía casi palabra por palabra lo que ya decía el recorrido. En Nico ese aviso
es corto —«*Descanso:* 30 s solo al terminar A5»— y está donde ella va a estar
mirando cuando acabe el último ejercicio. Los cuatro de Panchi se acortaron a
esa misma forma. Se conserva la información; se quita la repetición.

**Lo que NO se toca sigue sin tocarse:** qué ejercicios, en qué orden y con qué
descanso lo dicta el entrenador. Aquí solo se le dio forma a lo dictado.

### APROBADO — El check-in es estándar, y la tercera pregunta la declara la sesión (2026-09-02)

Antes de entrenar, tres preguntas como máximo:

1. **¿Cómo dormiste?** — igual para todos.
2. **¿Cómo está tu energía hoy?** — igual para todos.
3. **La que declara la sesión**, solo si esa persona tiene algo que vigilar. Si
   no tiene nada, la pregunta no existe.

Se responde comparando con lo habitual: **peor · igual · mejor**. No es una
escala de severidad, y esa diferencia es deliberada. Un entrenador que conoce a
la persona necesita saber si hoy está peor que de costumbre; un número del 1 al
10 sería pedir otra cosa. Encaja con la clase A de señales de `ARQUITECTURA.md`
§7.1 —sueño y energía son graduables— y deja la tercera aparte, que es donde esa
misma sección la pone.

**El código no interpreta la respuesta.** Cuando dice que lo que se vigila está
peor, se muestra **el texto que escribió el entrenador para esa persona**, tal
cual. No cambia la sesión, no sugiere, no avisa a nadie, no escala. Es §7.1:
«el mapeo entre descripción y decisión no está en el código».

**El silencio no es conformidad.** Cada respuesta declara si se registró, y el
conjunto declara `respondido | parcial | sin_respuesta` (D-020). No responder
queda escrito como no haber respondido.

**Ámbar para el aviso.** Ni cyan ni azul: no es acción ni evidencia. Es una
advertencia, y no comparte color con ninguna de las dos.

### APROBADO — La tercera pregunta se construye con la captura desactivada (2026-09-02)

`MATRIZ_DE_DATOS.md` tiene **BLOQUEADA** la solicitud y la persistencia
deliberadas de información de salud hasta que cierre la revisión jurídica, y
nombra explícitamente como «no se revive» una repregunta sobre una molestia con
escala. La tercera pregunta del check-in cae justo ahí.

La misma matriz **permite** construir la arquitectura con la captura
desactivada, y eso es lo que hay: `CAPTURA_VIGILANCIA = false` en el
reproductor. Con el interruptor apagado, la pregunta se muestra si la sesión la
declara, el aviso se muestra, y la ejecución guarda que se preguntó y que **no**
se guardó la respuesta.

**Tampoco se guarda si el aviso apareció.** Escribirlo sería decir cuál fue la
respuesta por la puerta de atrás.

**Ninguna sesión viva declara `vigilancia` todavía.** Nico y Panchi llevan solo
las dos preguntas estándar, que no son información de salud. Declarar la tercera
para una persona real es el acto que la matriz bloquea, y es decisión del
entrenador con su abogado, no del código.

### APROBADO — El texto del comentario final es uno solo, y pregunta por el entrenamiento (2026-09-04)

> *«Cuéntame cómo te fue: qué pesos usaste, qué ejercicio no te acomodó, qué te
> costó más de lo que esperabas, y cualquier cosa que quieras que sepa antes de
> armarte la próxima.»*

**Vive en el código, no copiado en cada sesión.** Copiarlo garantiza que en algún
momento dos alumnos tengan textos distintos sin que nadie lo haya decidido — que
es justo lo que encontró la auditoría del 2026-09-02. Los que cada sesión traía
por su cuenta se retiraron. Una sesión puede poner el suyo, pero no hace falta.

**Pregunta por el entrenamiento, no por el cuerpo.** No se pregunta por
molestias ni por dolor. Si el alumno decide contar algo suyo, lo cuenta por su
cuenta. Es la regla B→C de `MATRIZ_DE_DATOS.md` aplicada al único campo libre
que queda en la vista.

### APROBADO — Precaución: una instrucción escrita, ni pregunta ni registro (2026-09-04)

Un ejercicio puede llevar `precaucion`: un texto fijo que el entrenador escribió
para ese ejercicio y esa persona. **No pregunta nada y no guarda nada.**

Es la vía que quedó abierta cuando la tercera pregunta del check-in se dejó con
la captura desactivada: lo que hacía falta era que el alumno leyera una
instrucción, y eso no necesita capturar nada de nadie.

**No es un consejo.** Un consejo mejora la técnica; una precaución dice cuándo
parar. Por eso lleva el ámbar del aviso y no el color de la lectura corriente:
misma responsabilidad que el aviso del check-in — lo que el entrenador dejó
escrito para este momento.

**Lo que hay que tener presente:** el texto vive en la entrega, y la entrega la
lee quien tenga el enlace. Una precaución redactada sobre una molestia concreta
dice algo de esa persona a quien abra el enlace. Los tokens son inadivinables y
se pueden jubilar, pero conviene escribirlas como instrucción de entrenamiento y
no como descripción de un cuadro clínico.

### APROBADO — El descanso de un bloque puede llevar cronómetro (2026-09-04)

`bloque.crono` ya no es solo el tabata: acepta también un cronómetro simple, y
una lista. Un descanso entre vueltas es tiempo prescrito igual que una plancha,
y hasta ahora había que salir a buscar el cronómetro flotante.

**En los rangos, el botón cuenta el extremo bajo y el rótulo dice el rango
entero** («Descanso 75–90 s» contando 75). El mínimo es el número accionable:
cuando suena, ya se puede volver.

### APROBADO — Un día liviano registra menos, y eso no es una excepción (2026-09-04)

El día de mantención de Lili pasó de 12 casilleros a 3: solo la prensa
unilateral y el hip thrust. El resto de ese día no pregunta nada.

**Por qué no contradice la regla del peso elegible.** La regla de fondo sigue
siendo «un dato se captura porque puede cambiar una decisión futura», y «lleva
peso elegible» era el atajo para reconocerla. En un día que existe para no
competir con los fuertes —RPE 6, terminar sintiendo que quedaba capacidad— el
peso del hammer curl no va a cambiar ninguna decisión. El atajo dejaba de
apuntar a la regla, así que gana la regla.

**Generaliza:** la intención del día pesa tanto como el equipamiento a la hora
de decidir dónde va un casillero. Un día liviano pregunta menos por definición,
no por olvido.

**Lo que no se tocó:** las tres precauciones y los tres cronómetros de ese día
siguen enteros. Registrar menos no es acompañar menos.

### APROBADO — El código de un ejercicio identifica dentro de su bloque (2026-09-04)

El revisor exigía que los códigos no se repitieran **en todo el día**, y eso
bloqueó la publicación de la semana de Lili: su día 4 numera 1–9 la movilidad,
1–5 el circuito metabólico y 1–4 la zona media.

Eso no era un error suyo: **cada recorrido vive dentro de su bloque**, y ahí no
hay ambigüedad. La regla pasa a ser por bloque.

**Pero había un fallo de verdad debajo, que la regla estricta tapaba.** La clave
interna de un casillero era `codigo.campo`, sin el bloque, así que dos
ejercicios con el mismo código en el mismo día **se pisaban los valores**. No se
notaba porque ninguno de los repetidos tenía casillero. Ahora la clave lleva el
bloque delante y la ejecución guarda `bloque` junto a `ref`. Comprobado con dos
ejercicios llamados «3» en bloques distintos y casillero en los dos: se guardan
40 y 7, cada uno en el suyo.

**Lo que sí era un error de la sesión** y se corrigió: el calentamiento del día 2
tenía dos ejercicios con el código «2», dentro del mismo bloque. Nació de reusar
constantes que llevaban el código escrito dentro; el código depende de la
posición en su bloque, así que no puede viajar con el ejercicio.

### APROBADO — La vista previa mide lo que mide un teléfono (2026-09-04)

El marco medía 720 px de alto y el check-in de Lili empieza a los 686: quedaba
justo fuera, y parecía no existir. Pasa a 844 px, que es el alto real de un
teléfono corriente, y el pie dice explícitamente que se puede desplazar dentro.

**Una vista previa más corta que el teléfono no es una vista previa conservadora:
es una que miente en la dirección contraria.** Muestra menos de lo que la
persona va a ver, y lo que se queda fuera parece no existir.

### EN PRUEBA — Que el casillero recuerde

Que la semana siguiente el casillero diga «la vez pasada anotaste 25 kg». No lo
lee la página: el número llega dentro de lo prescrito, porque el entrenador lo
puso al publicar. Recordar sigue siendo una decisión suya, no un eco automático.

**No aprobado todavía por un riesgo real:** un número a la vista ancla. Probar
primero solo en cargas, y mirar si los valores se pegan al del recuerdo.

---

## 15. Regla de gobernanza de este archivo

- Solo una decisión explícitamente aprobada entra como **APROBADO**.
- Las ideas aún en exploración se marcan **EN PRUEBA** o **PENDIENTE**.
- No reemplazar historia: si algo cambia, registrar qué cambió, cuándo y por qué.
- Antes de diseñar una nueva versión de algo aprobado, revisar este archivo.
- Si una imagen o logo tiene una referencia visual maestra, no reinterpretarlo de memoria: usar el activo aprobado.
- Antes de presentar una nueva exploración, hacer una crítica interna mínima: claridad, coherencia con aprobados, redundancia, naturalidad y utilidad. No entregar una variante solo porque sea visualmente llamativa.
