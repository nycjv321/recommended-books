import type { AppSettings } from '@/types';
import type { SettingsRepository, LibraryValidation } from '../interfaces';

export class ElectronSettingsRepository implements SettingsRepository {
  async get(): Promise<AppSettings> {
    return window.electronAPI.getSettings();
  }

  async save(settings: AppSettings): Promise<void> {
    return window.electronAPI.saveSettings(settings);
  }

  async selectLibraryPath(): Promise<string | null> {
    return window.electronAPI.selectLibraryPath();
  }

  async validateLibraryPath(path: string): Promise<LibraryValidation> {
    return window.electronAPI.validateLibraryPath(path);
  }

  async initializeLibrary(path: string): Promise<{ success: boolean }> {
    return window.electronAPI.initializeLibrary(path);
  }
}
