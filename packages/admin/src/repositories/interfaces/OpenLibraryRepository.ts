import type { OpenLibrarySearchResult } from '@/types';

export interface OpenLibraryRepository {
  search(query: string): Promise<OpenLibrarySearchResult[]>;
}
