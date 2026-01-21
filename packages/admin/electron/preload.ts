import { contextBridge, ipcRenderer } from 'electron';

// Type definitions for IPC communication
interface Config {
  siteTitle: string;
  siteSubtitle: string;
  footerText: string;
  shelves: Shelf[];
}

interface Shelf {
  id: string;
  label: string;
  folder: string;
}

interface Book {
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

interface BookWithMeta extends Book {
  filePath: string;
  fileName: string;
  shelfId: string;
  shelfLabel: string;
}

interface OpenLibrarySearchResult {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  number_of_pages_median?: number;
  cover_i?: number;
  subject?: string[];
}

interface AppSettings {
  libraryPath: string | null;
}

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Config operations
  getConfig: (): Promise<Config> =>
    ipcRenderer.invoke('get-config'),

  saveConfig: (config: Config): Promise<void> =>
    ipcRenderer.invoke('save-config', config),

  // Book operations
  getBooks: (): Promise<BookWithMeta[]> =>
    ipcRenderer.invoke('get-books'),

  getBook: (filePath: string): Promise<Book> =>
    ipcRenderer.invoke('get-book', filePath),

  saveBook: (shelfId: string, fileName: string, book: Book): Promise<string> =>
    ipcRenderer.invoke('save-book', shelfId, fileName, book),

  deleteBook: (filePath: string): Promise<void> =>
    ipcRenderer.invoke('delete-book', filePath),

  moveBook: (filePath: string, targetShelfId: string): Promise<string> =>
    ipcRenderer.invoke('move-book', filePath, targetShelfId),

  // Shelf operations
  createShelf: (shelf: Shelf): Promise<void> =>
    ipcRenderer.invoke('create-shelf', shelf),

  deleteShelf: (shelfId: string): Promise<void> =>
    ipcRenderer.invoke('delete-shelf', shelfId),

  reorderShelves: (shelfIds: string[]): Promise<void> =>
    ipcRenderer.invoke('reorder-shelves', shelfIds),

  // Cover operations
  downloadCover: (url: string, fileName: string): Promise<string> =>
    ipcRenderer.invoke('download-cover', url, fileName),

  deleteCover: (coverPath: string): Promise<void> =>
    ipcRenderer.invoke('delete-cover', coverPath),

  // Open Library
  searchOpenLibrary: (query: string): Promise<OpenLibrarySearchResult[]> =>
    ipcRenderer.invoke('search-open-library', query),

  // Build & Preview
  buildSite: (useSampleData?: boolean): Promise<{ success: boolean; message: string }> =>
    ipcRenderer.invoke('build-site', useSampleData),

  startPreviewServer: (): Promise<{ port: number; url: string }> =>
    ipcRenderer.invoke('start-preview-server'),

  stopPreviewServer: (): Promise<void> =>
    ipcRenderer.invoke('stop-preview-server'),

  openInBrowser: (url: string): Promise<void> =>
    ipcRenderer.invoke('open-in-browser', url),

  openInFileExplorer: (path: string): Promise<void> =>
    ipcRenderer.invoke('open-in-file-explorer', path),

  // App paths
  getSitePath: (): Promise<string> =>
    ipcRenderer.invoke('get-site-path'),

  getDistPath: (): Promise<string> =>
    ipcRenderer.invoke('get-dist-path'),

  // Sample data
  checkExistingBooks: (): Promise<{ count: number }> =>
    ipcRenderer.invoke('check-existing-books'),

  loadSampleData: (): Promise<{ success: boolean; message: string; booksLoaded: number }> =>
    ipcRenderer.invoke('load-sample-data'),

  removeSampleData: (): Promise<{ success: boolean; message: string; booksRemoved: number }> =>
    ipcRenderer.invoke('remove-sample-data'),

  // App settings
  getSettings: (): Promise<AppSettings> =>
    ipcRenderer.invoke('get-settings'),

  saveSettings: (settings: AppSettings): Promise<void> =>
    ipcRenderer.invoke('save-settings', settings),

  selectLibraryPath: (): Promise<string | null> =>
    ipcRenderer.invoke('select-library-path'),

  validateLibraryPath: (libraryPath: string): Promise<{ isValid: boolean; isEmpty: boolean }> =>
    ipcRenderer.invoke('validate-library-path', libraryPath),

  initializeLibrary: (libraryPath: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('initialize-library', libraryPath),
});
