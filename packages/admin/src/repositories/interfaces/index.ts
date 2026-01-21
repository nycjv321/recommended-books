import type { BookRepository } from './BookRepository';
import type { ShelfRepository } from './ShelfRepository';
import type { ConfigRepository } from './ConfigRepository';
import type { SettingsRepository } from './SettingsRepository';
import type { CoverRepository } from './CoverRepository';
import type { BuildRepository } from './BuildRepository';
import type { OpenLibraryRepository } from './OpenLibraryRepository';
import type { SampleDataRepository } from './SampleDataRepository';

export type { BookRepository } from './BookRepository';
export type { ShelfRepository } from './ShelfRepository';
export type { ConfigRepository } from './ConfigRepository';
export type { SettingsRepository, LibraryValidation } from './SettingsRepository';
export type { CoverRepository } from './CoverRepository';
export type { BuildRepository, BuildResult, PreviewServer } from './BuildRepository';
export type { OpenLibraryRepository } from './OpenLibraryRepository';
export type { SampleDataRepository, SampleDataResult } from './SampleDataRepository';

export interface Repositories {
  books: BookRepository;
  shelves: ShelfRepository;
  config: ConfigRepository;
  settings: SettingsRepository;
  covers: CoverRepository;
  build: BuildRepository;
  openLibrary: OpenLibraryRepository;
  sampleData: SampleDataRepository;
}
