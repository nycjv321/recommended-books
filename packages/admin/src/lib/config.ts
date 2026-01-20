import type { Config, Shelf } from '@/types';

export async function getConfig(): Promise<Config> {
  return window.electronAPI.getConfig();
}

export async function saveConfig(config: Config): Promise<void> {
  return window.electronAPI.saveConfig(config);
}

export async function updateSiteTitle(title: string): Promise<void> {
  const config = await getConfig();
  config.siteTitle = title;
  await saveConfig(config);
}

export async function updateSiteSubtitle(subtitle: string): Promise<void> {
  const config = await getConfig();
  config.siteSubtitle = subtitle;
  await saveConfig(config);
}

export async function updateFooterText(footerText: string): Promise<void> {
  const config = await getConfig();
  config.footerText = footerText;
  await saveConfig(config);
}

export async function getShelves(): Promise<Shelf[]> {
  const config = await getConfig();
  return config.shelves;
}

export async function getShelfById(id: string): Promise<Shelf | undefined> {
  const config = await getConfig();
  return config.shelves.find(s => s.id === id);
}

export function shelfIdToFolder(shelfId: string): string {
  return shelfId.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
}

export function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
