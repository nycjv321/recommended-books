export interface PreviewServerInfo {
  port: number;
  url: string;
}

export async function startPreviewServer(): Promise<PreviewServerInfo> {
  return window.electronAPI.startPreviewServer();
}

export async function stopPreviewServer(): Promise<void> {
  return window.electronAPI.stopPreviewServer();
}

export async function openInBrowser(url: string): Promise<void> {
  return window.electronAPI.openInBrowser(url);
}
