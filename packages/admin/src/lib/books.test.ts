import { describe, it, expect } from 'vitest';
import { getBooksByShelf, searchBooks, CATEGORIES } from './books';
import type { BookWithMeta } from '@/types';

const createBook = (overrides: Partial<BookWithMeta> = {}): BookWithMeta => ({
  title: 'Test Book',
  author: 'Test Author',
  category: 'Programming',
  publishDate: '2023-01-01',
  clickBehavior: 'overlay',
  filePath: '/test/path.json',
  fileName: 'test.json',
  shelfId: 'good',
  shelfLabel: 'Good Reads',
  ...overrides,
});

describe('getBooksByShelf', () => {
  it('returns books matching the shelf ID', () => {
    const books: BookWithMeta[] = [
      createBook({ shelfId: 'good', title: 'Book 1' }),
      createBook({ shelfId: 'top5', title: 'Book 2' }),
      createBook({ shelfId: 'good', title: 'Book 3' }),
    ];

    const result = getBooksByShelf(books, 'good');

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Book 1');
    expect(result[1].title).toBe('Book 3');
  });

  it('returns empty array when no books match', () => {
    const books: BookWithMeta[] = [
      createBook({ shelfId: 'good' }),
      createBook({ shelfId: 'top5' }),
    ];

    const result = getBooksByShelf(books, 'current');

    expect(result).toHaveLength(0);
  });

  it('returns empty array for empty input', () => {
    const result = getBooksByShelf([], 'good');

    expect(result).toHaveLength(0);
  });

  it('handles special characters in shelf IDs', () => {
    const books: BookWithMeta[] = [
      createBook({ shelfId: 'my-shelf' }),
      createBook({ shelfId: 'myShelf' }),
    ];

    const result = getBooksByShelf(books, 'my-shelf');

    expect(result).toHaveLength(1);
  });
});

describe('searchBooks', () => {
  it('finds books by title', () => {
    const books: BookWithMeta[] = [
      createBook({ title: 'Clean Code' }),
      createBook({ title: 'The Pragmatic Programmer' }),
      createBook({ title: 'Code Complete' }),
    ];

    const result = searchBooks(books, 'code');

    expect(result).toHaveLength(2);
    expect(result.map(b => b.title)).toContain('Clean Code');
    expect(result.map(b => b.title)).toContain('Code Complete');
  });

  it('finds books by author', () => {
    const books: BookWithMeta[] = [
      createBook({ author: 'Robert Martin' }),
      createBook({ author: 'Martin Fowler' }),
      createBook({ author: 'Kent Beck' }),
    ];

    const result = searchBooks(books, 'martin');

    expect(result).toHaveLength(2);
  });

  it('finds books by category', () => {
    const books: BookWithMeta[] = [
      createBook({ category: 'Programming' }),
      createBook({ category: 'Business' }),
      createBook({ category: 'Self-Improvement' }),
    ];

    const result = searchBooks(books, 'programming');

    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('Programming');
  });

  it('is case insensitive', () => {
    const books: BookWithMeta[] = [
      createBook({ title: 'CLEAN CODE' }),
      createBook({ author: 'Robert MARTIN' }),
    ];

    expect(searchBooks(books, 'clean')).toHaveLength(1);
    expect(searchBooks(books, 'CLEAN')).toHaveLength(1);
    expect(searchBooks(books, 'Clean')).toHaveLength(1);
    expect(searchBooks(books, 'martin')).toHaveLength(1);
  });

  it('returns all books for empty query', () => {
    const books: BookWithMeta[] = [
      createBook({ title: 'Book 1' }),
      createBook({ title: 'Book 2' }),
    ];

    const result = searchBooks(books, '');

    expect(result).toHaveLength(2);
  });

  it('returns empty array when nothing matches', () => {
    const books: BookWithMeta[] = [
      createBook({ title: 'Clean Code', author: 'Robert Martin', category: 'Programming' }),
    ];

    const result = searchBooks(books, 'javascript');

    expect(result).toHaveLength(0);
  });

  it('matches partial words', () => {
    const books: BookWithMeta[] = [
      createBook({ title: 'Programming Pearls' }),
    ];

    const result = searchBooks(books, 'gram');

    expect(result).toHaveLength(1);
  });
});

describe('CATEGORIES', () => {
  it('contains expected categories', () => {
    expect(CATEGORIES).toContain('Programming');
    expect(CATEGORIES).toContain('Self-Improvement');
    expect(CATEGORIES).toContain('Business');
    expect(CATEGORIES).toContain('Science');
    expect(CATEGORIES).toContain('Biography');
    expect(CATEGORIES).toContain('Fiction');
    expect(CATEGORIES).toContain('Other');
  });

  it('has 7 categories', () => {
    expect(CATEGORIES).toHaveLength(7);
  });
});
