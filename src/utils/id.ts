let counter = 0;

/** ID simple y legible: el1, el2, page1, doc1, etc. */
export function nextId(prefix = 'el'): string {
  counter += 1;
  return `${prefix}${counter}`;
}

/** ID numérico para compatibilidad con el XML del backend (enteros). */
let numericCounter = 1000;
export function nextNumericId(): number {
  numericCounter += 1;
  return numericCounter;
}
