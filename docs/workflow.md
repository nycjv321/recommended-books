# Workflow and Release Process

This document explains how the admin app works, how releases are published, and how to deploy your book collection.

## Architecture Overview

The admin app is a standalone Electron application that bundles the site template. It can create new sites or manage existing ones.

```
┌─────────────────────────┐
│  This Repo              │
│  ┌───────────────────┐  │     ┌───────────────────┐     ┌─────────────┐
│  │   Admin App       │──┼────▶│   Your Site       │────▶│   Deploy    │
│  │   (Electron)      │  │     │   (any folder)    │     │   dist/     │
│  └───────────────────┘  │     └───────────────────┘     └─────────────┘
│  + Bundled Template     │       Templates + Data         Static output
│  + GitHub Releases      │
└─────────────────────────┘
```

**Key points**:
- The admin app is released as pre-built binaries (macOS, Windows, Linux)
- Download from [GitHub Releases](../../releases) or build from source
- The app can create a complete site in any empty folder
- Your book data lives in your own site folder (not this repo)

## Site Folder Structure

When you create a new site or open an existing one, the folder contains:

```
<site-folder>/
├── index.html              # Template
├── app.js                  # Template
├── styles-minimalist.css   # Template
├── favicon.svg             # Template (optional)
├── template-version.json   # Version tracking for updates
├── scripts/
│   └── build-index.js      # Build tools
├── config.json             # Site configuration
├── books/                  # Your book data
│   ├── top-5-reads/
│   │   └── book.json
│   ├── good-reads/
│   │   └── another-book.json
│   └── covers/
│       └── book-cover.jpg
├── books-sample/           # Sample data (optional)
└── dist/                   # Build output (gitignored)
```

**Template files** (index.html, app.js, CSS, scripts/) form the site "engine" and are copied from the bundled template.

**Data files** (config.json, books/) contain your book collection and are created/managed by the admin app.

## How the Admin App Works

### First Launch

1. `SetupWizard` prompts you with two options:
   - **Create New Site**: Select an empty folder → admin copies bundled template and initializes data
   - **Open Existing Site**: Select a folder with an existing site
2. For existing sites, admin validates template files are present
3. If templates exist but data files are missing, offers to create them
4. Once configured, the site folder path is saved to app settings

### File Operations

| Operation | Files Affected |
|-----------|----------------|
| Add/edit books | `books/{shelf-folder}/{book}.json` |
| Download covers | `books/covers/{image}.jpg` |
| Download all covers | Downloads all remote covers to `books/covers/`, updates book JSON |
| Create/delete shelves | `books/{shelf-folder}/` directories |
| Edit site config | `config.json` |
| Build site | Generates `dist/` folder |
| Update template | Replaces template files (preserves books/config) |

### Changing the Site Folder

You can change the site folder via Site Config page:

1. Click "Change Location"
2. Select a folder containing the site template (or create a new site)
3. If valid, the app reloads with the new site folder

### Template Updates

The admin app tracks template versions and can update your site's template files:

1. Go to Site Config
2. Check current template version
3. Click "Check for Updates" to compare with bundled version
4. If update available, click "Update Template"

Template updates only replace engine files (HTML, JS, CSS, scripts)—your books and configuration are preserved.

## Typical Workflow

### 1. Set Up Your Site

**Option A - Create a new site** (recommended for new users):
```bash
npm run dev
# Choose "Create New Site" → select an empty folder
# Admin copies template and creates data structure
```

**Option B - Use existing site** (for development or existing data):
```bash
npm run dev
# Choose "Open Existing Site" → select packages/site or your site folder
```

### 2. Edit Your Collection

Use the admin app to manage your books:

- **Dashboard**: See collection overview
- **Books**: Add, edit, delete, and move books between shelves
- **Shelves**: Create shelves and reorder with drag-and-drop
- **Site Config**: Edit title, subtitle, footer text, and manage covers

Every change is **immediately saved** to the corresponding JSON file.

### 2b. Cache Cover Images (Optional)

To avoid relying on external image sources:

1. Go to **Site Config**
2. Click **Download All Covers Locally**
3. All remote cover images are downloaded to `books/covers/`
4. Book JSON files are updated to use local paths

This ensures your site works even if external image URLs become unavailable.

### 3. Preview Your Changes

From the admin app's Build & Preview page:

1. Click **Build Site** to generate `dist/`
2. Click **Start Preview** to launch a local server
3. Open the preview URL in your browser

Or from the command line:

```bash
npm run build:site
cd packages/site && npx serve dist
```

### 4. Commit Your Changes

Your book data is stored as JSON files—perfect for version control:

```bash
git add packages/site/books/ packages/site/config.json
git commit -m "Add new books to collection"
git push
```

### 5. Deploy Your Site

Deploy your site's `dist/` folder to any static hosting.

```bash
# GitHub Pages, Netlify, Vercel - upload dist/ folder
# S3
aws s3 sync your-site/dist/ s3://your-bucket --delete
```

See [Site Deployment Options](#site-deployment-options) for more details.

## Build Process

When you click "Build" or run `npm run build:site`:

1. Read `config.json` for shelves and site metadata
2. Clean the `dist/` directory
3. Copy static files (CSS, JS, favicon) from site folder
4. Process `index.html`, replacing `{{siteTitle}}`, `{{siteSubtitle}}`, `{{footerText}}`
5. Copy `config.json` to `dist/`
6. Copy each shelf folder with all book JSON files
7. Generate `books/index.json` (list of all book files)
8. Copy `books/covers/` directory

### Building with Sample Data

To build using the sample books instead of your collection:

```bash
npm run build:site -- --sample
```

This uses `books-sample/` instead of `books/`, useful for testing or demos.

## Admin App Releases

Pre-built admin app binaries are published to [GitHub Releases](../../releases) for macOS, Windows, and Linux.

### Creating a Release

1. Go to **Actions** → **Release** workflow
2. Click **Run workflow**
3. Select version bump type: `patch`, `minor`, or `major`
4. Click **Run workflow**

The workflow automatically:
1. Bumps the version in `package.json`
2. Commits and tags the release
3. Builds for macOS (DMG, ZIP), Windows (NSIS, portable), and Linux (AppImage, DEB)
4. Publishes all artifacts to GitHub Releases
5. Auto-generates release notes from commits

### Building Locally

```bash
cd packages/admin
npm run package        # Build for current platform
npm run package:mac    # macOS only
npm run package:win    # Windows only
npm run package:linux  # Linux only
```

Output goes to `packages/admin/out/`.

## Site Deployment Options

After building your site with the admin app, deploy the `dist/` folder.

### GitHub Pages

1. Build the site in the admin app
2. Push `dist/` to a `gh-pages` branch or configure GitHub Pages to serve from your site folder

### Netlify / Vercel

1. Push your site folder to a repository
2. Connect to Netlify/Vercel
3. Set publish directory to `dist`

### Amazon S3

```bash
aws s3 sync your-site/dist/ s3://your-bucket --delete
```

For automatic deployments, set up a GitHub Actions workflow in your site's repository.

## FAQ

### Can I edit JSON files directly instead of using the admin app?

Yes. The admin app is a convenience—you can edit `books/*.json` and `config.json` directly in any text editor. Just follow the [book schema](../README.md#book-json-schema).

### Can I use a different folder for my books?

Yes! Use "Create New Site" to set up a site in any folder, or point to an existing site folder. This is useful for managing multiple book collections.

### What happens if I delete the dist/ folder?

Nothing bad—just rebuild with the admin app or `npm run build:site`. The `dist/` folder is generated output and is gitignored.

### Can multiple people edit the collection?

Yes, through git. Each person clones the repo, makes changes with the admin app, commits, and pushes. Merge conflicts in JSON files are easy to resolve.

### What if I select an invalid folder?

For "Open Existing Site", the admin validates that the folder has required template files. If files are missing, it shows an error. For "Create New Site", select an empty folder and the admin will set everything up.

### Should I download covers locally?

It's recommended if you want your site to be self-contained and not depend on external image sources. Use "Download All Covers Locally" in Site Config to cache all remote covers. Books that already have local covers are skipped.

### How do template updates work?

The admin app bundles the site template and tracks versions. When a newer template is available:
1. Go to Site Config → Template Version
2. Click "Check for Updates"
3. If update available, click "Update Template"

Only template files are replaced—your books and configuration remain untouched.
