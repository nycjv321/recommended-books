import type { SampleDataRepository, SampleDataResult } from '../interfaces';

export class MockSampleDataRepository implements SampleDataRepository {
  private bookCount = 0;
  private loadResult: SampleDataResult = { success: true, message: 'Loaded', booksLoaded: 5 };
  private removeResult: SampleDataResult = { success: true, message: 'Removed', booksRemoved: 5 };

  setBookCount(count: number): void {
    this.bookCount = count;
  }

  setLoadResult(result: SampleDataResult): void {
    this.loadResult = result;
  }

  setRemoveResult(result: SampleDataResult): void {
    this.removeResult = result;
  }

  async checkExistingBooks(): Promise<{ count: number }> {
    return { count: this.bookCount };
  }

  async load(): Promise<SampleDataResult> {
    return this.loadResult;
  }

  async remove(): Promise<SampleDataResult> {
    return this.removeResult;
  }
}
