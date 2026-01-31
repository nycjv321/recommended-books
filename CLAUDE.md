# Claude Code Instructions

This is a book recommendation website with an Electron admin app for management.

## Project Overview

- **Purpose**: Display personal book recommendations with a desktop admin UI
- **Stack**: Monorepo with npm workspaces
  - **Admin**: Electron + React + TypeScript + Vite
  - **Site**: Vanilla HTML/CSS/JS (static)
- **Hosting**: Static files only, no backend

## Project Structure

```
recommended-books/
├── packages/
│   ├── admin/                      # Electron admin app
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── electron/
│   │   │   ├── main.ts             # Electron main process, IPC handlers
│   │   │   └── preload.ts          # IPC bridge
│   │   └── src/
│   │       ├── main.tsx            # Entry point, RepositoryProvider setup
│   │       ├── App.tsx             # Root component with routing
│   │       ├── components/
│   │       │   ├── Dashboard.tsx
│   │       │   ├── BookList.tsx
│   │       │   ├── BookForm.tsx
│   │       │   ├── ShelfManager.tsx
│   │       │   ├── ConfigEditor.tsx
│   │       │   ├── Preview.tsx
│   │       │   └── SetupWizard.tsx # First-run site folder setup
│   │       ├── repositories/       # Data access layer
│   │       │   ├── interfaces/     # Repository contracts
│   │       │   ├── electron/       # Electron IPC implementations
│   │       │   ├── mock/           # Mock implementations for testing
│   │       │   ├── RepositoryContext.tsx
│   │       │   └── index.ts
│   │       ├── lib/                # Pure utilities (no data access)
│   │       │   ├── books.ts        # CATEGORIES, filter helpers
│   │       │   ├── config.ts       # toKebabCase, shelfIdToFolder
│   │       │   └── open-library.ts # getCoverUrl, result transformer
│   │       └── types/
│   │           └── index.ts
│   └── site/                       # Static site (also bundled as template)
│       ├── index.html
│       ├── app.js
│       ├── styles-minimalist.css
│       ├── favicon.svg
│       ├── template-version.json   # Template version tracking
│       ├── config.json
│       ├── scripts/
│       │   └── build-index.js
│       ├── books/
│       ├── books-sample/
│       └── dist/                   # Build output (gitignored)
├── package.json                    # Workspace root
├── README.md
├── LICENSE
└── .gitignore
```

## Key Files

### Admin App (packages/admin/)

| File | Purpose |
|------|---------|
| `electron/main.ts` | Electron main process, IPC handlers, app settings storage |
| `electron/preload.ts` | IPC bridge exposing `window.electronAPI` |
| `src/main.tsx` | App entry point, wraps app with `RepositoryProvider` |
| `src/App.tsx` | Root component with routing, setup check |
| `src/components/*.tsx` | React UI components |
| `src/repositories/` | Data access layer (repository pattern) |
| `src/lib/*.ts` | Pure utility functions and constants |
| `src/types/index.ts` | TypeScript type definitions |

### Site (packages/site/)

| File | Purpose |
|------|---------|
| `index.html` | Source HTML with `{{placeholder}}` syntax |
| `styles-minimalist.css` | Active CSS theme |
| `app.js` | Book loading, rendering, modal logic |
| `config.json` | Site configuration (titles, labels, shelves) |
| `favicon.svg` | Book-shaped favicon |
| `template-version.json` | Template version tracking for updates |
| `scripts/build-index.js` | Build script for CI/CD |
| `books/` | Your real book data (source) |
| `books-sample/` | Sample book data for testing |
| `dist/` | Built output (gitignored) |

## Architecture

### Repository Pattern

The admin app uses a repository pattern for data access, enabling testability and separation of concerns:

```
Components → useXRepository() hook → Repository Interface → Implementation
                                                              ├── ElectronRepository (IPC calls)
                                                              └── MockRepository (for testing)
```

**Repository interfaces** (`src/repositories/interfaces/`):
- `BookRepository` - Book CRUD operations
- `ShelfRepository` - Shelf creation/deletion
- `ConfigRepository` - Site configuration
- `SettingsRepository` - App settings (site folder path, validation, initialization, template management)
- `CoverRepository` - Cover image operations (download single, delete, download all locally)
- `BuildRepository` - Build site, preview server
- `OpenLibraryRepository` - External API search
- `SampleDataRepository` - Sample data load/remove

**Usage in components**:
```typescript
import { useBookRepository, useConfigRepository } from '@/repositories';

function MyComponent() {
  const bookRepo = useBookRepository();
  const configRepo = useConfigRepository();

  // Use repository methods
  const books = await bookRepo.getAll();
  const config = await configRepo.get();
}
```

**Testing with mocks**:
```typescript
import { createMockRepositories, RepositoryProvider } from '@/repositories';

const mockRepos = createMockRepositories();
mockRepos.books.setBooks([/* test data */]);

render(
  <RepositoryProvider repositories={mockRepos}>
    <ComponentUnderTest />
  </RepositoryProvider>
);
```

### Site Folder Architecture

The admin app bundles the site template and can create new sites or open existing ones.

```
<site-folder>/                    # Created by admin or user-selected
├── index.html                    # Template (from bundled template)
├── app.js                        # Template (from bundled template)
├── styles-minimalist.css         # Template (from bundled template)
├── favicon.svg                   # Template (optional)
├── template-version.json         # Template version tracking
├── config.json                   # Data (created by admin)
├── books/                        # Data (created by admin)
│   ├── covers/                   # Local cover images
│   └── <shelf-folder>/           # Book JSON files per shelf
├── scripts/                      # Build tools (from bundled template)
│   └── build-index.js
├── books-sample/                 # Sample data (optional)
└── dist/                         # Build output
```

**Key concepts:**
- **Bundled template**: Admin app includes site template in its resources (packaged mode) or uses `packages/site` (dev mode)
- **Template files**: `index.html`, `app.js`, `styles-*.css`, `scripts/` - the site "engine"
- **Data files**: `config.json`, `books/` - user's book data
- **Template versioning**: `template-version.json` tracks version for update detection
- **App settings** stored in: `app.getPath('userData')/settings.json` (just the site folder path)

**Workflow:**
1. On first launch, `SetupWizard` offers two options:
   - **Create New Site**: Select empty folder → admin copies bundled template + initializes data
   - **Open Existing Site**: Select folder with existing template
2. For existing sites, validation checks for required template files
3. If template exists but data files missing, offers to create them
4. Site folder path can be changed via Site Config page
5. Template updates can be applied via Site Config (preserves user data)

**For development**: Point to `packages/site` directly or create a new site
**For production/packaged app**: Create new site in any folder (template is bundled)

### IPC Communication

1. React component calls repository method (e.g., `bookRepo.getAll()`)
2. Electron implementation calls `window.electronAPI.method()`
3. Preload script invokes `ipcRenderer.invoke()`
4. Main process handles the request and returns result

### Utility Functions (`lib/`)

The `lib/` folder contains **only pure functions** - no data access:

| File | Exports | Purpose |
|------|---------|---------|
| `books.ts` | `CATEGORIES`, `getBooksByShelf()`, `searchBooks()` | Constants, in-memory filters |
| `config.ts` | `toKebabCase()`, `shelfIdToFolder()` | String transformers |
| `open-library.ts` | `getCoverUrl()`, `openLibraryResultToBook()` | URL builder, API result transformer |

### Book Data Flow

1. `app.js` fetches `books/index.json` to get list of book files
2. Each book JSON is fetched from its shelf folder
3. Shelf is derived from folder path (e.g., `good-reads/` → `good` shelf)
4. Books are grouped by shelf and rendered with section headers

### Site Configuration (config.json)

```json
{
    "siteTitle": "My Reads",
    "siteSubtitle": "Books that shaped my career",
    "footerText": "Books I love and books to explore",
    "shelves": [
        { "id": "top5", "label": "Top 5 Reads", "folder": "top-5-reads" },
        { "id": "good", "label": "Good Reads", "folder": "good-reads" },
        { "id": "current", "label": "Current Reads", "folder": "current-reads" }
    ]
}
```

Build script replaces `{{placeholders}}` in HTML with config values.
App.js fetches config.json at runtime for shelf labels.

## Common Tasks

### Development

```bash
# Install all dependencies
npm install

# Start admin app in dev mode
npm run dev

# Build site only
npm run build:site

# Build site with sample data
npm run build:site -- --sample
```

### Admin App

```bash
# Start development
npm run dev

# Build for distribution
npm run package

# Platform-specific builds
npm run package:mac
npm run package:win
npm run package:linux
```

### Releases

Releases are fully automated via GitHub Actions:

1. Go to **Actions** → **Release** → **Run workflow**
2. Select bump type: `patch`, `minor`, or `major`
3. The workflow bumps version, builds all platforms, and publishes to GitHub Releases

### Testing Locally

```bash
npm run build:site
cd packages/site && npx serve dist
```

Or use the admin app's built-in preview server.

## Type Definitions

```typescript
interface Book {
  title: string;
  author: string;
  category: string;
  publishDate: string;
  pages?: number;
  cover?: string;
  coverLocal?: string;        // Relative path: "covers/book.jpg"
  notes?: string;
  link?: string;
  clickBehavior: 'overlay' | 'redirect';
}

interface BookWithMeta extends Book {
  filePath: string;
  fileName: string;
  shelfId: string;
  shelfLabel: string;
  coverLocalResolved?: string; // Runtime-only: base64 data URL for display in admin
}

interface Shelf {
  id: string;
  label: string;
  folder: string;
}

interface Config {
  siteTitle: string;
  siteSubtitle: string;
  footerText: string;
  shelves: Shelf[];
}

interface AppSettings {
  libraryPath: string | null;  // Actually the site folder path
}

interface SiteValidation {
  isValid: boolean;            // Has required template files
  hasTemplateFiles: boolean;
  hasConfig: boolean;
  hasBooks: boolean;
  missingFiles: string[];      // List of missing required files
}
```

## Design Decisions

- **Monorepo structure**: npm workspaces for admin and site
- **Electron + React**: Modern desktop app with web technologies
- **TypeScript**: Type safety for admin app
- **Vite**: Fast bundler for development
- **Repository pattern**: Testable data access layer with interface/implementation separation
- **IPC security**: contextIsolation and preload scripts
- **Bundled site template**: Admin bundles site template via `extraResources`, enabling standalone site creation
- **Template versioning**: `template-version.json` enables detecting and applying template updates
- **Site folder architecture**: Admin creates/manages a site folder containing template + data + dist output
- **Folder-based shelves**: Book's shelf determined by folder, not JSON field
- **Base64 covers in admin**: Cover images converted to data URLs for display in Electron
- **Local cover caching**: "Download All Covers" feature caches remote images locally for reliability
- **Pure utilities in lib/**: No data access in lib/ - only constants and pure functions
- **System fonts + Inter**: Fast loading with modern typography

## Things to Avoid

- Don't manually edit `dist/` - it gets cleaned on each build
- Don't add `shelf` field to book JSON - it's derived from folder
- Don't serve from site root - always serve from `dist/`
- Don't call `window.electronAPI` directly in components - use repository hooks
- Don't add data access functions to `lib/` - use repositories instead
- Don't store `coverLocalResolved` in book JSON - it's a runtime-only field
- Don't manually edit `template-version.json` in user sites - it's managed by template updates

## Dependencies

### Admin App
- React 18
- React Router DOM 6
- @dnd-kit (drag and drop)
- Electron 33
- Vite 5
- TypeScript 5
- electron-builder 25

### Site
- No dependencies (vanilla JS)
