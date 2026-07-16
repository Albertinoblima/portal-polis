/** Chave única de célula para Set/Map de grades de jogo (Blocos, Palavras
 *  Cruzadas, Caça-Palavras). */
export function cellKey(row: number, col: number): string {
  return `${row}:${col}`;
}
