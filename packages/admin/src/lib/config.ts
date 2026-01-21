// Pure utility functions

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
