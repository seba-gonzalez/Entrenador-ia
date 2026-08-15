/**
 * Acumula el resultado de las comprobaciones.
 *
 * Un fallo tiene que decir tres cosas: que archivo, que se esperaba y que se
 * encontro. Un mensaje que solo dice "invalido" obliga a reproducir el problema
 * a mano, y entonces la validacion automatica no ahorro nada.
 */

export class Informe {
  constructor() {
    this.fallos = [];
    this.comprobadas = 0;
    this.familias = new Map();
  }

  familia(nombre) {
    if (!this.familias.has(nombre)) this.familias.set(nombre, { ok: 0, fallos: 0 });
    return this.familias.get(nombre);
  }

  ok(familia) {
    this.comprobadas += 1;
    this.familia(familia).ok += 1;
  }

  fallo(familia, archivo, mensaje, detalle) {
    this.comprobadas += 1;
    this.familia(familia).fallos += 1;
    this.fallos.push({ familia, archivo, mensaje, detalle });
  }

  /** Comprueba una condicion y registra el resultado. */
  exigir(familia, condicion, archivo, mensaje, detalle) {
    if (condicion) this.ok(familia);
    else this.fallo(familia, archivo, mensaje, detalle);
    return condicion;
  }

  get hayFallos() {
    return this.fallos.length > 0;
  }

  imprimir() {
    for (const [nombre, { ok, fallos }] of this.familias) {
      const marca = fallos === 0 ? 'OK  ' : 'FALLA';
      console.log(`${marca} ${nombre.padEnd(34)} ${ok}/${ok + fallos}`);
    }

    if (this.hayFallos) {
      console.log(`\n${this.fallos.length} problema(s):\n`);
      for (const f of this.fallos) {
        console.log(`  ${f.archivo}`);
        console.log(`    ${f.mensaje}`);
        if (f.detalle) {
          for (const linea of String(f.detalle).split('\n')) console.log(`    ${linea}`);
        }
        console.log('');
      }
    }

    const total = this.comprobadas;
    console.log(
      this.hayFallos
        ? `${total - this.fallos.length}/${total} comprobaciones pasan — la validacion falla.`
        : `${total}/${total} comprobaciones pasan.`
    );
  }
}
