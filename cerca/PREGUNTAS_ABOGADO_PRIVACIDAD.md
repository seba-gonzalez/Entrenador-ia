# CERCA — Preguntas para abogado de privacidad

> **ESTADO: BORRADOR INTERNO.**
> No constituye asesoría jurídica ni criterio aprobado. Se irá completando a medida que avance el producto y la revisión de la Ley 21.719.

Fecha de inicio: 2026-08-30

## Contexto mínimo de CERCA

CERCA es un servicio de entrenamiento físico personalizado que busca adaptar decisiones de ejercicio según el contexto de cada persona. No realiza diagnóstico médico, tratamiento de enfermedades ni rehabilitación clínica. El producto puede necesitar conocer objetivos, experiencia, disponibilidad, equipamiento, preferencias y restricciones de ejercicio. Existe además la posibilidad de que una persona comunique espontáneamente lesiones, molestias, cirugías, dolor u otra información relativa a salud.

El proyecto utiliza una landing de pre-lanzamiento y Supabase. El proyecto Supabase está actualmente alojado en la región `sa-east-1`.

## Preguntas prioritarias

### 1. Datos de salud en contexto deportivo
¿Puede una plataforma de entrenamiento deportivo en Chile tratar, con consentimiento expreso del usuario, datos sobre lesiones, molestias, cirugías o antecedentes de salud exclusivamente para adaptar, sustituir o excluir ejercicios, considerando el artículo 16 bis de la Ley 19.628 modificada por la Ley 21.719 y su referencia a datos de salud recogidos en el ámbito deportivo?

Si puede, ¿cuál es la base jurídica o excepción concreta y qué condiciones deben cumplirse?

### 2. Diferencia entre entrenamiento y tratamiento médico
¿Es jurídicamente relevante que CERCA utilice esa información únicamente para tomar decisiones de entrenamiento físico y no para diagnosticar, tratar, curar o rehabilitar una enfermedad o lesión?

¿Qué redacción debería utilizar CERCA para describir correctamente ese límite sin presentarse como un servicio sanitario?

### 3. Consentimiento específico para datos sensibles
Si el tratamiento descrito fuera legalmente posible, ¿el consentimiento debe estar separado del consentimiento general del servicio y del consentimiento de contacto/marketing?

¿Qué información mínima debe mostrarse antes de aceptar y qué evidencia debemos conservar para demostrar el consentimiento: versión del texto, fecha/hora, finalidad, política vigente, retiro posterior, etc.?

### 4. Restricciones funcionales sin causa médica
Si una persona declara algo como “prefiero no hacer saltos” o “no quiero hacer ejercicios sobre la cabeza”, y CERCA respeta esa restricción sin preguntar la causa, ¿ese dato puede tratarse como una preferencia/restricción funcional común o podría igualmente considerarse dato sensible por lo que revela en su contexto?

¿Dónde está jurídicamente la frontera?

### 5. Información de salud entregada espontáneamente en texto libre
¿Qué debe hacer CERCA si un campo abierto pensado para otra finalidad recibe espontáneamente información de salud, por ejemplo: “me cuesta entrenar por dolor de espalda”?

¿Podemos recibirla sin utilizarla? ¿Debemos eliminarla, aislarla, pedir un consentimiento posterior o adoptar otra medida?

### 6. Inteligencia artificial, perfilamiento e inferencias
Si una IA interpreta respuestas de entrenamiento para adaptar decisiones futuras, ¿cuándo esa actividad constituye elaboración de perfiles o una decisión automatizada relevante bajo la nueva ley?

¿Qué obligaciones de información, explicación, intervención humana o revisión podrían aplicar?

En particular, ¿puede CERCA inferir limitaciones corporales o de salud a partir de respuestas que no contienen explícitamente un diagnóstico?

### 7. Proveedores y transferencia internacional
El proyecto Supabase se aloja actualmente en `sa-east-1`, fuera de Chile. ¿Qué obligaciones aplican a CERCA por utilizar proveedores extranjeros o almacenar/tratar datos fuera del país bajo la Ley 21.719?

¿Necesitamos cláusulas contractuales, información específica al titular, garantías adicionales u otra medida?

La misma pregunta aplica a futuros proveedores de IA si reciben datos personales.

### 8. Minimización y retención
¿Qué plazos de conservación serían razonables para:
- registros de pre-lanzamiento que nunca se convierten en clientes;
- cuentas activas;
- consentimientos y evidencia del consentimiento;
- respuestas de perfil;
- datos sensibles, si eventualmente fuera legal tratarlos?

¿Qué deberíamos eliminar automáticamente y qué evidencia necesitamos conservar?

### 9. Derechos de las personas
¿Qué mecanismos mínimos debe ofrecer CERCA para que una persona pueda acceder, corregir, eliminar, oponerse o retirar su consentimiento respecto de sus datos?

Para una beta pequeña, ¿pueden gestionarse inicialmente mediante un canal manual documentado o necesitamos autoservicio desde el lanzamiento?

### 10. Evaluación de impacto y privacidad desde el diseño
Por el tipo de personalización, uso potencial de IA y posible tratamiento de datos sensibles, ¿CERCA debería realizar formalmente una evaluación de impacto en protección de datos antes de la beta o antes de alguna etapa posterior?

¿Qué contenido mínimo debería tener esa evaluación?

## Preguntas secundarias para completar después

- ¿Qué datos puede registrar técnicamente un proveedor de infraestructura —por ejemplo IP o logs— aunque no existan columnas equivalentes en nuestra base, y qué debemos informar sobre ellos?
- ¿Qué obligaciones tendría CERCA ante una brecha de seguridad y cuál es el plazo y canal de notificación aplicable?
- ¿Debemos designar alguna función o responsable formal de protección de datos en una empresa pequeña como CERCA?
- ¿Qué cambia si en el futuro CERCA atiende menores de edad?
- ¿Qué documentos contractuales necesitamos con proveedores que actúen como encargados del tratamiento?

## Principio de trabajo

La consulta al abogado debe resolver las zonas de interpretación jurídica. CERCA llevará a la reunión el flujo real del producto, la matriz de datos y la arquitectura técnica para evitar una consulta abstracta sobre la ley.
