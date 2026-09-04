#!/bin/sh
# Comprueba que CRITERIOS.md y el código no se separen.
#
# No comprueba que la lista esté completa: un criterio que nunca se escribió no
# deja hueco, y ningún programa puede echar de menos lo que no existe. Lo que sí
# comprueba es lo otro, que es donde de verdad se pierden las cosas:
#
#   1. que cada C-nn citado en el código exista en la tabla — para que nadie
#      invente un número o cite uno retirado;
#   2. que cada criterio marcado [revisor] esté de verdad citado en el
#      publicador — porque «lo comprueba el revisor» escrito en una tabla y no
#      implementado en ningún sitio es peor que no prometerlo.
#
#   sh cerca/criterios.sh
#
# Corre en cada push desde .github/workflows/validar.yml. Falla la comprobación
# de GitHub, no el despliegue: una deriva de documentación no puede dejar a un
# alumno sin poder abrir su sesión.

set -eu

ORIGEN=$(cd "$(dirname "$0")" && pwd)
LISTA="$ORIGEN/CRITERIOS.md"
REVISOR="$ORIGEN/publicar/publicador.js"
fallos=0

[ -f "$LISTA" ] || { echo "ERROR: no existe $LISTA." >&2; exit 1; }

# Los numeros que declara la tabla: solo los de la primera columna, en negrita.
declarados=$(grep -oE '^\| \*\*C-[0-9]{2}\*\*' "$LISTA" | grep -oE 'C-[0-9]{2}' | sort -u)

# Los que cita el codigo. Se excluye la propia tabla y este archivo.
citados=$(grep -rhoE '\bC-[0-9]{2}\b' \
  "$ORIGEN/s" "$ORIGEN/hola" "$ORIGEN/publicar" "$ORIGEN/alumno" "$ORIGEN/sql" "$ORIGEN/build.sh" \
  2>/dev/null | sort -u)

for c in $citados; do
  if ! echo "$declarados" | grep -qx "$c"; then
    echo "ERROR: el código cita «$c» y ese criterio no está en CRITERIOS.md." >&2
    fallos=$((fallos + 1))
  fi
done

# Los marcados [revisor] tienen que estar citados en el publicador.
revisor=$(grep -E '^\| \*\*C-[0-9]{2}\*\*.*\[revisor\]' "$LISTA" | grep -oE 'C-[0-9]{2}' | sort -u)
for c in $revisor; do
  if ! grep -q "$c" "$REVISOR"; then
    echo "ERROR: «$c» dice en CRITERIOS.md que lo comprueba el revisor, pero no aparece en publicar/publicador.js." >&2
    fallos=$((fallos + 1))
  fi
done

if [ "$fallos" -gt 0 ]; then
  echo "" >&2
  echo "$fallos desajuste(s) entre CRITERIOS.md y el código." >&2
  exit 1
fi

echo "OK: $(echo "$declarados" | wc -l | tr -d ' ') criterios declarados · $(echo "$citados" | grep -c . || true) citados en el código · $(echo "$revisor" | grep -c . || true) comprobados por el revisor."
