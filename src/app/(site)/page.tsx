import { Newspaper, type NewspaperBlock } from "@/components/newspaper/Newspaper";
import { buildEditionBlocks } from "@/components/newspaper/editionBlocks";
import { getAllEditions } from "@/lib/editions";

export default function HomePage() {
  const editions = getAllEditions();
  const blocks: NewspaperBlock[] = editions.flatMap((edition) => buildEditionBlocks(edition));
  const latest = editions[0];

  return (
    <Newspaper
      sectionLabel="Capa"
      showMasthead
      edition={latest ? { number: latest.number, date: latest.date } : undefined}
      blocks={blocks}
    />
  );
}
