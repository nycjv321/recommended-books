import type { CoverRepository } from '../interfaces';

export class MockCoverRepository implements CoverRepository {
  private covers: Map<string, string> = new Map();

  async download(url: string, fileName: string): Promise<string> {
    const coverPath = `books/covers/${fileName}`;
    this.covers.set(coverPath, url);
    return coverPath;
  }

  async delete(coverPath: string): Promise<void> {
    this.covers.delete(coverPath);
  }

  getCovers(): Map<string, string> {
    return new Map(this.covers);
  }
}
