export interface BuildResult {
  success: boolean;
  message: string;
}

export async function buildSite(useSampleData: boolean = false): Promise<BuildResult> {
  return window.electronAPI.buildSite(useSampleData);
}

export async function getSitePath(): Promise<string> {
  return window.electronAPI.getSitePath();
}

export async function getDistPath(): Promise<string> {
  return window.electronAPI.getDistPath();
}

export async function openDistFolder(): Promise<void> {
  const distPath = await getDistPath();
  await window.electronAPI.openInFileExplorer(distPath);
}
