import type { CoverRepository } from '../interfaces';

export class ElectronCoverRepository implements CoverRepository {
  async download(url: string, fileName: string): Promise<string> {
    return window.electronAPI.downloadCover(url, fileName);
  }

  async delete(coverPath: string): Promise<void> {
    return window.electronAPI.deleteCover(coverPath);
  }
}
