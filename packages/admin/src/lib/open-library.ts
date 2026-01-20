import type { OpenLibrarySearchResult } from '@/types';

const OPEN_LIBRARY_API = 'https://openlibrary.org';
const COVERS_API = 'https://covers.openlibrary.org';

export function isIsbn(query: string): boolean {
  const cleaned = query.replace(/[-\s]/g, '');
  return /^\d{10}$/.test(cleaned) || /^\d{13}$/.test(cleaned);
}

export async function searchOpenLibrary(query: string): Promise<OpenLibrarySearchResult[]> {
  return window.electronAPI.searchOpenLibrary(query);
}

export function getCoverUrl(coverId: number | undefined, size: 'S' | 'M' | 'L' = 'L'): string | undefined {
  if (!coverId) return undefined;
  return `${COVERS_API}/b/id/${coverId}-${size}.jpg`;
}

export function getCoverUrlByOlid(olid: string, size: 'S' | 'M' | 'L' = 'L'): string {
  return `${COVERS_API}/b/olid/${olid}-${size}.jpg`;
}

export function getBookUrl(key: string): string {
  return `${OPEN_LIBRARY_API}${key}`;
}

export function formatPublishDate(year: number | undefined): string {
  if (!year) return '';
  return `${year}-01-01`;
}

export function openLibraryResultToBook(result: OpenLibrarySearchResult): {
  title: string;
  author: string;
  publishDate: string;
  pages: number | undefined;
  cover: string | undefined;
  link: string;
} {
  return {
    title: result.title,
    author: result.author_name?.[0] || '',
    publishDate: formatPublishDate(result.first_publish_year),
    pages: result.number_of_pages_median,
    cover: getCoverUrl(result.cover_i),
    link: result.key ? getBookUrl(result.key) : ''
  };
}
