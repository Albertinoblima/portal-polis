// Texto falado no início do áudio Piper de cada matéria, antes do corpo —
// ver scripts/generate-audio.mjs (que duplica esta lógica em JS puro, pois
// não pode importar módulos TS — precisa bater com o que está aqui).
export function formatDateSpoken(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

interface BuildAudioPreambleTextParams {
  editionNumber?: number;
  publishedAt: string;
  editoriaName?: string;
  authorName?: string;
  title: string;
  subtitle?: string;
}

export function buildAudioPreambleText({
  editionNumber,
  publishedAt,
  editoriaName,
  authorName,
  title,
  subtitle,
}: BuildAudioPreambleTextParams): string {
  const parts = ["Jornal Portal Pólis — Onde a Política faz sentido."];
  parts.push(
    editionNumber
      ? `Edição número ${editionNumber}, ${formatDateSpoken(publishedAt)}.`
      : `${formatDateSpoken(publishedAt)}.`
  );
  if (editoriaName) parts.push(`Editoria: ${editoriaName}.`);
  if (authorName) parts.push(`Por ${authorName}.`);
  parts.push(`${title}.`);
  if (subtitle) parts.push(`${subtitle}.`);
  return parts.join(" ");
}
