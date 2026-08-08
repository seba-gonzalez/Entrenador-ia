# Entrenador IA — primer prototipo

Una experiencia web para validar el comienzo de la relación entre un alumno y un entrenador: escuchar, interpretar, confirmar y proponer un primer entrenamiento.

## Qué construimos

El prototipo recorre cinco momentos:

1. bienvenida;
2. conversación inicial sobre objetivos, contexto y preferencias;
3. resumen humano de lo que el entrenador entendió;
4. una pregunta adicional cuando falta contexto;
5. primera propuesta de entrenamiento organizada por bloques.

La aplicación es responsive, no requiere registro y guarda temporalmente el progreso en el navegador. Está hecha con HTML, CSS y JavaScript sin dependencias: es una decisión intencional para que esta primera versión sea fácil de abrir, mantener y probar.

## Cómo está organizado

```text
index.html       Estructura de las cinco pantallas
styles.css       Diseño responsive y componentes visuales
app.js           Navegación, validación e interpretación simulada
```

## Cómo ejecutarlo

Necesitas Python 3 (normalmente ya viene instalado en macOS y Linux):

```bash
python3 -m http.server 4173 --bind 0.0.0.0
```

Luego abre `http://localhost:4173` en el navegador del mismo ordenador.

También se puede abrir `index.html` directamente, aunque usar el pequeño servidor anterior representa mejor el funcionamiento de una web real.

### Probarlo desde un iPad

1. Conecta el iPad y el ordenador a la misma red Wi‑Fi.
2. En el ordenador, abre una terminal dentro de esta carpeta y ejecuta el comando anterior.
3. Averigua la IP local del ordenador (por ejemplo, `192.168.1.25`). En macOS puedes verla en **Ajustes del Sistema → Wi‑Fi → Detalles**.
4. En Safari del iPad abre `http://IP-DEL-ORDENADOR:4173` (por ejemplo, `http://192.168.1.25:4173`).
5. Si no abre, permite a Python recibir conexiones en el firewall del ordenador y confirma que ambos dispositivos están en la misma red.

## Qué partes están simuladas

- No hay inteligencia artificial real: el resumen se compone con reglas sencillas usando las respuestas.
- La pregunta pendiente se decide con lógica local (prioriza molestias poco explicadas y, después, contexto del equipamiento).
- La rutina es una propuesta de demostración que contextualiza algunos textos según el objetivo y la disponibilidad, pero no es todavía una prescripción completa.
- Los datos solo se guardan en `sessionStorage`: desaparecen al cerrar la pestaña y no salen del dispositivo.
- No hay login, pagos, audio/vídeo, API externa ni base de datos.

> Este prototipo no reemplaza la evaluación de un profesional sanitario. Ante dolor agudo, persistente o síntomas preocupantes, se debe consultar a un profesional.

## Qué construir después

1. Probar esta experiencia con alumnos reales y observar dónde dudan o abandonan.
2. Mejorar las preguntas y convertir la interpretación en un modelo de datos claro y editable.
3. Añadir perfiles y persistencia solo cuando sepamos qué información merece conservarse.
4. Incorporar el registro del entrenamiento, RPE, cumplimiento, sensaciones y molestias.
5. Crear reglas de adaptación seguras y explicables antes de integrar IA real.
6. Explorar texto, audio y vídeo después de validar el ciclo básico de feedback.

## Comprobación rápida

```bash
python3 -m http.server 4173 --bind 127.0.0.1
curl -I http://127.0.0.1:4173/
```
