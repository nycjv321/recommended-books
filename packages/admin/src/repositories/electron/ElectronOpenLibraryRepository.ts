import type { OpenLibrarySearchResult } from '@/types';
import type { OpenLibraryRepository } from '../interfaces';

export class ElectronOpenLibraryRepository implements OpenLibraryRepository {
  async search(query: string): Promise<OpenLibrarySearchResult[]> {
    return window.electronAPI.searchOpenLibrary(query);
  }
}
