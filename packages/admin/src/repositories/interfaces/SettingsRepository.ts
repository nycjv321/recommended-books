import type { AppSettings } from '@/types';

export interface LibraryValidation {
  isValid: boolean;
  isEmpty: boolean;
}

export interface SettingsRepository {
  get(): Promise<AppSettings>;
  save(settings: AppSettings): Promise<void>;
  selectLibraryPath(): Promise<string | null>;
  validateLibraryPath(path: string): Promise<LibraryValidation>;
  initializeLibrary(path: string): Promise<{ success: boolean }>;
}
