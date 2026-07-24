import analyticsData from "@/content/analytics.json";

export interface AnalyticsSnapshot {
  available: boolean;
  generatedAt: string | null;
  periodDays: number;
  totals: {
    activeUsers: number;
    sessions: number;
    screenPageViews: number;
    averageSessionDuration: number;
    bounceRate: number;
  };
  topPages: { path: string; views: number }[];
  channels: { channel: string; sessions: number }[];
}

export function getAnalyticsSnapshot(): AnalyticsSnapshot {
  return analyticsData as AnalyticsSnapshot;
}
