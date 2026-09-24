# Biblioteca de Mídia

Pasta de destino dos arquivos enviados pelo painel administrativo via GitHub
Contents API (ver `src/lib/github/mediaLibrary.ts`). Cada arquivo aqui vira um
asset estático normal do site após o próximo deploy, servido em
`/biblioteca-midias/<nome-do-arquivo>`.

Não edite os arquivos desta pasta manualmente — o nome inclui um timestamp e o
metadado (texto alternativo, quem enviou, quando) fica em
`src/content/media.json`. Editar só um dos dois deixa os dois fora de sincronia.
