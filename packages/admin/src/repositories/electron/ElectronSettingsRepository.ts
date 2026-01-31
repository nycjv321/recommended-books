import type { AppSettings } from '@/types';
import type { SettingsRepository, SiteValidation } from '../interfaces';

export class ElectronSettingsRepository implements SettingsRepository {
  async get(): Promise<AppSettings> {
    return window.electronAPI.getSettings();
  }

  async save(settings: AppSettings): Promise<void> {
    return window.electronAPI.saveSettings(settings);
  }

  async selectSitePath(): Promise<string | null> {
    return window.electronAPI.selectLibraryPath();
  }

  async validateSitePath(path: string): Promise<SiteValidation> {
    return window.electronAPI.validateLibraryPath(path);
  }

  async initializeSiteData(path: string): Promise<{ success: boolean }> {
    return window.electronAPI.initializeLibrary(path);
  }
}
