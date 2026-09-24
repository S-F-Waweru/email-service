export interface SiteConfig {
  apiKey: string;
  recipient: string;
}

const siteEnvironmentPrefixes: Record<string, string> = {
  deliva: 'SITE_DELIVA',
  alumni: 'SITE_ALUMNI',
};

export function getSiteConfig(siteId: string): SiteConfig | undefined {
  const prefix = siteEnvironmentPrefixes[siteId];
  if (!prefix) return undefined;

  const apiKey = process.env[`${prefix}_APIKEY`];
  const recipient = process.env[`${prefix}_RECIPIENT`];
  if (!apiKey || !recipient) return undefined;

  return { apiKey, recipient };
}
