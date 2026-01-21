import type { Config } from '@/types';
import type { ConfigRepository } from '../interfaces';

export class MockConfigRepository implements ConfigRepository {
  private config: Config = {
    siteTitle: 'Mock Site',
    siteSubtitle: 'Mock Subtitle',
    footerText: 'Mock Footer',
    shelves: [],
  };

  setConfig(config: Config): void {
    this.config = { ...config };
  }

  async get(): Promise<Config> {
    return { ...this.config };
  }

  async save(config: Config): Promise<void> {
    this.config = { ...config };
  }
}
