import type { SiteSettings } from "@/types";
import settingsData from "@/content/settings.json";

const settings = settingsData as SiteSettings;

export function getSiteSettings(): SiteSettings {
  return settings;
}
