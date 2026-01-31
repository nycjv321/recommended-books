import { describe, it, expect, beforeEach } from 'vitest';
import { MockBookRepository } from './MockBookRepository';
import type { Book, BookWithMeta } from '@/types';

const createBook = (overrides: Partial<Book> = {}): Book => ({
  title: 'Test Book',
  author: 'Test Author',
  category: 'Programming',
  publishDate: '2023-01-01',
  clickBehavior: 'overlay',
  ...overrides,
});

const createBookWithMeta = (overrides: Partial<BookWithMeta> = {}): BookWithMeta => ({
  ...createBook(),
  filePath: '/mock/books/good/test.json',
  fileName: 'test.json',
  shelfId: 'good',
  shelfLabel: 'Good Reads',
  ...overrides,
});

describe('MockBookRepository', () => {
  let repo: MockBookRepository;

  beforeEach(() => {
    repo = new MockBookRepository();
  });

  describe('setBooks', () => {
    it('sets the initial book collection', async () => {
      const books = [
        createBookWithMeta({ title: 'Book 1' }),
        createBookWithMeta({ title: 'Book 2' }),
      ];

      repo.setBooks(books);
      const result = await repo.getAll();

      expect(result).toHaveLength(2);
    });

    it('creates a copy of the input array', async () => {
      const books = [createBookWithMeta()];
      repo.setBooks(books);

      books.push(createBookWithMeta({ title: 'New Book' }));
      const result = await repo.getAll();

      expect(result).toHaveLength(1);
    });
  });

  describe('getAll', () => {
    it('returns empty array when no books set', async () => {
      const result = await repo.getAll();

      expect(result).toEqual([]);
    });

    it('returns a copy of the books array', async () => {
      repo.setBooks([createBookWithMeta()]);

      const result1 = await repo.getAll();
      const result2 = await repo.getAll();

      expect(result1).not.toBe(result2);
    });
  });

  describe('getById', () => {
    it('returns book data without metadata', async () => {
      const bookWithMeta = createBookWithMeta({
        title: 'Test',
        filePath: '/mock/books/good/test.json',
      });
      repo.setBooks([bookWithMeta]);

      const result = await repo.getById('/mock/books/good/test.json');

      expect(result.title).toBe('Test');
      expect((result as BookWithMeta).filePath).toBeUndefined();
      expect((result as BookWithMeta).fileName).toBeUndefined();
      expect((result as BookWithMeta).shelfId).toBeUndefined();
      expect((result as BookWithMeta).shelfLabel).toBeUndefined();
    });

    it('throws error for non-existent book', async () => {
      await expect(repo.getById('/nonexistent')).rejects.toThrow('Book not found');
    });
  });

  describe('save', () => {
    it('adds a new book', async () => {
      const book = createBook({ title: 'New Book' });

      const filePath = await repo.save('good', 'new-book.json', book);

      expect(filePath).toBe('/mock/books/good/new-book.json');
      const books = await repo.getAll();
      expect(books).toHaveLength(1);
      expect(books[0].title).toBe('New Book');
    });

    it('updates existing book at same path', async () => {
      repo.setBooks([
        createBookWithMeta({
          title: 'Original',
          filePath: '/mock/books/good/test.json',
          fileName: 'test.json',
          shelfId: 'good',
        }),
      ]);

      await repo.save('good', 'test.json', createBook({ title: 'Updated' }));

      const books = await repo.getAll();
      expect(books).toHaveLength(1);
      expect(books[0].title).toBe('Updated');
    });

    it('sets shelfLabel to shelfId', async () => {
      await repo.save('top5', 'test.json', createBook());

      const books = await repo.getAll();
      expect(books[0].shelfLabel).toBe('top5');
    });
  });

  describe('delete', () => {
    it('removes book by file path', async () => {
      repo.setBooks([
        createBookWithMeta({ filePath: '/mock/books/good/book1.json' }),
        createBookWithMeta({ filePath: '/mock/books/good/book2.json' }),
      ]);

      await repo.delete('/mock/books/good/book1.json');

      const books = await repo.getAll();
      expect(books).toHaveLength(1);
      expect(books[0].filePath).toBe('/mock/books/good/book2.json');
    });

    it('does nothing for non-existent path', async () => {
      repo.setBooks([createBookWithMeta()]);

      await repo.delete('/nonexistent');

      const books = await repo.getAll();
      expect(books).toHaveLength(1);
    });
  });

  describe('move', () => {
    it('moves book to new shelf', async () => {
      repo.setBooks([
        createBookWithMeta({
          filePath: '/mock/books/good/test.json',
          fileName: 'test.json',
          shelfId: 'good',
        }),
      ]);

      const newPath = await repo.move('/mock/books/good/test.json', 'top5');

      expect(newPath).toBe('/mock/books/top5/test.json');
      const books = await repo.getAll();
      expect(books[0].shelfId).toBe('top5');
      expect(books[0].filePath).toBe('/mock/books/top5/test.json');
    });

    it('throws error for non-existent book', async () => {
      await expect(repo.move('/nonexistent', 'top5')).rejects.toThrow('Book not found');
    });

    it('preserves book data when moving', async () => {
      repo.setBooks([
        createBookWithMeta({
          title: 'My Book',
          author: 'My Author',
          filePath: '/mock/books/good/test.json',
          fileName: 'test.json',
          shelfId: 'good',
        }),
      ]);

      await repo.move('/mock/books/good/test.json', 'top5');

      const books = await repo.getAll();
      expect(books[0].title).toBe('My Book');
      expect(books[0].author).toBe('My Author');
    });
  });
});
