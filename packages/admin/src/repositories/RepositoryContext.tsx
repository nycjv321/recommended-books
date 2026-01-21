import { createContext, useContext, type ReactNode } from 'react';
import type {
  Repositories,
  BookRepository,
  ShelfRepository,
  ConfigRepository,
  SettingsRepository,
  CoverRepository,
  BuildRepository,
  OpenLibraryRepository,
  SampleDataRepository,
} from './interfaces';

const RepositoryContext = createContext<Repositories | null>(null);

interface RepositoryProviderProps {
  repositories: Repositories;
  children: ReactNode;
}

export function RepositoryProvider({ repositories, children }: RepositoryProviderProps) {
  return (
    <RepositoryContext.Provider value={repositories}>
      {children}
    </RepositoryContext.Provider>
  );
}

function useRepositories(): Repositories {
  const context = useContext(RepositoryContext);
  if (!context) {
    throw new Error('useRepositories must be used within a RepositoryProvider');
  }
  return context;
}

export function useBookRepository(): BookRepository {
  return useRepositories().books;
}

export function useShelfRepository(): ShelfRepository {
  return useRepositories().shelves;
}

export function useConfigRepository(): ConfigRepository {
  return useRepositories().config;
}

export function useSettingsRepository(): SettingsRepository {
  return useRepositories().settings;
}

export function useCoverRepository(): CoverRepository {
  return useRepositories().covers;
}

export function useBuildRepository(): BuildRepository {
  return useRepositories().build;
}

export function useOpenLibraryRepository(): OpenLibraryRepository {
  return useRepositories().openLibrary;
}

export function useSampleDataRepository(): SampleDataRepository {
  return useRepositories().sampleData;
}
