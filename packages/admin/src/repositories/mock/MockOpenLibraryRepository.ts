import type { OpenLibrarySearchResult } from '@/types';
import type { OpenLibraryRepository } from '../interfaces';

export class MockOpenLibraryRepository implements OpenLibraryRepository {
  private results: OpenLibrarySearchResult[] = [];

  setResults(results: OpenLibrarySearchResult[]): void {
    this.results = [...results];
  }

  async search(_query: string): Promise<OpenLibrarySearchResult[]> {
    return [...this.results];
  }
}
