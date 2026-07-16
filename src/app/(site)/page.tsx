import { Newspaper, type NewspaperBlock } from "@/components/newspaper/Newspaper";
import { buildEditionBlocks } from "@/components/newspaper/editionBlocks";
import { getAllEditions } from "@/lib/editions";

export default function HomePage() {
  const blocks: NewspaperBlock[] = getAllEditions().flatMap((edition) => buildEditionBlocks(edition));

  return <Newspaper sectionLabel="Capa" showMasthead blocks={blocks} />;
}
