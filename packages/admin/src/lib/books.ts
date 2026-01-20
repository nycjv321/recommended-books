import type { Book, BookWithMeta } from '@/types';
import { toKebabCase } from './config';

export async function getBooks(): Promise<BookWithMeta[]> {
  return window.electronAPI.getBooks();
}

export async function getBook(filePath: string): Promise<Book> {
  return window.electronAPI.getBook(filePath);
}

export async function saveBook(
  shelfId: string,
  title: string,
  book: Book,
  existingFileName?: string
): Promise<string> {
  const fileName = existingFileName || `${toKebabCase(title)}.json`;
  return window.electronAPI.saveBook(shelfId, fileName, book);
}

export async function createBook(shelfId: string, book: Book): Promise<string> {
  const fileName = `${toKebabCase(book.title)}.json`;
  return window.electronAPI.saveBook(shelfId, fileName, book);
}

export async function updateBook(
  filePath: string,
  book: Book,
  targetShelfId?: string
): Promise<string> {
  const currentBooks = await getBooks();
  const currentBook = currentBooks.find(b => b.filePath === filePath);

  if (!currentBook) {
    throw new Error('Book not found');
  }

  // If shelf changed, move the book first
  if (targetShelfId && targetShelfId !== currentBook.shelfId) {
    const newPath = await moveBook(filePath, targetShelfId);
    // Update the book content at new location
    const fileName = newPath.split('/').pop() || `${toKebabCase(book.title)}.json`;
    return window.electronAPI.saveBook(targetShelfId, fileName, book);
  }

  // Update in place
  return window.electronAPI.saveBook(currentBook.shelfId, currentBook.fileName, book);
}

export async function deleteBook(filePath: string): Promise<void> {
  return window.electronAPI.deleteBook(filePath);
}

export async function moveBook(filePath: string, targetShelfId: string): Promise<string> {
  return window.electronAPI.moveBook(filePath, targetShelfId);
}

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
