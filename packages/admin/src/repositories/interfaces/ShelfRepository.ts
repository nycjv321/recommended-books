import type { Shelf } from '@/types';

export interface ShelfRepository {
  create(shelf: Shelf): Promise<void>;
  delete(shelfId: string): Promise<void>;
  reorder(shelfIds: string[]): Promise<void>;
}
