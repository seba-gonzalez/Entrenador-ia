# DECISIONES

Registro de decisiones de arquitectura. Una entrada por decisión, en orden
cronológico. Las entradas no se editan ni se borran: una decisión revertida se
registra como entrada nueva que anula a la anterior.

Formato: **qué se decidió**, **por qué**, **qué se descartó**.
Las decisiones metodológicas no van aquí — van a la Bitácora de Aprendizaje.

---

## 2026-08-14 — Fase de arquitectura inicial

### D-001 · Producto estático, sin build step
Sin bundler, sin React/Next/Vite. HTML + JS plano con módulos ES.
**Por qué:** Sebastián trabaja principalmente desde iPad. Cualquier paso de
compilación convierte "editar un archivo" en "necesito una máquina".
**Descartado:** stack con framework y build, más cómodo de escribir pero
incompatible con la restricción operativa principal.

### D-002 · Dos repositorios separados
`entrenador-ia` (código, esquemas, metodología) y `entrenador-ia-datos`
(privado, alumnos reales).
**Por qué:** los datos incluyen restricciones articulares, lesiones, dolor y
juicios clínicos sobre personas identificables. No pueden convivir con el
repositorio que sirve páginas públicas.
**Descartado:** repositorio único con carpetas separadas — un error de
configuración de Pages expondría datos sanitarios.

### D-003 · El esquema es la frontera
Los contratos de datos los escribe el entrenador desde la metodología; el
código se adapta al esquema.
**Por qué:** es el mecanismo concreto de "la tecnología sirve a la lógica del
entrenador". Sin un punto físico donde vive esa frontera, el principio es solo
una intención.

### D-004 · Estado epistémico por campo en el perfil
Cada campo lleva `estado: confirmado | inferido | desconocido` y `fuente`.
**Por qué:** convierte "nunca presentar una inferencia como hecho" en una
propiedad estructural, y la puerta de información mínima en una consulta
ejecutable.
**Descartado:** confiar en disciplina de proceso.

### D-005 · Documento y realidad son máquinas de estado separadas
`borrador → en_revision → aprobada → publicada` describe un documento;
`ejecutada | pospuesta | omitida` describe lo ocurrido.
**Por qué:** unirlas implicaría que el documento sigue mutando después de
publicarse, rompiendo "programado ≠ ejecutado".

### D-006 · "Corregida" es una transición, no un estado
Una corrección crea una versión nueva que vuelve a revisión.
**Por qué:** como estado generaría `corregida → en_revision → corregida → …`.
Como transición, los ciclos múltiples funcionan sin inventar estados y
"corregida" queda derivable de `versiones.length > 1`.

### D-007 · Publicaciones inmutables, una vigente sustituible
Cada publicación es inmutable; una sesión no iniciada puede recibir una
publicación nueva que sustituya a la vigente.
**Por qué:** la sesión está viva hasta que empieza su ejecución, pero el
registro de lo entregado no puede moverse retroactivamente.

### D-008 · La ejecución se vincula a la publicación utilizada
`ejecucion.publicacion_ejecutada` congela cuál estaba vigente al iniciar.
**Por qué:** sin ese campo, toda la evidencia posterior apunta a un blanco
móvil.

### D-009 · Tres clases de señal en el check-in
Graduables (sueño, fatiga, energía, tiempo, equipamiento) ≠ molestia ≠
dolor/alerta.
**Por qué:** no pertenecen a la misma clase de decisión. Modelarlas con la misma
aritmética sería un error de diseño con consecuencias clínicas.
**Descartado:** escala única de "malestar"; y también el binario dolor sí/no.

### D-010 · El mapeo señal → decisión no vive en el código
El esquema captura dimensiones descriptivas y enumera el espacio de decisión
(`observar | modificar | sustituir | detener | escalar`); el criterio que une
ambos es del entrenador.
**Por qué:** codificarlo sería meter una regla clínica en el código (D-003).
**Nota:** es legítimo que este punto quede abierto de forma permanente.

### D-011 · Contingencias pre-aprobadas, acotadas
Condiciones explícitas escritas por el entrenador al aprobar la sesión. Solo
sustituciones, omisiones o recortes. Nunca programación nueva.
**Por qué:** el check-in llega minutos antes de la sesión; una republicación que
siempre espera revisión no funciona justo cuando más importa. Siguen siendo
decisión humana, tomada por anticipado.
**Descartado:** motor de inferencia que combine o extienda contingencias.

### D-012 · Reevaluación en lugar de regla absoluta de no ejecución
Información nueva materialmente relevante fuera de contingencia dispara
reevaluación, con siete resultados posibles.
**Por qué:** una mala noche de sueño y un dolor agudo nuevo no admiten la misma
respuesta. La reevaluación se registra aunque el resultado sea continuar sin
cambios: "se ejecutó tras reevaluar" es evidencia distinta de "no pasó nada".
**Descartado:** "si no hay contingencia, no se ejecuta" — demasiado rígido.

### D-013 · El checklist es un documento versionado, no código
`checklist.json` en `/metodologia`, con `checklist_version` registrada en cada
aprobación.
**Por qué:** permite medir si un ítem añadido redujo la recurrencia de la
familia que lo originó. Es donde se cierra el bucle de aprendizaje transferido.

### D-014 · El checklist pide decisión justificada, no presencia
"Ninguna" es respuesta válida si está justificada. El campo obligatorio es
`justificacion`, no la presencia del elemento. Se añade un ítem holístico sobre
estructura y linealidad.
**Por qué:** un ítem con forma "¿incluye movilidad?" se satisface agregando
movilidad. El resultado serían sesiones infladas — el problema opuesto al que se
quiere resolver, generado por el instrumento puesto para resolverlo.

### D-015 · Publicar es extraer, no filtrar
La publicación genera un artefacto derivado y reducido en `/publicado/`.
**Por qué:** las observaciones son juicios clínicos sobre el alumno. Si viajan
en el mismo archivo que la sesión, viajan al alumno, con o sin herramientas de
desarrollo de por medio.
**Descartado:** un render único que carga el documento completo y oculta los
borradores.

### D-016 · Aprendizaje descriptivo con reglas de presentación
Las decisiones se registran de forma consultable (`alternativas_disponibles`,
`decidido_por`, `contexto`) para detectar patrones. Los patrones viven solo en
la vista retrospectiva, se enuncian como preguntas, van con denominador y nunca
prellenan un campo.
**Por qué:** no automatizar la decisión ≠ no aprender de la evidencia. Pero un
patrón mostrado en el momento de decidir funciona como recomendación aunque se
etiquete como descriptivo: una regla puede instalarse por anclaje tan
efectivamente como por automatización, y por esa vía es más difícil de auditar.

### D-017 · H3 (validación en CI) antes de H4 (check-in)
**Por qué:** los invariantes son lo que hace confiable toda la evidencia
posterior, y H4 es el hito con más estados y más formas de corromperla en
silencio.
**Descartado:** priorizar el hito más visible.

### D-018 · La frontera es dónde vive la regla, no quién planifica
Herramientas de construcción y código de aplicación no contienen ni toman
decisiones metodológicas. El agente entrenador sí produce propuestas de
planificación aplicando la metodología versionada. El entrenador es el único
autor de la metodología.
**Por qué:** el objetivo es impedir que la lógica metodológica quede
codificada, no impedir que el agente entrenador planifique. La formulación
anterior confundía ambas cosas.
**Condición del MVP:** toda propuesta del agente nace como borrador y requiere
aprobación antes de publicarse. Es una condición de esta etapa; relajarla
requerirá una entrada nueva en este registro.

### D-019 · El artefacto público de H1 usa un caso demo anónimo
Derivado de Juan Pablo: misma estructura, sin nombre, sin datos personales ni
sanitarios reales. Las restricciones se sustituyen por equivalentes ficticios
que preserven la estructura del problema.
**Por qué:** D-002 aplicado al primer artefacto concreto.
**Nota:** el trabajo del checklist (V1-C) se hace sobre la sesión real en el
repositorio privado. Lo anonimizado es el artefacto público, no el material de
análisis.

---

**Cierre de la fase de arquitectura inicial.** `ARQUITECTURA.md` v0.2 aprobado.
Siguiente: H1.
