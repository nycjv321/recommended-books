import type { Config } from '@/types';
import type { ConfigRepository } from '../interfaces';

export class ElectronConfigRepository implements ConfigRepository {
  async get(): Promise<Config> {
    return window.electronAPI.getConfig();
  }

  async save(config: Config): Promise<void> {
    return window.electronAPI.saveConfig(config);
  }
}
