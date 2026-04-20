let counter = 0;

/** ID corto y estable para una sesión. No tiene sentido criptográfico. */
export function nextId(prefix = 'el'): string {
  counter += 1;
  const rand = Math.random().toString(36).slice(2, 7);
  return `${prefix}_${Date.now().toString(36)}_${counter}_${rand}`;
}

/** Genera un ID numérico estable (para compatibilidad con el XML del backend, que usa enteros). */
let numericCounter = 1000;
export function nextNumericId(): number {
  numericCounter += 1;
  return numericCounter;
}
