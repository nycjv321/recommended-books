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
│   │   │   ├── main.ts             # Electron main process
│   │   │   └── preload.ts          # IPC bridge
│   │   └── src/
│   │       ├── App.tsx
│   │       ├── components/
│   │       │   ├── Dashboard.tsx
│   │       │   ├── BookList.tsx
│   │       │   ├── BookForm.tsx
│   │       │   ├── ShelfManager.tsx
│   │       │   ├── ConfigEditor.tsx
│   │       │   └── Preview.tsx
│   │       ├── lib/
│   │       │   ├── config.ts
│   │       │   ├── books.ts
│   │       │   ├── shelves.ts
│   │       │   ├── covers.ts
│   │       │   ├── open-library.ts
│   │       │   ├── build.ts
│   │       │   └── preview-server.ts
│   │       └── types/
│   │           └── index.ts
│   └── site/                       # Static site
│       ├── index.html
│       ├── app.js
│       ├── styles-minimalist.css
│       ├── favicon.svg
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
| `electron/main.ts` | Electron main process, IPC handlers |
| `electron/preload.ts` | IPC bridge for renderer |
| `src/App.tsx` | Root component with routing |
| `src/components/*.tsx` | React UI components |
| `src/lib/*.ts` | Business logic (config, books, shelves, etc.) |
| `src/types/index.ts` | TypeScript type definitions |
| `vite.config.ts` | Vite bundler configuration |
| `package.json` | Dependencies and electron-builder config |

### Site (packages/site/)

| File | Purpose |
|------|---------|
| `index.html` | Source HTML with `{{placeholder}}` syntax |
| `styles-minimalist.css` | Active CSS theme |
| `app.js` | Book loading, rendering, modal logic |
| `config.json` | Site configuration (titles, labels, shelves) |
| `favicon.svg` | Book-shaped favicon |
| `scripts/build-index.js` | Build script for CI/CD |
| `books/` | Your real book data (source) |
| `books-sample/` | Sample book data for testing |
| `dist/` | Built output (gitignored) |

## Architecture

### Admin App Architecture

The Electron app uses:
- **Main process** (`electron/main.ts`): File system operations, IPC handlers
- **Preload script** (`electron/preload.ts`): Secure IPC bridge
- **Renderer process** (`src/`): React UI

IPC communication flows:
1. React component calls `window.electronAPI.method()`
2. Preload script invokes `ipcRenderer.invoke()`
3. Main process handles the request and returns result

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
  coverLocal?: string;
  notes?: string;
  link?: string;
  clickBehavior: 'overlay' | 'redirect';
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
```

## Design Decisions

- **Monorepo structure**: npm workspaces for admin and site
- **Electron + React**: Modern desktop app with web technologies
- **TypeScript**: Type safety for admin app
- **Vite**: Fast bundler for development
- **IPC security**: contextIsolation and preload scripts
- **Folder-based shelves**: Book's shelf determined by folder, not JSON field
- **System fonts + Inter**: Fast loading with modern typography

## Things to Avoid

- Don't manually edit `packages/site/dist/` - it gets cleaned on each build
- Don't add `shelf` field to book JSON - it's derived from folder
- Don't serve from site root - always serve from `dist/`
- Don't skip IPC for file operations - use the preload bridge

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
