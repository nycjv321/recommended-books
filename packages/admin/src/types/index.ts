// Book types
export interface Book {
  title: string;
  author: string;
  category: string;
  publishDate: string;
  pages?: number;
  cover?: string;
  coverLocal?: string;
  notes?: string;
  link?: string;
  clickBehavior: 'overlay' | 'redirect';
}

export interface BookWithMeta extends Book {
  filePath: string;
  fileName: string;
  shelfId: string;
  shelfLabel: string;
}

// Shelf types
export interface Shelf {
  id: string;
  label: string;
  folder: string;
}

// Site configuration
export interface Config {
  siteTitle: string;
  siteSubtitle: string;
  footerText: string;
  shelves: Shelf[];
}

// Open Library API types
export interface OpenLibrarySearchResult {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  number_of_pages_median?: number;
  cover_i?: number;
  subject?: string[];
}

export interface OpenLibrarySearchResponse {
  numFound: number;
  start: number;
  docs: OpenLibrarySearchResult[];
}

// IPC types for Electron
export interface ElectronAPI {
  // Config operations
  getConfig: () => Promise<Config>;
  saveConfig: (config: Config) => Promise<void>;

  // Book operations
  getBooks: () => Promise<BookWithMeta[]>;
  getBook: (filePath: string) => Promise<Book>;
  saveBook: (shelfId: string, fileName: string, book: Book) => Promise<string>;
  deleteBook: (filePath: string) => Promise<void>;
  moveBook: (filePath: string, targetShelfId: string) => Promise<string>;

  // Shelf operations
  createShelf: (shelf: Shelf) => Promise<void>;
  deleteShelf: (shelfId: string) => Promise<void>;
  reorderShelves: (shelfIds: string[]) => Promise<void>;

  // Cover operations
  downloadCover: (url: string, fileName: string) => Promise<string>;
  deleteCover: (coverPath: string) => Promise<void>;

  // Open Library
  searchOpenLibrary: (query: string) => Promise<OpenLibrarySearchResult[]>;

  // Build & Preview
  buildSite: (useSampleData?: boolean) => Promise<{ success: boolean; message: string }>;
  startPreviewServer: () => Promise<{ port: number; url: string }>;
  stopPreviewServer: () => Promise<void>;
  openInBrowser: (url: string) => Promise<void>;
  openInFileExplorer: (path: string) => Promise<void>;

  // App paths
  getSitePath: () => Promise<string>;
  getDistPath: () => Promise<string>;

  // Sample data
  checkExistingBooks: () => Promise<{ count: number }>;
  loadSampleData: () => Promise<{ success: boolean; message: string; booksLoaded: number }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
