/**
 * Path SVG de la "folder card": rounded rect con la esquina superior derecha
 * chaflanada a 45° (equivalente al clip-path del prototipo). Reutilizado por
 * FolderCard, el hero de Home y los tiles de "Más".
 */
export function folderPath(w: number, h: number, r: number, c: number): string {
  return [
    `M ${r} 0`,
    `H ${w - c}`,
    `L ${w} ${c}`,
    `V ${h - r}`,
    `A ${r} ${r} 0 0 1 ${w - r} ${h}`,
    `H ${r}`,
    `A ${r} ${r} 0 0 1 0 ${h - r}`,
    `V ${r}`,
    `A ${r} ${r} 0 0 1 ${r} 0`,
    'Z',
  ].join(' ');
}
