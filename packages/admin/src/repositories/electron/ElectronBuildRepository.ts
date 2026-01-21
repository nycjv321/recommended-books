import type { BuildRepository, BuildResult, PreviewServer } from '../interfaces';

export class ElectronBuildRepository implements BuildRepository {
  async build(useSampleData?: boolean): Promise<BuildResult> {
    return window.electronAPI.buildSite(useSampleData);
  }

  async startPreviewServer(): Promise<PreviewServer> {
    return window.electronAPI.startPreviewServer();
  }

  async stopPreviewServer(): Promise<void> {
    return window.electronAPI.stopPreviewServer();
  }

  async getSitePath(): Promise<string> {
    return window.electronAPI.getSitePath();
  }

  async getDistPath(): Promise<string> {
    return window.electronAPI.getDistPath();
  }

  async openInBrowser(url: string): Promise<void> {
    return window.electronAPI.openInBrowser(url);
  }

  async openInFileExplorer(path: string): Promise<void> {
    return window.electronAPI.openInFileExplorer(path);
  }
}
