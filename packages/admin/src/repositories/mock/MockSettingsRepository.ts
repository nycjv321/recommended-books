import type { AppSettings } from '@/types';
import type { SettingsRepository, SiteValidation } from '../interfaces';

export class MockSettingsRepository implements SettingsRepository {
  private settings: AppSettings = {
    libraryPath: '/mock/site',
  };

  private validPaths: Set<string> = new Set(['/mock/site']);
  private selectedPath: string | null = null;

  setSettings(settings: AppSettings): void {
    this.settings = { ...settings };
  }

  setValidPaths(paths: string[]): void {
    this.validPaths = new Set(paths);
  }

  setSelectedPath(path: string | null): void {
    this.selectedPath = path;
  }

  async get(): Promise<AppSettings> {
    return { ...this.settings };
  }

  async save(settings: AppSettings): Promise<void> {
    this.settings = { ...settings };
  }

  async selectSitePath(): Promise<string | null> {
    return this.selectedPath;
  }

  async validateSitePath(path: string): Promise<SiteValidation> {
    const isValid = this.validPaths.has(path);
    return {
      isValid,
      hasTemplateFiles: isValid,
      hasConfig: isValid,
      hasBooks: isValid,
      missingFiles: isValid ? [] : ['index.html', 'app.js', 'styles-*.css'],
    };
  }

  async initializeSiteData(_path: string): Promise<{ success: boolean }> {
    return { success: true };
  }
}
