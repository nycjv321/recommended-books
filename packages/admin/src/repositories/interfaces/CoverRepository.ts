export interface DownloadAllCoversResult {
  success: boolean;
  downloaded: number;
  skipped: number;
  failed: number;
  errors: string[];
}

export interface CoverRepository {
  download(url: string, fileName: string): Promise<string>;
  delete(coverPath: string): Promise<void>;
  downloadAll(): Promise<DownloadAllCoversResult>;
}
