export interface CoverRepository {
  download(url: string, fileName: string): Promise<string>;
  delete(coverPath: string): Promise<void>;
}
