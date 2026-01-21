import type { Repositories } from '../interfaces';
import { MockBookRepository } from './MockBookRepository';
import { MockShelfRepository } from './MockShelfRepository';
import { MockConfigRepository } from './MockConfigRepository';
import { MockSettingsRepository } from './MockSettingsRepository';
import { MockCoverRepository } from './MockCoverRepository';
import { MockBuildRepository } from './MockBuildRepository';
import { MockOpenLibraryRepository } from './MockOpenLibraryRepository';
import { MockSampleDataRepository } from './MockSampleDataRepository';

export interface MockRepositories extends Repositories {
  books: MockBookRepository;
  shelves: MockShelfRepository;
  config: MockConfigRepository;
  settings: MockSettingsRepository;
  covers: MockCoverRepository;
  build: MockBuildRepository;
  openLibrary: MockOpenLibraryRepository;
  sampleData: MockSampleDataRepository;
}

export function createMockRepositories(): MockRepositories {
  return {
    books: new MockBookRepository(),
    shelves: new MockShelfRepository(),
    config: new MockConfigRepository(),
    settings: new MockSettingsRepository(),
    covers: new MockCoverRepository(),
    build: new MockBuildRepository(),
    openLibrary: new MockOpenLibraryRepository(),
    sampleData: new MockSampleDataRepository(),
  };
}

export { MockBookRepository } from './MockBookRepository';
export { MockShelfRepository } from './MockShelfRepository';
export { MockConfigRepository } from './MockConfigRepository';
export { MockSettingsRepository } from './MockSettingsRepository';
export { MockCoverRepository } from './MockCoverRepository';
export { MockBuildRepository } from './MockBuildRepository';
export { MockOpenLibraryRepository } from './MockOpenLibraryRepository';
export { MockSampleDataRepository } from './MockSampleDataRepository';
