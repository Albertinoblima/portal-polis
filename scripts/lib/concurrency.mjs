// Pool de concorrência simples — evita rodar todos os itens de uma lista em
// paralelo irrestrito (ex.: baixar+transcodificar dezenas de GIFs de uma vez
// no runner de CI) sem precisar de uma dependência nova.
export async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;

  async function next() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, next));
  return results;
}
