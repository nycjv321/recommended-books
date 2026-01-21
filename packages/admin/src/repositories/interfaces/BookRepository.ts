import type { Book, BookWithMeta } from '@/types';

export interface BookRepository {
  getAll(): Promise<BookWithMeta[]>;
  getById(filePath: string): Promise<Book>;
  save(shelfId: string, fileName: string, book: Book): Promise<string>;
  delete(filePath: string): Promise<void>;
  move(filePath: string, targetShelfId: string): Promise<string>;
}
