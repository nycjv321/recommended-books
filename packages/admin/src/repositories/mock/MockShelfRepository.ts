import type { Shelf } from '@/types';
import type { ShelfRepository } from '../interfaces';

export class MockShelfRepository implements ShelfRepository {
  private shelves: Shelf[] = [];

  setShelves(shelves: Shelf[]): void {
    this.shelves = [...shelves];
  }

  getShelves(): Shelf[] {
    return [...this.shelves];
  }

  async create(shelf: Shelf): Promise<void> {
    if (this.shelves.find(s => s.id === shelf.id)) {
      throw new Error(`Shelf already exists: ${shelf.id}`);
    }
    this.shelves.push(shelf);
  }

  async delete(shelfId: string): Promise<void> {
    const index = this.shelves.findIndex(s => s.id === shelfId);
    if (index < 0) {
      throw new Error(`Shelf not found: ${shelfId}`);
    }
    this.shelves.splice(index, 1);
  }

  async reorder(shelfIds: string[]): Promise<void> {
    const reordered: Shelf[] = [];
    for (const id of shelfIds) {
      const shelf = this.shelves.find(s => s.id === id);
      if (shelf) {
        reordered.push(shelf);
      }
    }
    this.shelves = reordered;
  }
}
