import type { Config } from '@/types';

export interface ConfigRepository {
  get(): Promise<Config>;
  save(config: Config): Promise<void>;
}
