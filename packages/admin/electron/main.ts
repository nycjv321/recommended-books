import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';

// Get the site path relative to the admin package
const SITE_PATH = path.join(__dirname, '..', '..', 'site');

function getSitePath(): string {
  return SITE_PATH;
}

function getBooksPath(): string {
  return path.join(SITE_PATH, 'books');
}

function getDistPath(): string {
  return path.join(SITE_PATH, 'dist');
}

function getConfigPath(): string {
  return path.join(SITE_PATH, 'config.json');
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
}

// Preview server instance
let previewServer: http.Server | null = null;

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
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
        books.push({
          ...book,
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

ipcMain.handle('get-book', async (_event, filePath: string): Promise<Book> => {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
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

  const filePath = path.join(shelfPath, fileName);
  fs.writeFileSync(filePath, JSON.stringify(book, null, 2) + '\n');

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
  const fullPath = path.join(SITE_PATH, coverPath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
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
    const distDir = getDistPath();
    const configPath = getConfigPath();
    const sourceDir = useSampleData
      ? path.join(SITE_PATH, 'books-sample')
      : path.join(SITE_PATH, 'books');

    // Load config
    const config: Config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    // Clean dist directory
    if (fs.existsSync(distDir)) {
      fs.rmSync(distDir, { recursive: true });
    }
    fs.mkdirSync(distDir, { recursive: true });

    // Static files to copy
    const staticFiles = ['styles-minimalist.css', 'app.js', 'favicon.svg'];

    for (const file of staticFiles) {
      const srcPath = path.join(SITE_PATH, file);
      const destPath = path.join(distDir, file);
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
      }
    }

    // Process index.html with placeholders
    const indexSrc = path.join(SITE_PATH, 'index.html');
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
    const samplePath = path.join(SITE_PATH, 'books-sample');
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
