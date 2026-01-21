export interface BuildResult {
  success: boolean;
  message: string;
}

export interface PreviewServer {
  port: number;
  url: string;
}

export interface BuildRepository {
  build(useSampleData?: boolean): Promise<BuildResult>;
  startPreviewServer(): Promise<PreviewServer>;
  stopPreviewServer(): Promise<void>;
  getSitePath(): Promise<string>;
  getDistPath(): Promise<string>;
  openInBrowser(url: string): Promise<void>;
  openInFileExplorer(path: string): Promise<void>;
}
