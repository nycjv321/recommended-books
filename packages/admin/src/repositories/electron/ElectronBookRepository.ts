import type { Book, BookWithMeta } from '@/types';
import type { BookRepository } from '../interfaces';

export class ElectronBookRepository implements BookRepository {
  async getAll(): Promise<BookWithMeta[]> {
    return window.electronAPI.getBooks();
  }

  async getById(filePath: string): Promise<Book> {
    return window.electronAPI.getBook(filePath);
  }

  async save(shelfId: string, fileName: string, book: Book): Promise<string> {
    return window.electronAPI.saveBook(shelfId, fileName, book);
  }

  async delete(filePath: string): Promise<void> {
    return window.electronAPI.deleteBook(filePath);
  }

  async move(filePath: string, targetShelfId: string): Promise<string> {
    return window.electronAPI.moveBook(filePath, targetShelfId);
  }
}
