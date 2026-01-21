import type { AppSettings } from '@/types';
import type { SettingsRepository, LibraryValidation } from '../interfaces';

export class MockSettingsRepository implements SettingsRepository {
  private settings: AppSettings = {
    libraryPath: '/mock/library',
  };

  private validPaths: Set<string> = new Set(['/mock/library']);
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

  async selectLibraryPath(): Promise<string | null> {
    return this.selectedPath;
  }

  async validateLibraryPath(path: string): Promise<LibraryValidation> {
    const isValid = this.validPaths.has(path);
    return { isValid, isEmpty: !isValid };
  }

  async initializeLibrary(_path: string): Promise<{ success: boolean }> {
    return { success: true };
  }
}
