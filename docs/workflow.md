# Workflow and Release Process

This document explains how the admin app works and how to publish your book collection.

## Architecture Overview

The admin app is a **development tool** that directly edits files in the project. It's not a standalone CMS—changes are made to source files that you commit to git and deploy.

```
┌─────────────────┐     ┌───────────────────┐     ┌─────────────┐
│   Admin App     │────▶│  packages/site/   │────▶│   Deploy    │
│   (Electron)    │     │  books/*.json     │     │   dist/     │
└─────────────────┘     └───────────────────┘     └─────────────┘
     Edits files          Source of truth         Static output
```

## How the Admin App Works

### File Operations

The admin app directly reads and writes files in `packages/site/`:

| Operation | Files Affected |
|-----------|----------------|
| Add/edit books | `books/{shelf-folder}/{book}.json` |
| Download covers | `books/covers/{image}.jpg` |
| Create/delete shelves | `books/{shelf-folder}/` directories |
| Edit site config | `config.json` |
| Build site | Generates `dist/` folder |

### Path Resolution

The admin app uses a **hardcoded relative path** to find the site package:

```
packages/admin/electron/main.ts → ../site/
```

This means:
- The admin app must be run from within the monorepo structure
- It cannot manage books in an arbitrary directory
- The packaged app includes both admin and site packages together

## Typical Workflow

### 1. Edit Your Collection

Use the admin app to manage your books:

```bash
npm run dev
```

- **Dashboard**: See collection overview
- **Books**: Add, edit, delete, and move books between shelves
- **Shelves**: Create shelves and reorder with drag-and-drop
- **Site Config**: Edit title, subtitle, and footer text

Every change is **immediately saved** to the corresponding JSON file.

### 2. Preview Your Changes

From the admin app's Build & Preview page:

1. Click **Build Site** to generate `dist/`
2. Click **Start Preview** to launch a local server
3. Open the preview URL in your browser

Or from the command line:

```bash
npm run build:site
cd packages/site && npx serve dist
```

### 3. Commit Your Changes

Your book data is stored as JSON files—perfect for version control:

```bash
git add packages/site/books/ packages/site/config.json
git commit -m "Add new books to collection"
git push
```

### 4. Deploy

Deploy the `packages/site/dist/` folder to any static hosting.

**Manual deployment:**

```bash
# GitHub Pages, Netlify, Vercel - upload dist/ folder
# S3
aws s3 sync packages/site/dist/ s3://your-bucket --delete
```

**Automatic deployment:**

The repo includes a GitHub Actions workflow that deploys to S3 on push to main. See [Deployment](#deployment-options) below.

## File Structure

```
packages/site/
├── config.json              # Site configuration (editable in admin)
├── books/                   # Your book data (source of truth)
│   ├── top-5-reads/
│   │   ├── book-one.json
│   │   └── book-two.json
│   ├── good-reads/
│   │   └── another-book.json
│   └── covers/              # Downloaded cover images
│       ├── book-one.jpg
│       └── book-two.jpg
├── books-sample/            # Sample data for testing
├── dist/                    # Build output (gitignored)
│   ├── index.html           # Processed HTML
│   ├── config.json          # Copied
│   ├── app.js               # Copied
│   ├── styles-minimalist.css
│   └── books/               # All books copied here
└── index.html               # Source template (with {{placeholders}})
```

## Build Process

When you click "Build" or run `npm run build:site`:

1. Read `config.json` for shelves and site metadata
2. Clean the `dist/` directory
3. Copy static files (CSS, JS, favicon)
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

## Deployment Options

### GitHub Pages

1. Build the site: `npm run build:site`
2. Push `dist/` to a `gh-pages` branch, or configure GitHub Pages to serve from `packages/site/dist/`

### Netlify / Vercel

1. Connect your repository
2. Set build command: `npm run build:site`
3. Set publish directory: `packages/site/dist`

### Amazon S3

Manual:

```bash
aws s3 sync packages/site/dist/ s3://your-bucket --delete
```

Automatic (GitHub Actions):

The repo includes `.github/workflows/deploy.yml`. Configure these secrets:

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |
| `AWS_REGION` | e.g., `us-east-1` |
| `S3_BUCKET_NAME` | Your bucket name |

## FAQ

### Can I edit JSON files directly instead of using the admin app?

Yes. The admin app is a convenience—you can edit `books/*.json` and `config.json` directly in any text editor. Just follow the [book schema](../README.md#book-json-schema).

### Why doesn't the admin app let me choose a project directory?

The app is designed as part of this monorepo. The path to `packages/site/` is hardcoded relative to the admin package. This keeps the architecture simple and ensures the admin and site are always in sync.

### What happens if I delete the dist/ folder?

Nothing bad—just rebuild with the admin app or `npm run build:site`. The `dist/` folder is generated output and is gitignored.

### Can multiple people edit the collection?

Yes, through git. Each person clones the repo, makes changes with the admin app, commits, and pushes. Merge conflicts in JSON files are easy to resolve.
