import type { SampleDataRepository, SampleDataResult } from '../interfaces';

export class ElectronSampleDataRepository implements SampleDataRepository {
  async checkExistingBooks(): Promise<{ count: number }> {
    return window.electronAPI.checkExistingBooks();
  }

  async load(): Promise<SampleDataResult> {
    const result = await window.electronAPI.loadSampleData();
    return {
      success: result.success,
      message: result.message,
      booksLoaded: result.booksLoaded,
    };
  }

  async remove(): Promise<SampleDataResult> {
    const result = await window.electronAPI.removeSampleData();
    return {
      success: result.success,
      message: result.message,
      booksRemoved: result.booksRemoved,
    };
  }
}
