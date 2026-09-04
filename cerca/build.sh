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
#
# Sobre publicar/: SÍ sale, y es deliberado. Sebastián publica desde el iPad,
# así que la pantalla tiene que existir en internet o no se puede usar. No es
# material interno en el sentido de los .md: no contiene ninguna decisión ni
# ningún dato. Lo que la protege no es estar escondida —eso no protege nada—
# sino que la clave se comprueba dentro de Supabase, en las funciones. La
# página sin la clave no puede hacer nada. Por eso el SQL se niega a operar
# con una clave de menos de 20 caracteres.
#
# Sobre sesiones/: es un PUENTE, no el destino. Una sesión servida como archivo
# obliga a un commit para publicarla, que es justo lo que hay que evitar. En
# cuanto la sesión de Nico esté publicada desde cerca/publicar/, esa línea se
# borra de aquí y el archivo se va con ella. Las sesiones viven en Supabase.
PUBLICOS="
index.html
styles.css
app.js
fonts/archivo-variable-latin.woff2
fonts/OFL.txt
brand/isotipo.svg
perfil/index.html
perfil/perfil-base.css
perfil/perfil.css
perfil/perfil.js
pancha/index.html
pali/index.html
nico/index.html
alumno/cerca-alumno.css
s/index.html
s/reproductor.js
sesiones/kecJVd0cI2VQVobjAof6xg.json
sesiones/r5GvuG0A6UDfxXw3_EViKA.json
sesiones/0l9VuCJCN-XzXYS4HUF4JA.json
sesiones/gpofjDzfExk7Qdi927I3dQ.json
hola/index.html
hola/bienvenida.js
sesiones/y3wuS1uRkNnITGE1ezuUfA.json
publicar/index.html
publicar/publicador.js
"

# Lo que nunca puede salir, aunque alguien lo añada a la lista de arriba por
# error. Es una red de seguridad, no el mecanismo principal.
PROHIBIDOS="
REGISTRO_APROBADOS.md
MATRIZ_DE_DATOS.md
PREGUNTAS_ABOGADO_PRIVACIDAD.md
PROPUESTA_OPERACIONAL.md
COMO_PUBLICAR.md
sql
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

# Salvaguarda general: ningun documento .md sale nunca, tenga el nombre que
# tenga. El registro, la matriz de datos y las preguntas juridicas ya estan
# arriba por su nombre; esto cubre al siguiente que alguien escriba.
if find "$SALIDA" -mindepth 1 -name '*.md' | grep -q .; then
  echo "ERROR: hay documentos .md en la salida publica. Ninguno se publica." >&2
  find "$SALIDA" -mindepth 1 -name '*.md' | sed "s#$SALIDA/#  #" >&2
  rm -rf "$SALIDA"
  exit 1
fi

echo "Salida pública en cerca/dist/"
find "$SALIDA" -type f | sed "s#$SALIDA/#  #" | sort
echo "  ---"
echo "  $(find "$SALIDA" -type f | wc -l | tr -d ' ') archivos · $(du -sh "$SALIDA" | cut -f1)"
