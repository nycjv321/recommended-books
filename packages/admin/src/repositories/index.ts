// Interfaces
export type {
  Repositories,
  BookRepository,
  ShelfRepository,
  ConfigRepository,
  SettingsRepository,
  LibraryValidation,
  CoverRepository,
  BuildRepository,
  BuildResult,
  PreviewServer,
  OpenLibraryRepository,
  SampleDataRepository,
  SampleDataResult,
} from './interfaces';

// Electron implementations
export { createElectronRepositories } from './electron';

// Mock implementations (for testing)
export { createMockRepositories, type MockRepositories } from './mock';

// React context and hooks
export {
  RepositoryProvider,
  useBookRepository,
  useShelfRepository,
  useConfigRepository,
  useSettingsRepository,
  useCoverRepository,
  useBuildRepository,
  useOpenLibraryRepository,
  useSampleDataRepository,
} from './RepositoryContext';
