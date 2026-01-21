import type { BookWithMeta } from '@/types';

// Pure utility functions for in-memory filtering

export function getBooksByShelf(books: BookWithMeta[], shelfId: string): BookWithMeta[] {
  return books.filter(b => b.shelfId === shelfId);
}

export function searchBooks(books: BookWithMeta[], query: string): BookWithMeta[] {
  const lowerQuery = query.toLowerCase();
  return books.filter(
    b =>
      b.title.toLowerCase().includes(lowerQuery) ||
      b.author.toLowerCase().includes(lowerQuery) ||
      b.category.toLowerCase().includes(lowerQuery)
  );
}

// Constants

export const CATEGORIES = [
  'Programming',
  'Self-Improvement',
  'Business',
  'Science',
  'Biography',
  'Fiction',
  'Other'
] as const;

export type BookCategory = typeof CATEGORIES[number];
