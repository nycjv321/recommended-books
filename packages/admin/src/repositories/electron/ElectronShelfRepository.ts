import type { Shelf } from '@/types';
import type { ShelfRepository } from '../interfaces';

export class ElectronShelfRepository implements ShelfRepository {
  async create(shelf: Shelf): Promise<void> {
    return window.electronAPI.createShelf(shelf);
  }

  async delete(shelfId: string): Promise<void> {
    return window.electronAPI.deleteShelf(shelfId);
  }

  async reorder(shelfIds: string[]): Promise<void> {
    return window.electronAPI.reorderShelves(shelfIds);
  }
}
