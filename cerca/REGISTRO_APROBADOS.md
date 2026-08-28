# CERCA — Registro de decisiones aprobadas

> Fuente de verdad operativa para decisiones ya aprobadas de marca, landing y pre-lanzamiento.
> Regla: si una decisión cambia, no se borra la anterior; se registra la nueva versión y el motivo.

Última actualización: 2026-08-28 — cierre de la Fase 4B (jerarquía cromática) y de las erratas detectadas tras el cierre de 4A.

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
- **CUÉNTANOSLO A TU MANERA.**
- **TE RESPONDEMOS SIMPLE PORQUE ENTENDEMOS LO COMPLEJO.**
- **MAÑANA NO PARTES DE CERO.**

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

## 15. Regla de gobernanza de este archivo

- Solo una decisión explícitamente aprobada entra como **APROBADO**.
- Las ideas aún en exploración se marcan **EN PRUEBA** o **PENDIENTE**.
- No reemplazar historia: si algo cambia, registrar qué cambió, cuándo y por qué.
- Antes de diseñar una nueva versión de algo aprobado, revisar este archivo.
- Si una imagen o logo tiene una referencia visual maestra, no reinterpretarlo de memoria: usar el activo aprobado.
- Antes de presentar una nueva exploración, hacer una crítica interna mínima: claridad, coherencia con aprobados, redundancia, naturalidad y utilidad. No entregar una variante solo porque sea visualmente llamativa.
