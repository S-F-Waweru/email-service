export interface SiteConfig {
  apiKey: string;
  recipient: string;
}

export const sitesConfig: Record<string, SiteConfig> = {
  deliva: {
    apiKey: process.env.SITE_DELIVA_APIKEY!,
    recipient: process.env.SITE_DELIVA_RECIPIENT!,
  },
  alumni: {
    apiKey: process.env.SITE_ALUMNI_APIKEY!,
    recipient: process.env.SITE_ALUMNI_RECIPIENT!,
  },
};