#!/bin/sh
# Construye la salida pública de la landing CERCA en cerca/dist/.
#
# La fuente de trabajo es cerca/, y es rica a propósito: el registro de
# decisiones, el tablero de marca, el laboratorio tipográfico y el centro de
# control viven ahí porque el equipo los necesita. Nada de eso debe llegar a
# una URL pública como efecto colateral de desplegar la landing.
#
# Por eso esto es una LISTA BLANCA y no una lista de exclusiones. Una lista de
# exclusiones falla abierta: el día que alguien añada un documento interno a
# cerca/, se publica solo. Una lista blanca falla cerrada: un archivo nuevo no
# se publica hasta que alguien lo añade aquí a propósito.
#
#   sh cerca/build.sh
#
# La salida es desechable y se regenera entera en cada ejecución.

set -eu

ORIGEN=$(cd "$(dirname "$0")" && pwd)
SALIDA="$ORIGEN/dist"

# Lo que la landing necesita para funcionar, y nada más.
# Verificado siguiendo cada referencia de index.html, styles.css y app.js.
PUBLICOS="
index.html
styles.css
app.js
fonts/archivo-variable-latin.woff2
fonts/OFL.txt
brand/isotipo.svg
"

# Lo que nunca puede salir, aunque alguien lo añada a la lista de arriba por
# error. Es una red de seguridad, no el mecanismo principal.
PROHIBIDOS="
REGISTRO_APROBADOS.md
MATRIZ_DE_DATOS.md
admin.html
type-lab.html
type-lab.css
type-lab.js
referencias
build.sh
"

rm -rf "$SALIDA"
mkdir -p "$SALIDA"

for f in $PUBLICOS; do
  if [ ! -f "$ORIGEN/$f" ]; then
    echo "ERROR: la landing declara '$f' pero no existe en cerca/." >&2
    rm -rf "$SALIDA"
    exit 1
  fi
  mkdir -p "$SALIDA/$(dirname "$f")"
  cp "$ORIGEN/$f" "$SALIDA/$f"
done

for p in $PROHIBIDOS; do
  if find "$SALIDA" -mindepth 1 -name "$p" | grep -q .; then
    echo "ERROR: '$p' es material interno y no puede publicarse." >&2
    rm -rf "$SALIDA"
    exit 1
  fi
done

echo "Salida pública en cerca/dist/"
find "$SALIDA" -type f | sed "s#$SALIDA/#  #" | sort
echo "  ---"
echo "  $(find "$SALIDA" -type f | wc -l | tr -d ' ') archivos · $(du -sh "$SALIDA" | cut -f1)"
