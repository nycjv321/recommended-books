import type { Book, BookWithMeta } from '@/types';
import type { BookRepository } from '../interfaces';

export class MockBookRepository implements BookRepository {
  private books: BookWithMeta[] = [];

  setBooks(books: BookWithMeta[]): void {
    this.books = [...books];
  }

  async getAll(): Promise<BookWithMeta[]> {
    return [...this.books];
  }

  async getById(filePath: string): Promise<Book> {
    const book = this.books.find(b => b.filePath === filePath);
    if (!book) {
      throw new Error(`Book not found: ${filePath}`);
    }
    const { filePath: _, fileName: __, shelfId: ___, shelfLabel: ____, ...bookData } = book;
    return bookData;
  }

  async save(shelfId: string, fileName: string, book: Book): Promise<string> {
    const filePath = `/mock/books/${shelfId}/${fileName}`;
    const existingIndex = this.books.findIndex(b => b.filePath === filePath);

    const bookWithMeta: BookWithMeta = {
      ...book,
      filePath,
      fileName,
      shelfId,
      shelfLabel: shelfId,
    };

    if (existingIndex >= 0) {
      this.books[existingIndex] = bookWithMeta;
    } else {
      this.books.push(bookWithMeta);
    }

    return filePath;
  }

  async delete(filePath: string): Promise<void> {
    this.books = this.books.filter(b => b.filePath !== filePath);
  }

  async move(filePath: string, targetShelfId: string): Promise<string> {
    const bookIndex = this.books.findIndex(b => b.filePath === filePath);
    if (bookIndex < 0) {
      throw new Error(`Book not found: ${filePath}`);
    }

    const book = this.books[bookIndex];
    const newFilePath = `/mock/books/${targetShelfId}/${book.fileName}`;

    this.books[bookIndex] = {
      ...book,
      filePath: newFilePath,
      shelfId: targetShelfId,
      shelfLabel: targetShelfId,
    };

    return newFilePath;
  }
}
