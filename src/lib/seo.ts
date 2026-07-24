import { getSiteSettings } from "@/lib/settings";

const settings = getSiteSettings();

export const SITE_URL = "https://portalpolis.idialog.com.br";
export const SITE_NAME = settings.siteName;
export const SITE_TAGLINE = settings.tagline;
export const SITE_DESCRIPTION = settings.defaultSeoDescription;
