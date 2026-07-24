// Busca métricas do Google Analytics 4 (via GA4 Data API) e grava um
// snapshot em src/content/analytics.json, consumido pelo dashboard do
// painel administrativo (src/app/admin/(painel)/dashboard/page.tsx).
//
// O site é 100% estático (output: "export", ver next.config.ts) e hospedado
// no GitHub Pages — não existe servidor em tempo de execução para chamar a
// GA4 Data API sob demanda com a service account. Por isso os números são
// "fotografados" neste script, que roda em CI antes de `next build` (ver
// .github/workflows/deploy.yml), o qual já reconstrói o site a cada push e
// a cada 30 min via cron — ou seja, o dashboard nunca fica desatualizado por
// mais que isso.
//
// Ao contrário de sync-content.mjs, as credenciais aqui são opcionais mesmo
// em CI: analytics é um complemento do dashboard, não conteúdo essencial do
// site. Sem GA_PROPERTY_ID/GA_SERVICE_ACCOUNT_KEY configurados nos secrets
// do repositório, o build segue normalmente e o dashboard mostra o snapshot
// de exemplo (available: false) até os secrets serem adicionados.

import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { writeFile } from "node:fs/promises";
import path from "node:path";

const GA_PROPERTY_ID = process.env.GA_PROPERTY_ID;
const GA_SERVICE_ACCOUNT_KEY = process.env.GA_SERVICE_ACCOUNT_KEY;
const OUTPUT_FILE = path.join(process.cwd(), "src", "content", "analytics.json");
const PERIOD_DAYS = 28;

async function main() {
  if (!GA_PROPERTY_ID || !GA_SERVICE_ACCOUNT_KEY) {
    console.warn(
      "⚠ GA_PROPERTY_ID/GA_SERVICE_ACCOUNT_KEY não definidos — mantendo o snapshot de exemplo em src/content/analytics.json."
    );
    return;
  }

  const credentials = JSON.parse(GA_SERVICE_ACCOUNT_KEY);
  const client = new BetaAnalyticsDataClient({ credentials });
  const property = `properties/${GA_PROPERTY_ID}`;
  const dateRanges = [{ startDate: `${PERIOD_DAYS}daysAgo`, endDate: "today" }];

  const [totals, topPages, channels] = await Promise.all([
    fetchTotals(client, property, dateRanges),
    fetchTopPages(client, property, dateRanges),
    fetchChannels(client, property, dateRanges),
  ]);

  const snapshot = {
    available: true,
    generatedAt: new Date().toISOString(),
    periodDays: PERIOD_DAYS,
    totals,
    topPages,
    channels,
  };

  await writeFile(OUTPUT_FILE, `${JSON.stringify(snapshot, null, 2)}\n`, "utf-8");

  console.log(
    `✓ Analytics sincronizado: ${totals.sessions} sessões, ${totals.activeUsers} usuários nos últimos ${PERIOD_DAYS} dias.`
  );
}

async function fetchTotals(client, property, dateRanges) {
  const [response] = await client.runReport({
    property,
    dateRanges,
    metrics: [
      { name: "activeUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
      { name: "averageSessionDuration" },
      { name: "bounceRate" },
    ],
  });

  const row = response.rows?.[0];
  const value = (index) => Number(row?.metricValues?.[index]?.value ?? 0);

  return {
    activeUsers: value(0),
    sessions: value(1),
    screenPageViews: value(2),
    averageSessionDuration: value(3),
    bounceRate: value(4),
  };
}

async function fetchTopPages(client, property, dateRanges) {
  const [response] = await client.runReport({
    property,
    dateRanges,
    dimensions: [{ name: "pagePath" }],
    metrics: [{ name: "screenPageViews" }],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit: 5,
  });

  return (response.rows ?? []).map((row) => ({
    path: row.dimensionValues[0].value,
    views: Number(row.metricValues[0].value),
  }));
}

async function fetchChannels(client, property, dateRanges) {
  const [response] = await client.runReport({
    property,
    dateRanges,
    dimensions: [{ name: "sessionDefaultChannelGroup" }],
    metrics: [{ name: "sessions" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: 5,
  });

  return (response.rows ?? []).map((row) => ({
    channel: row.dimensionValues[0].value,
    sessions: Number(row.metricValues[0].value),
  }));
}

main().catch((error) => {
  console.error("✗ Falha ao sincronizar analytics:", error.message);
  process.exit(1);
});
