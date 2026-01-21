import type { OpenLibrarySearchResult } from '@/types';

// API URL constants
const OPEN_LIBRARY_API = 'https://openlibrary.org';
const COVERS_API = 'https://covers.openlibrary.org';

// Pure utility functions

export function getCoverUrl(coverId: number | undefined, size: 'S' | 'M' | 'L' = 'L'): string | undefined {
  if (!coverId) return undefined;
  return `${COVERS_API}/b/id/${coverId}-${size}.jpg`;
}

function getBookUrl(key: string): string {
  return `${OPEN_LIBRARY_API}${key}`;
}

function formatPublishDate(year: number | undefined): string {
  if (!year) return '';
  return `${year}-01-01`;
}

// Transformer function

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
