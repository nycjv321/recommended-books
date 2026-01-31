import type { AppSettings } from '@/types';

export interface SiteValidation {
  isValid: boolean;
  hasTemplateFiles: boolean;
  hasConfig: boolean;
  hasBooks: boolean;
  missingFiles: string[];
}

export interface SettingsRepository {
  get(): Promise<AppSettings>;
  save(settings: AppSettings): Promise<void>;
  selectSitePath(): Promise<string | null>;
  validateSitePath(path: string): Promise<SiteValidation>;
  initializeSiteData(path: string): Promise<{ success: boolean }>;
}
