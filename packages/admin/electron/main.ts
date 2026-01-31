import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';

// ============================================
// App Settings (stored in userData, separate from library)
// ============================================

interface AppSettings {
  libraryPath: string | null;
}

function getSettingsPath(): string {
  return path.join(app.getPath('userData'), 'settings.json');
}

function loadSettings(): AppSettings {
  const settingsPath = getSettingsPath();
  if (fs.existsSync(settingsPath)) {
    try {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    } catch {
      // Return defaults if settings file is corrupted
    }
  }
  return { libraryPath: null };
}

function saveSettings(settings: AppSettings): void {
  const settingsPath = getSettingsPath();
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

// ============================================
// Bundled Template Path Functions
// ============================================

function getBundledTemplatePath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'site-template');
  }
  // Dev mode: use packages/site directly
  return path.join(__dirname, '../../site');
}

interface TemplateVersion {
  version: string;
  updatedAt: string;
}

function getTemplateVersion(templatePath: string): string | null {
  const versionFile = path.join(templatePath, 'template-version.json');
  if (fs.existsSync(versionFile)) {
    try {
      const data: TemplateVersion = JSON.parse(fs.readFileSync(versionFile, 'utf-8'));
      return data.version;
    } catch {
      return null;
    }
  }
  return null;
}

function compareVersions(a: string, b: string): number {
  // Simple semver comparison: returns 1 if a > b, -1 if a < b, 0 if equal
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((partsA[i] || 0) > (partsB[i] || 0)) return 1;
    if ((partsA[i] || 0) < (partsB[i] || 0)) return -1;
  }
  return 0;
}

// ============================================
// Dynamic Path Functions (use configured site path)
// ============================================

function getSitePath(): string {
  const settings = loadSettings();
  if (!settings.libraryPath) {
    throw new Error('Site path not configured');
  }
  return settings.libraryPath;
}

function getBooksPath(): string {
  return path.join(getSitePath(), 'books');
}

function getDistPath(): string {
  return path.join(getSitePath(), 'dist');
}

function getConfigPath(): string {
  return path.join(getSitePath(), 'config.json');
}

// Types (duplicated from renderer for main process use)
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
  coverLocalResolved?: string;
}

// Preview server instance
let previewServer: http.Server | null = null;

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 },
  });

  // Load the Vite dev server in development or the built files in production
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Stop preview server if running
  if (previewServer) {
    previewServer.close();
    previewServer = null;
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ============================================
// Config IPC Handlers
// ============================================

ipcMain.handle('get-config', async (): Promise<Config> => {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    throw new Error('config.json not found');
  }
  const content = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(content);
});

ipcMain.handle('save-config', async (_event, config: Config): Promise<void> => {
  const configPath = getConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
});

// ============================================
// Book IPC Handlers
// ============================================

ipcMain.handle('get-books', async (): Promise<BookWithMeta[]> => {
  const configPath = getConfigPath();
  const config: Config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const booksPath = getBooksPath();
  const books: BookWithMeta[] = [];

  for (const shelf of config.shelves) {
    const shelfPath = path.join(booksPath, shelf.folder);

    if (!fs.existsSync(shelfPath)) {
      continue;
    }

    const files = fs.readdirSync(shelfPath).filter(f => f.endsWith('.json'));

    for (const fileName of files) {
      const filePath = path.join(shelfPath, fileName);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const book: Book = JSON.parse(content);

        // Resolve coverLocal to base64 data URL for Electron display
        let coverLocalResolved: string | undefined;
        if (book.coverLocal) {
          const absoluteCoverPath = path.join(booksPath, book.coverLocal);
          if (fs.existsSync(absoluteCoverPath)) {
            try {
              const imageData = fs.readFileSync(absoluteCoverPath);
              const base64 = imageData.toString('base64');
              const ext = path.extname(absoluteCoverPath).toLowerCase();
              const mimeTypes: Record<string, string> = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
              };
              const mimeType = mimeTypes[ext] || 'image/jpeg';
              coverLocalResolved = `data:${mimeType};base64,${base64}`;
            } catch {
              // Keep undefined if read fails
            }
          }
        }

        books.push({
          ...book,
          coverLocalResolved,
          filePath,
          fileName,
          shelfId: shelf.id,
          shelfLabel: shelf.label,
        });
      } catch (e) {
        console.error(`Error reading book file ${filePath}:`, e);
      }
    }
  }

  return books;
});

ipcMain.handle('get-book', async (_event, filePath: string): Promise<Book & { coverLocalResolved?: string }> => {
  const content = fs.readFileSync(filePath, 'utf-8');
  const book: Book = JSON.parse(content);

  // Resolve coverLocal to base64 data URL for Electron display
  let coverLocalResolved: string | undefined;
  if (book.coverLocal) {
    const booksPath = getBooksPath();
    const absoluteCoverPath = path.join(booksPath, book.coverLocal);
    if (fs.existsSync(absoluteCoverPath)) {
      try {
        const imageData = fs.readFileSync(absoluteCoverPath);
        const base64 = imageData.toString('base64');
        const ext = path.extname(absoluteCoverPath).toLowerCase();
        const mimeTypes: Record<string, string> = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.webp': 'image/webp',
        };
        const mimeType = mimeTypes[ext] || 'image/jpeg';
        coverLocalResolved = `data:${mimeType};base64,${base64}`;
      } catch {
        // Keep undefined if read fails
      }
    }
  }

  return { ...book, coverLocalResolved };
});

ipcMain.handle('save-book', async (_event, shelfId: string, fileName: string, book: Book): Promise<string> => {
  const config: Config = JSON.parse(fs.readFileSync(getConfigPath(), 'utf-8'));
  const shelf = config.shelves.find(s => s.id === shelfId);

  if (!shelf) {
    throw new Error(`Shelf with id "${shelfId}" not found`);
  }

  const shelfPath = path.join(getBooksPath(), shelf.folder);

  // Ensure shelf directory exists
  if (!fs.existsSync(shelfPath)) {
    fs.mkdirSync(shelfPath, { recursive: true });
  }

  // Remove coverLocalResolved before saving (it's a runtime-only field)
  const { coverLocalResolved, ...bookToSave } = book as Book & { coverLocalResolved?: string };

  const filePath = path.join(shelfPath, fileName);
  fs.writeFileSync(filePath, JSON.stringify(bookToSave, null, 2) + '\n');

  return filePath;
});

ipcMain.handle('delete-book', async (_event, filePath: string): Promise<void> => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
});

ipcMain.handle('move-book', async (_event, filePath: string, targetShelfId: string): Promise<string> => {
  const config: Config = JSON.parse(fs.readFileSync(getConfigPath(), 'utf-8'));
  const targetShelf = config.shelves.find(s => s.id === targetShelfId);

  if (!targetShelf) {
    throw new Error(`Target shelf with id "${targetShelfId}" not found`);
  }

  const fileName = path.basename(filePath);
  const targetDir = path.join(getBooksPath(), targetShelf.folder);
  const targetPath = path.join(targetDir, fileName);

  // Ensure target directory exists
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.renameSync(filePath, targetPath);
  return targetPath;
});

// ============================================
// Shelf IPC Handlers
// ============================================

ipcMain.handle('create-shelf', async (_event, shelf: Shelf): Promise<void> => {
  const shelfPath = path.join(getBooksPath(), shelf.folder);
  if (!fs.existsSync(shelfPath)) {
    fs.mkdirSync(shelfPath, { recursive: true });
  }
});

ipcMain.handle('delete-shelf', async (_event, shelfId: string): Promise<void> => {
  const config: Config = JSON.parse(fs.readFileSync(getConfigPath(), 'utf-8'));
  const shelf = config.shelves.find(s => s.id === shelfId);

  if (!shelf) {
    throw new Error(`Shelf with id "${shelfId}" not found`);
  }

  const shelfPath = path.join(getBooksPath(), shelf.folder);

  // Check if shelf is empty
  if (fs.existsSync(shelfPath)) {
    const files = fs.readdirSync(shelfPath).filter(f => f.endsWith('.json'));
    if (files.length > 0) {
      throw new Error(`Cannot delete shelf "${shelf.label}" - it contains ${files.length} book(s)`);
    }
    fs.rmdirSync(shelfPath);
  }
});

ipcMain.handle('reorder-shelves', async (_event, _shelfIds: string[]): Promise<void> => {
  // Shelf order is managed in config.json, no file system changes needed
});

// ============================================
// Cover IPC Handlers
// ============================================

ipcMain.handle('download-cover', async (_event, url: string, fileName: string): Promise<string> => {
  const coversDir = path.join(getBooksPath(), 'covers');

  if (!fs.existsSync(coversDir)) {
    fs.mkdirSync(coversDir, { recursive: true });
  }

  const filePath = path.join(coversDir, fileName);

  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        // Follow redirect
        const redirectUrl = response.headers.location;
        ipcMain.emit('download-cover', null, redirectUrl, fileName);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download cover: HTTP ${response.statusCode}`));
        return;
      }

      const file = fs.createWriteStream(filePath);
      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve(`books/covers/${fileName}`);
      });
    });

    request.on('error', reject);
  });
});

ipcMain.handle('delete-cover', async (_event, coverPath: string): Promise<void> => {
  const fullPath = path.join(getSitePath(), coverPath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
});

// Helper function to download a file and follow redirects
function downloadFile(url: string, filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        downloadFile(response.headers.location, filePath).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      const file = fs.createWriteStream(filePath);
      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });

      file.on('error', (err) => {
        fs.unlinkSync(filePath);
        reject(err);
      });
    });

    request.on('error', reject);
  });
}

// Generate a safe filename from a URL
function generateCoverFileName(url: string, bookTitle: string): string {
  // Try to get extension from URL
  const urlPath = new URL(url).pathname;
  let ext = path.extname(urlPath).toLowerCase();

  // Default to .jpg if no extension or unrecognized
  if (!['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
    ext = '.jpg';
  }

  // Create safe filename from book title
  const safeTitle = bookTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);

  return `${safeTitle}${ext}`;
}

ipcMain.handle('download-all-covers', async (): Promise<{
  success: boolean;
  downloaded: number;
  skipped: number;
  failed: number;
  errors: string[];
}> => {
  const configPath = getConfigPath();
  const config: Config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const booksPath = getBooksPath();
  const coversDir = path.join(booksPath, 'covers');

  // Ensure covers directory exists
  if (!fs.existsSync(coversDir)) {
    fs.mkdirSync(coversDir, { recursive: true });
  }

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const shelf of config.shelves) {
    const shelfPath = path.join(booksPath, shelf.folder);

    if (!fs.existsSync(shelfPath)) {
      continue;
    }

    const files = fs.readdirSync(shelfPath).filter(f => f.endsWith('.json'));

    for (const fileName of files) {
      const filePath = path.join(shelfPath, fileName);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const book: Book = JSON.parse(content);

        // Skip if no remote cover URL
        if (!book.cover) {
          skipped++;
          continue;
        }

        // Skip if already has a local cover
        if (book.coverLocal) {
          const localCoverPath = path.join(booksPath, book.coverLocal);
          if (fs.existsSync(localCoverPath)) {
            skipped++;
            continue;
          }
        }

        // Generate filename and download
        const coverFileName = generateCoverFileName(book.cover, book.title);
        const coverFilePath = path.join(coversDir, coverFileName);

        // Check if file already exists (avoid duplicates)
        let finalFileName = coverFileName;
        let counter = 1;
        while (fs.existsSync(path.join(coversDir, finalFileName))) {
          const ext = path.extname(coverFileName);
          const base = path.basename(coverFileName, ext);
          finalFileName = `${base}-${counter}${ext}`;
          counter++;
        }

        const finalFilePath = path.join(coversDir, finalFileName);

        try {
          await downloadFile(book.cover, finalFilePath);

          // Update book with coverLocal
          book.coverLocal = `covers/${finalFileName}`;
          fs.writeFileSync(filePath, JSON.stringify(book, null, 2) + '\n');

          downloaded++;
        } catch (downloadErr) {
          failed++;
          errors.push(`${book.title}: ${downloadErr instanceof Error ? downloadErr.message : 'Download failed'}`);
        }
      } catch (e) {
        failed++;
        errors.push(`${fileName}: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    }
  }

  return {
    success: failed === 0,
    downloaded,
    skipped,
    failed,
    errors: errors.slice(0, 10) // Limit errors to first 10
  };
});

// ============================================
// Open Library IPC Handler
// ============================================

interface OpenLibrarySearchResult {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  number_of_pages_median?: number;
  cover_i?: number;
  subject?: string[];
}

ipcMain.handle('search-open-library', async (_event, query: string): Promise<OpenLibrarySearchResult[]> => {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://openlibrary.org/search.json?q=${encodedQuery}&limit=10`;

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result.docs || []);
        } catch (e) {
          reject(new Error('Failed to parse Open Library response'));
        }
      });
    }).on('error', reject);
  });
});

// ============================================
// Build IPC Handler
// ============================================

ipcMain.handle('build-site', async (_event, useSampleData: boolean = false): Promise<{ success: boolean; message: string }> => {
  try {
    const sitePath = getSitePath();
    const distDir = getDistPath();
    const configPath = getConfigPath();
    const sourceDir = useSampleData
      ? path.join(sitePath, 'books-sample')
      : path.join(sitePath, 'books');

    // Load config
    const config: Config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    // Clean dist directory
    if (fs.existsSync(distDir)) {
      fs.rmSync(distDir, { recursive: true });
    }
    fs.mkdirSync(distDir, { recursive: true });

    // Static files to copy (from site folder)
    const staticFiles = ['styles-minimalist.css', 'app.js', 'favicon.svg'];

    for (const file of staticFiles) {
      const srcPath = path.join(sitePath, file);
      const destPath = path.join(distDir, file);
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
      }
    }

    // Process index.html with placeholders (from site folder)
    const indexSrc = path.join(sitePath, 'index.html');
    if (fs.existsSync(indexSrc)) {
      let content = fs.readFileSync(indexSrc, 'utf-8');
      content = content
        .replace(/\{\{siteTitle\}\}/g, config.siteTitle)
        .replace(/\{\{siteSubtitle\}\}/g, config.siteSubtitle)
        .replace(/\{\{footerText\}\}/g, config.footerText);
      fs.writeFileSync(path.join(distDir, 'index.html'), content);
    }

    // Copy config.json
    fs.copyFileSync(configPath, path.join(distDir, 'config.json'));

    // Build books
    const distBooksDir = path.join(distDir, 'books');
    fs.mkdirSync(distBooksDir, { recursive: true });

    const bookFiles: string[] = [];

    for (const shelf of config.shelves) {
      const shelfSourcePath = path.join(sourceDir, shelf.folder);
      const shelfDistPath = path.join(distBooksDir, shelf.folder);

      if (!fs.existsSync(shelfSourcePath)) {
        continue;
      }

      fs.mkdirSync(shelfDistPath, { recursive: true });

      const files = fs.readdirSync(shelfSourcePath).filter(f => f.endsWith('.json'));

      for (const file of files) {
        fs.copyFileSync(
          path.join(shelfSourcePath, file),
          path.join(shelfDistPath, file)
        );
        bookFiles.push(`${shelf.folder}/${file}`);
      }
    }

    // Write index.json
    fs.writeFileSync(
      path.join(distBooksDir, 'index.json'),
      JSON.stringify(bookFiles, null, 4) + '\n'
    );

    // Copy covers if they exist
    const coversDir = path.join(sourceDir, 'covers');
    if (fs.existsSync(coversDir)) {
      const destCoversDir = path.join(distBooksDir, 'covers');
      fs.mkdirSync(destCoversDir, { recursive: true });
      const coverFiles = fs.readdirSync(coversDir).filter(f => !f.startsWith('.'));
      for (const file of coverFiles) {
        fs.copyFileSync(
          path.join(coversDir, file),
          path.join(destCoversDir, file)
        );
      }
    }

    return {
      success: true,
      message: `Built ${bookFiles.length} books to dist/`
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

// ============================================
// Preview Server IPC Handlers
// ============================================

ipcMain.handle('start-preview-server', async (): Promise<{ port: number; url: string }> => {
  // Stop existing server if running
  if (previewServer) {
    previewServer.close();
    previewServer = null;
  }

  const distDir = getDistPath();

  if (!fs.existsSync(distDir)) {
    throw new Error('dist/ directory not found. Build the site first.');
  }

  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(distDir, req.url === '/' ? 'index.html' : req.url || '');

      // Security: prevent directory traversal
      if (!filePath.startsWith(distDir)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      // Get file extension for content type
      const ext = path.extname(filePath).toLowerCase();
      const contentTypes: Record<string, string> = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
      };

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }

        res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });

    server.on('error', (err) => {
      reject(err);
    });

    // Try to find an available port starting from 8080
    const tryPort = (port: number) => {
      server.listen(port, '127.0.0.1', () => {
        previewServer = server;
        const url = `http://127.0.0.1:${port}`;
        resolve({ port, url });
      });

      server.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE' && port < 8100) {
          server.close();
          tryPort(port + 1);
        } else {
          reject(err);
        }
      });
    };

    tryPort(8080);
  });
});

ipcMain.handle('stop-preview-server', async (): Promise<void> => {
  if (previewServer) {
    previewServer.close();
    previewServer = null;
  }
});

// ============================================
// Utility IPC Handlers
// ============================================

ipcMain.handle('open-in-browser', async (_event, url: string): Promise<void> => {
  await shell.openExternal(url);
});

ipcMain.handle('open-in-file-explorer', async (_event, filePath: string): Promise<void> => {
  await shell.openPath(filePath);
});

ipcMain.handle('get-site-path', async (): Promise<string> => {
  return getSitePath();
});

ipcMain.handle('get-dist-path', async (): Promise<string> => {
  return getDistPath();
});

// ============================================
// App Settings IPC Handlers
// ============================================

ipcMain.handle('get-settings', async (): Promise<AppSettings> => {
  return loadSettings();
});

ipcMain.handle('save-settings', async (_event, settings: AppSettings): Promise<void> => {
  saveSettings(settings);
});

ipcMain.handle('select-library-path', async (): Promise<string | null> => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Select Site Folder'
  });
  return result.canceled ? null : result.filePaths[0];
});

interface SiteValidation {
  isValid: boolean;
  hasTemplateFiles: boolean;
  hasConfig: boolean;
  hasBooks: boolean;
  missingFiles: string[];
}

ipcMain.handle('validate-library-path', async (_event, sitePath: string): Promise<SiteValidation> => {
  const requiredTemplateFiles = ['index.html', 'app.js'];
  const missingFiles: string[] = [];

  // Check for required template files
  for (const file of requiredTemplateFiles) {
    if (!fs.existsSync(path.join(sitePath, file))) {
      missingFiles.push(file);
    }
  }

  // Check for CSS file (styles-minimalist.css or similar)
  const files = fs.existsSync(sitePath) ? fs.readdirSync(sitePath) : [];
  const hasCss = files.some(f => f.startsWith('styles') && f.endsWith('.css'));
  if (!hasCss) {
    missingFiles.push('styles-*.css');
  }

  const hasTemplateFiles = missingFiles.length === 0;
  const hasConfig = fs.existsSync(path.join(sitePath, 'config.json'));
  const hasBooks = fs.existsSync(path.join(sitePath, 'books'));

  return {
    isValid: hasTemplateFiles,
    hasTemplateFiles,
    hasConfig,
    hasBooks,
    missingFiles
  };
});

ipcMain.handle('initialize-library', async (_event, sitePath: string): Promise<{ success: boolean }> => {
  const configPath = path.join(sitePath, 'config.json');
  const booksPath = path.join(sitePath, 'books');

  // Only create config.json if it doesn't exist
  if (!fs.existsSync(configPath)) {
    const defaultConfig = {
      siteTitle: 'My Reads',
      siteSubtitle: 'Personal book recommendations',
      footerText: '',
      shelves: []
    };
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
  }

  // Only create books directory if it doesn't exist
  if (!fs.existsSync(booksPath)) {
    fs.mkdirSync(booksPath, { recursive: true });
  }

  return { success: true };
});

// ============================================
// Sample Data IPC Handlers
// ============================================

ipcMain.handle('check-existing-books', async (): Promise<{ count: number }> => {
  const booksPath = getBooksPath();
  let count = 0;

  if (!fs.existsSync(booksPath)) {
    return { count: 0 };
  }

  // Count JSON files in all shelf subdirectories
  const entries = fs.readdirSync(booksPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name !== 'covers') {
      const shelfPath = path.join(booksPath, entry.name);
      const files = fs.readdirSync(shelfPath).filter(f => f.endsWith('.json'));
      count += files.length;
    }
  }

  return { count };
});

ipcMain.handle('load-sample-data', async (): Promise<{ success: boolean; message: string; booksLoaded: number }> => {
  try {
    const booksPath = getBooksPath();
    const samplePath = path.join(getSitePath(), 'books-sample');
    const configPath = getConfigPath();

    // Check if sample data exists
    if (!fs.existsSync(samplePath)) {
      return {
        success: false,
        message: 'Sample data folder (books-sample/) not found',
        booksLoaded: 0
      };
    }

    // Ensure books directory exists
    if (!fs.existsSync(booksPath)) {
      fs.mkdirSync(booksPath, { recursive: true });
    }

    let booksLoaded = 0;

    // Copy all shelf folders from books-sample to books
    const sampleEntries = fs.readdirSync(samplePath, { withFileTypes: true });
    for (const entry of sampleEntries) {
      if (entry.isDirectory()) {
        const sourceShelfPath = path.join(samplePath, entry.name);
        const targetShelfPath = path.join(booksPath, entry.name);

        // Create target shelf directory if it doesn't exist
        if (!fs.existsSync(targetShelfPath)) {
          fs.mkdirSync(targetShelfPath, { recursive: true });
        }

        // Copy all JSON files from this shelf
        const files = fs.readdirSync(sourceShelfPath).filter(f => f.endsWith('.json'));
        for (const file of files) {
          const sourcePath = path.join(sourceShelfPath, file);
          const targetPath = path.join(targetShelfPath, file);
          fs.copyFileSync(sourcePath, targetPath);
          booksLoaded++;
        }
      }
    }

    // Update config.json with sample shelves
    const config: Config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    config.shelves = [
      { id: 'top5', label: 'Top 5 Reads', folder: 'top-5-reads' },
      { id: 'good', label: 'Good Reads', folder: 'good-reads' },
      { id: 'current', label: 'Current Reads', folder: 'current-reads' },
      { id: 'future', label: 'Future Reads', folder: 'future-reads' }
    ];
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');

    return {
      success: true,
      message: `Loaded ${booksLoaded} sample books`,
      booksLoaded
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error loading sample data',
      booksLoaded: 0
    };
  }
});

ipcMain.handle('remove-sample-data', async (): Promise<{ success: boolean; message: string; booksRemoved: number }> => {
  try {
    const booksPath = getBooksPath();
    const samplePath = path.join(getSitePath(), 'books-sample');

    // Check if sample data folder exists
    if (!fs.existsSync(samplePath)) {
      return {
        success: false,
        message: 'Sample data folder (books-sample/) not found',
        booksRemoved: 0
      };
    }

    // Check if books folder exists
    if (!fs.existsSync(booksPath)) {
      return {
        success: true,
        message: 'No books folder found - nothing to remove',
        booksRemoved: 0
      };
    }

    let booksRemoved = 0;

    // Iterate through sample shelf folders
    const sampleEntries = fs.readdirSync(samplePath, { withFileTypes: true });
    for (const entry of sampleEntries) {
      if (entry.isDirectory()) {
        const sampleShelfPath = path.join(samplePath, entry.name);
        const booksShelfPath = path.join(booksPath, entry.name);

        // Skip if corresponding shelf doesn't exist in books/
        if (!fs.existsSync(booksShelfPath)) {
          continue;
        }

        // Get all JSON files in the sample shelf
        const sampleFiles = fs.readdirSync(sampleShelfPath).filter(f => f.endsWith('.json'));

        for (const file of sampleFiles) {
          const sampleFilePath = path.join(sampleShelfPath, file);
          const booksFilePath = path.join(booksShelfPath, file);

          // Skip if the file doesn't exist in books/
          if (!fs.existsSync(booksFilePath)) {
            continue;
          }

          // Compare file contents
          const sampleContent = fs.readFileSync(sampleFilePath, 'utf-8');
          const booksContent = fs.readFileSync(booksFilePath, 'utf-8');

          // If content is identical, it's unmodified sample data - remove it
          if (sampleContent === booksContent) {
            fs.unlinkSync(booksFilePath);
            booksRemoved++;
          }
        }

        // Remove empty shelf folder
        const remainingFiles = fs.readdirSync(booksShelfPath).filter(f => f.endsWith('.json'));
        if (remainingFiles.length === 0) {
          fs.rmdirSync(booksShelfPath);
        }
      }
    }

    return {
      success: true,
      message: booksRemoved > 0
        ? `Removed ${booksRemoved} sample book${booksRemoved === 1 ? '' : 's'}`
        : 'No unmodified sample books found to remove',
      booksRemoved
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error removing sample data',
      booksRemoved: 0
    };
  }
});

// ============================================
// Template Management IPC Handlers
// ============================================

ipcMain.handle('create-new-site', async (_event, targetPath: string): Promise<{ success: boolean }> => {
  const templatePath = getBundledTemplatePath();

  // Template files to copy (not user data)
  const templateFiles = ['index.html', 'app.js', 'styles-minimalist.css', 'favicon.svg', 'template-version.json'];

  for (const file of templateFiles) {
    const src = path.join(templatePath, file);
    const dest = path.join(targetPath, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  }

  // Copy scripts folder
  const scriptsDir = path.join(templatePath, 'scripts');
  if (fs.existsSync(scriptsDir)) {
    const destScriptsDir = path.join(targetPath, 'scripts');
    fs.mkdirSync(destScriptsDir, { recursive: true });
    for (const file of fs.readdirSync(scriptsDir)) {
      fs.copyFileSync(path.join(scriptsDir, file), path.join(destScriptsDir, file));
    }
  }

  // Initialize data files (config.json and books/)
  const configPath = path.join(targetPath, 'config.json');
  const booksPath = path.join(targetPath, 'books');

  if (!fs.existsSync(configPath)) {
    const defaultConfig = {
      siteTitle: 'My Reads',
      siteSubtitle: 'Personal book recommendations',
      footerText: '',
      shelves: []
    };
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
  }

  if (!fs.existsSync(booksPath)) {
    fs.mkdirSync(booksPath, { recursive: true });
  }

  // Create covers directory
  const coversPath = path.join(booksPath, 'covers');
  if (!fs.existsSync(coversPath)) {
    fs.mkdirSync(coversPath, { recursive: true });
  }

  return { success: true };
});

ipcMain.handle('check-template-updates', async (_event, sitePath: string): Promise<{
  hasUpdate: boolean;
  currentVersion: string | null;
  latestVersion: string | null;
}> => {
  const bundledVersion = getTemplateVersion(getBundledTemplatePath());
  const siteVersion = getTemplateVersion(sitePath);

  // If bundled has version but site doesn't, treat as update available
  // (site is from before versioning was introduced)
  let hasUpdate = false;
  if (bundledVersion) {
    if (!siteVersion) {
      // Site has no version file - it's older than versioning
      hasUpdate = true;
    } else {
      // Both have versions - compare them
      hasUpdate = compareVersions(bundledVersion, siteVersion) > 0;
    }
  }

  return { hasUpdate, currentVersion: siteVersion, latestVersion: bundledVersion };
});

ipcMain.handle('update-site-template', async (_event, sitePath: string): Promise<{ success: boolean }> => {
  const templatePath = getBundledTemplatePath();

  // Only update template files, never touch user data
  const templateFiles = ['index.html', 'app.js', 'styles-minimalist.css', 'favicon.svg', 'template-version.json'];

  for (const file of templateFiles) {
    const src = path.join(templatePath, file);
    const dest = path.join(sitePath, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  }

  // Update scripts folder
  const scriptsDir = path.join(templatePath, 'scripts');
  if (fs.existsSync(scriptsDir)) {
    const destScriptsDir = path.join(sitePath, 'scripts');
    fs.mkdirSync(destScriptsDir, { recursive: true });
    for (const file of fs.readdirSync(scriptsDir)) {
      fs.copyFileSync(path.join(scriptsDir, file), path.join(destScriptsDir, file));
    }
  }

  return { success: true };
});
