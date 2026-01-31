import type { AppSettings } from '@/types';
import type { SettingsRepository, SiteValidation, TemplateUpdateInfo } from '../interfaces';

export class MockSettingsRepository implements SettingsRepository {
  private settings: AppSettings = {
    libraryPath: '/mock/site',
  };

  private validPaths: Set<string> = new Set(['/mock/site']);
  private selectedPath: string | null = null;
  private templateUpdateInfo: TemplateUpdateInfo = {
    hasUpdate: false,
    currentVersion: '1.0.0',
    latestVersion: '1.0.0',
  };

  setSettings(settings: AppSettings): void {
    this.settings = { ...settings };
  }

  setValidPaths(paths: string[]): void {
    this.validPaths = new Set(paths);
  }

  setSelectedPath(path: string | null): void {
    this.selectedPath = path;
  }

  setTemplateUpdateInfo(info: TemplateUpdateInfo): void {
    this.templateUpdateInfo = { ...info };
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

  async createNewSite(path: string): Promise<{ success: boolean }> {
    this.validPaths.add(path);
    return { success: true };
  }

  async checkTemplateUpdates(_sitePath: string): Promise<TemplateUpdateInfo> {
    return { ...this.templateUpdateInfo };
  }

  async updateSiteTemplate(_sitePath: string): Promise<{ success: boolean }> {
    this.templateUpdateInfo = {
      ...this.templateUpdateInfo,
      hasUpdate: false,
      currentVersion: this.templateUpdateInfo.latestVersion,
    };
    return { success: true };
  }
}
