import type { Repositories } from '../interfaces';
import { ElectronBookRepository } from './ElectronBookRepository';
import { ElectronShelfRepository } from './ElectronShelfRepository';
import { ElectronConfigRepository } from './ElectronConfigRepository';
import { ElectronSettingsRepository } from './ElectronSettingsRepository';
import { ElectronCoverRepository } from './ElectronCoverRepository';
import { ElectronBuildRepository } from './ElectronBuildRepository';
import { ElectronOpenLibraryRepository } from './ElectronOpenLibraryRepository';
import { ElectronSampleDataRepository } from './ElectronSampleDataRepository';

export function createElectronRepositories(): Repositories {
  return {
    books: new ElectronBookRepository(),
    shelves: new ElectronShelfRepository(),
    config: new ElectronConfigRepository(),
    settings: new ElectronSettingsRepository(),
    covers: new ElectronCoverRepository(),
    build: new ElectronBuildRepository(),
    openLibrary: new ElectronOpenLibraryRepository(),
    sampleData: new ElectronSampleDataRepository(),
  };
}

export { ElectronBookRepository } from './ElectronBookRepository';
export { ElectronShelfRepository } from './ElectronShelfRepository';
export { ElectronConfigRepository } from './ElectronConfigRepository';
export { ElectronSettingsRepository } from './ElectronSettingsRepository';
export { ElectronCoverRepository } from './ElectronCoverRepository';
export { ElectronBuildRepository } from './ElectronBuildRepository';
export { ElectronOpenLibraryRepository } from './ElectronOpenLibraryRepository';
export { ElectronSampleDataRepository } from './ElectronSampleDataRepository';
