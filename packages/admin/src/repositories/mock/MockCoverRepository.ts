import type { CoverRepository, DownloadAllCoversResult } from '../interfaces';

export class MockCoverRepository implements CoverRepository {
  private covers: Map<string, string> = new Map();
  private downloadAllResult: DownloadAllCoversResult = {
    success: true,
    downloaded: 5,
    skipped: 2,
    failed: 0,
    errors: [],
  };

  async download(url: string, fileName: string): Promise<string> {
    const coverPath = `books/covers/${fileName}`;
    this.covers.set(coverPath, url);
    return coverPath;
  }

  async delete(coverPath: string): Promise<void> {
    this.covers.delete(coverPath);
  }

  async downloadAll(): Promise<DownloadAllCoversResult> {
    return { ...this.downloadAllResult };
  }

  getCovers(): Map<string, string> {
    return new Map(this.covers);
  }

  setDownloadAllResult(result: DownloadAllCoversResult): void {
    this.downloadAllResult = { ...result };
  }
}
