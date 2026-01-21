import type { BuildRepository, BuildResult, PreviewServer } from '../interfaces';

export class MockBuildRepository implements BuildRepository {
  private buildResult: BuildResult = { success: true, message: 'Built successfully' };
  private serverRunning = false;
  private sitePath = '/mock/site';
  private distPath = '/mock/site/dist';

  setBuildResult(result: BuildResult): void {
    this.buildResult = result;
  }

  setSitePath(path: string): void {
    this.sitePath = path;
  }

  setDistPath(path: string): void {
    this.distPath = path;
  }

  async build(_useSampleData?: boolean): Promise<BuildResult> {
    return this.buildResult;
  }

  async startPreviewServer(): Promise<PreviewServer> {
    this.serverRunning = true;
    return { port: 8080, url: 'http://localhost:8080' };
  }

  async stopPreviewServer(): Promise<void> {
    this.serverRunning = false;
  }

  async getSitePath(): Promise<string> {
    return this.sitePath;
  }

  async getDistPath(): Promise<string> {
    return this.distPath;
  }

  async openInBrowser(_url: string): Promise<void> {
    // No-op in mock
  }

  async openInFileExplorer(_path: string): Promise<void> {
    // No-op in mock
  }

  isServerRunning(): boolean {
    return this.serverRunning;
  }
}
