import { describe, it, expect } from 'vitest';
import { getCoverUrl, openLibraryResultToBook } from './open-library';
import type { OpenLibrarySearchResult } from '@/types';

describe('getCoverUrl', () => {
  it('returns URL with default large size', () => {
    const url = getCoverUrl(12345);
    expect(url).toBe('https://covers.openlibrary.org/b/id/12345-L.jpg');
  });

  it('returns URL with small size', () => {
    const url = getCoverUrl(12345, 'S');
    expect(url).toBe('https://covers.openlibrary.org/b/id/12345-S.jpg');
  });

  it('returns URL with medium size', () => {
    const url = getCoverUrl(12345, 'M');
    expect(url).toBe('https://covers.openlibrary.org/b/id/12345-M.jpg');
  });

  it('returns URL with large size', () => {
    const url = getCoverUrl(12345, 'L');
    expect(url).toBe('https://covers.openlibrary.org/b/id/12345-L.jpg');
  });

  it('returns undefined for undefined coverId', () => {
    const url = getCoverUrl(undefined);
    expect(url).toBeUndefined();
  });

  it('returns undefined for zero coverId', () => {
    const url = getCoverUrl(0);
    expect(url).toBeUndefined();
  });
});

describe('openLibraryResultToBook', () => {
  it('transforms complete result', () => {
    const result: OpenLibrarySearchResult = {
      key: '/works/OL123W',
      title: 'Clean Code',
      author_name: ['Robert C. Martin'],
      first_publish_year: 2008,
      number_of_pages_median: 464,
      cover_i: 12345,
    };

    const book = openLibraryResultToBook(result);

    expect(book).toEqual({
      title: 'Clean Code',
      author: 'Robert C. Martin',
      publishDate: '2008-01-01',
      pages: 464,
      cover: 'https://covers.openlibrary.org/b/id/12345-L.jpg',
      link: 'https://openlibrary.org/works/OL123W',
    });
  });

  it('handles missing author', () => {
    const result: OpenLibrarySearchResult = {
      key: '/works/OL123W',
      title: 'Unknown Author Book',
    };

    const book = openLibraryResultToBook(result);

    expect(book.author).toBe('');
  });

  it('handles empty author array', () => {
    const result: OpenLibrarySearchResult = {
      key: '/works/OL123W',
      title: 'Unknown Author Book',
      author_name: [],
    };

    const book = openLibraryResultToBook(result);

    expect(book.author).toBe('');
  });

  it('takes first author when multiple authors', () => {
    const result: OpenLibrarySearchResult = {
      key: '/works/OL123W',
      title: 'Multi Author Book',
      author_name: ['First Author', 'Second Author', 'Third Author'],
    };

    const book = openLibraryResultToBook(result);

    expect(book.author).toBe('First Author');
  });

  it('handles missing publish year', () => {
    const result: OpenLibrarySearchResult = {
      key: '/works/OL123W',
      title: 'No Year Book',
    };

    const book = openLibraryResultToBook(result);

    expect(book.publishDate).toBe('');
  });

  it('handles missing pages', () => {
    const result: OpenLibrarySearchResult = {
      key: '/works/OL123W',
      title: 'No Pages Book',
    };

    const book = openLibraryResultToBook(result);

    expect(book.pages).toBeUndefined();
  });

  it('handles missing cover', () => {
    const result: OpenLibrarySearchResult = {
      key: '/works/OL123W',
      title: 'No Cover Book',
    };

    const book = openLibraryResultToBook(result);

    expect(book.cover).toBeUndefined();
  });

  it('handles missing key', () => {
    const result: OpenLibrarySearchResult = {
      key: '',
      title: 'No Key Book',
    };

    const book = openLibraryResultToBook(result);

    expect(book.link).toBe('');
  });

  it('handles minimal result with only required fields', () => {
    const result: OpenLibrarySearchResult = {
      key: '/works/OL123W',
      title: 'Minimal Book',
    };

    const book = openLibraryResultToBook(result);

    expect(book).toEqual({
      title: 'Minimal Book',
      author: '',
      publishDate: '',
      pages: undefined,
      cover: undefined,
      link: 'https://openlibrary.org/works/OL123W',
    });
  });
});
