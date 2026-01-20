export async function downloadCover(url: string, fileName: string): Promise<string> {
  return window.electronAPI.downloadCover(url, fileName);
}

export async function deleteCover(coverPath: string): Promise<void> {
  return window.electronAPI.deleteCover(coverPath);
}

export function getCoverFileName(bookTitle: string, extension: string = 'jpg'): string {
  const kebabTitle = bookTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  return `${kebabTitle}.${extension}`;
}

export function isLocalCover(coverPath: string | undefined): boolean {
  if (!coverPath) return false;
  return coverPath.startsWith('books/covers/') || coverPath.startsWith('covers/');
}

export function isExternalCover(coverUrl: string | undefined): boolean {
  if (!coverUrl) return false;
  return coverUrl.startsWith('http://') || coverUrl.startsWith('https://');
}
