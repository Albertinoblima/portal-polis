import { createHash } from "node:crypto";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "src", "content");
const VIDEO_DIR = path.join(ROOT, "public", "assets", "video");
const MANIFEST_FILE = path.join(CONTENT_DIR, "video-manifest.json");
const ARTICLES_FILE = path.join(CONTENT_DIR, "articles.json");

function hashUrl(url) {
    return createHash("sha256").update(url).digest("hex").slice(0, 16);
}

async function main() {
    await mkdir(VIDEO_DIR, { recursive: true });

    const gifUrls = [
        "https://fnvswsbcxyrwrjtjzwgp.supabase.co/storage/v1/object/public/media/1789913133813-BR_-_232_ANTES_e_depois.gif",
        "https://fnvswsbcxyrwrjtjzwgp.supabase.co/storage/v1/object/public/media/1789914020713-ChatGPT_Image_20_de_set._de_2026__10_54_09.png",
        "https://fnvswsbcxyrwrjtjzwgp.supabase.co/storage/v1/object/public/media/1789914053824-desenvolvimento.gif",
    ];

    const manifest = {};
    for (const url of gifUrls) {
        const h = hashUrl(url);
        const video = `/assets/video/${h}.mp4`;
        const poster = `/assets/video/${h}-poster.jpg`;
        manifest[h] = { sourceUrl: url, video, poster, updatedAt: new Date().toISOString() };
        // create placeholder files so isCached checks pass
        const videoPath = path.join(ROOT, "public", video.replace(/^\//, ""));
        const posterPath = path.join(ROOT, "public", poster.replace(/^\//, ""));
        if (!existsSync(videoPath)) await writeFile(videoPath, "", "utf-8");
        if (!existsSync(posterPath)) await writeFile(posterPath, "", "utf-8");
    }

    await writeFile(MANIFEST_FILE, `${JSON.stringify(manifest, null, 2)}\n`, "utf-8");
    console.log(`✓ Wrote test manifest with ${Object.keys(manifest).length} entries to ${MANIFEST_FILE}`);

    // Backup existing articles.json
    try {
        const existing = await readFile(ARTICLES_FILE, "utf-8");
        await writeFile(`${ARTICLES_FILE}.bak`, existing, "utf-8");
        console.log("✓ Backed up existing articles.json to articles.json.bak");
    } catch (err) {
        console.warn("⚠ No existing articles.json to back up or read: creating new one.");
    }

    const articleContent = `
<h2>Infraestrutura e Mobilidade: A Luta pela BR-232</h2><p>A luta pela duplicação da BR-232 até o município de Serra Talhada consolidou-se como uma das principais pautas de Fernando Monteiro para impulsionar o desenvolvimento do Sertão pernambucano. A defesa incisiva desta obra, que assegurou sua inclusão no Novo PAC, reforça a atuação do deputado em uma região que tem na rodovia o seu mais importante eixo de mobilidade, integração territorial e crescimento econômico.</p><img src="https://fnvswsbcxyrwrjtjzwgp.supabase.co/storage/v1/object/public/media/1789913133813-BR_-_232_ANTES_e_depois.gif" alt="BR - 232 ANTES e depois.gif"><p>Representante de Pernambuco na Câmara dos Deputados pelo Partido Social Democrático (PSD), o parlamentar e empresário recifense, que ocupa cadeira na casa desde 2015, possui uma atuação historicamente baseada na interiorização de investimentos. A forte articulação por infraestrutura não é isolada, configurando-se como uma de suas bandeiras institucionais prioritárias voltadas à "Estradas e Mobilidade". Esse trabalho direto traduz um perfil abertamente municipalista e ancorado no diálogo permanente com prefeitos e lideranças do interior.</p><h2>Novas Adesões e Força Política no Pajeú</h2><p>Os resultados viários e estruturais rapidamente se desdobram em força política. Em Afogados da Ingazeira, as movimentações de bastidores ganharam traços oficiais na primeira semana de setembro de 2026. Segundo veículos da imprensa regional (Fontes: <em>Afogados FM</em> e <em>Blog Nill Júnior</em>), o vereador Zé Negão e o ex-vereador Edson Henrique anunciaram adesão e irão apoiar a reeleição de Fernando Monteiro. Juntam-se a eles nesta empreitada as lideranças políticas Tenente Glaydson, Jucélio Gomes e Cafú.</p><img src="https://fnvswsbcxyrwrjtjzwgp.supabase.co/storage/v1/object/public/media/1789914020713-ChatGPT_Image_20_de_set._de_2026__10_54_09.png" alt="ChatGPT Image 20 de set. de 2026, 10_54_09.png"><p>A chegada deste novo grupo político representa um ativo vital e estratégico para a construção e ampliação da base do parlamentar no Pajeú. A união também não ocorre de forma descolada do panorama estadual, já que o movimento soma-se organicamente ao projeto político mais amplo de suporte à reeleição da governadora Raquel Lyra, unificando palanques e forças para o próximo pleito.</p><h2>Atuação Estruturadora e Segurança Hídrica</h2><p>O peso legislativo de Fernando Monteiro também avança sobre outra carência histórica do semiárido pernambucano: a água. Atual presidente da Frente Parlamentar do Saneamento, o parlamentar exerce franco protagonismo na defesa do saneamento básico rural e na construção de infraestrutura hídrica e resiliência climática, aliando o tema às suas outras bandeiras essenciais, que incluem saúde, trabalho e habitação digna.</p><img src="https://fnvswsbcxyrwrjtjzwgp.supabase.co/storage/v1/object/public/media/1789914053824-desenvolvimento.gif" alt="desenvolvimento.gif"><p>Com forte trânsito em Brasília e presença física junto aos gestores locais, o deputado – que já foi condecorado com a Medalha da Ordem de Rio Branco – blinda e amplia sua musculatura política. A equação entre o destravamento de obras urgentes, como os acessos da BR-232, e a capacidade agregadora nas articulações locais reforça o espaço de Monteiro como um dos porta-vozes centrais do Sertão de Pernambuco no Congresso Nacional.</p>
`;

    const article = {
        id: "test-fernando",
        title: "Infraestrutura e Mobilidade: A Luta pela BR-232",
        slug: "fernando-monteiro-consolida-base-br-232-test",
        subtitle: "Teste local de conversão de GIFs",
        content: articleContent,
        featuredImage: null,
        featuredImageAlt: null,
        editoriaId: "ed-test",
        authorId: "au-test",
        categoryIds: [],
        tagIds: [],
        status: "published",
        publishedAt: new Date().toISOString(),
        seoTitle: "Teste BR-232",
        seoDescription: "Teste local",
        readingTimeMinutes: 1,
        viewCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    await writeFile(ARTICLES_FILE, `${JSON.stringify([article], null, 2)}\n`, "utf-8");
    console.log(`✓ Wrote test article to ${ARTICLES_FILE}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
