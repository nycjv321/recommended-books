# Workflow and Release Process

This document explains how the admin app works and how to publish your book collection.

## Architecture Overview

The admin app manages a **site folder** that contains everything: templates, book data, and build output.

```
┌─────────────────┐     ┌───────────────────┐     ┌─────────────┐
│   Admin App     │────▶│   Site Folder     │────▶│   Deploy    │
│   (Electron)    │     │   (packages/site) │     │   dist/     │
└─────────────────┘     └───────────────────┘     └─────────────┘
     Manages              Templates + Data         Static output
```

## Site Folder Structure

The admin app points to a site folder containing:

```
<site-folder>/
├── index.html              # Template (required)
├── app.js                  # Template (required)
├── styles-minimalist.css   # Template (required)
├── favicon.svg             # Template (optional)
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

**Template files** (index.html, app.js, CSS) are required and form the site "engine".

**Data files** (config.json, books/) can be initialized by the admin app if missing.

## How the Admin App Works

### First Launch

1. `SetupWizard` prompts you to select a site folder
2. Admin validates the folder has required template files
3. If templates exist but data files are missing, offers to create them
4. Once configured, the site folder path is saved to app settings

### File Operations

| Operation | Files Affected |
|-----------|----------------|
| Add/edit books | `books/{shelf-folder}/{book}.json` |
| Download covers | `books/covers/{image}.jpg` |
| Create/delete shelves | `books/{shelf-folder}/` directories |
| Edit site config | `config.json` |
| Build site | Generates `dist/` folder |

### Changing the Site Folder

You can change the site folder via Site Config page:

1. Click "Change Location"
2. Select a folder containing the site template
3. If valid, the app reloads with the new site folder

## Typical Workflow

### 1. Set Up Your Site Folder

**For development**: Point to `packages/site` directly

**For a separate instance**: Copy `packages/site` to another location and point there

```bash
# Start the admin app
npm run dev

# On first launch, select packages/site as your site folder
```

### 2. Edit Your Collection

Use the admin app to manage your books:

- **Dashboard**: See collection overview
- **Books**: Add, edit, delete, and move books between shelves
- **Shelves**: Create shelves and reorder with drag-and-drop
- **Site Config**: Edit title, subtitle, and footer text

Every change is **immediately saved** to the corresponding JSON file.

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

### 5. Deploy

Deploy the `dist/` folder to any static hosting.

**Manual deployment:**

```bash
# GitHub Pages, Netlify, Vercel - upload dist/ folder
# S3
aws s3 sync packages/site/dist/ s3://your-bucket --delete
```

**Automatic deployment:**

The repo includes a GitHub Actions workflow that deploys to S3 on push to main. See [Deployment Options](#deployment-options) below.

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

### Can I use a different folder for my books?

Yes! Copy `packages/site` to any location, then point the admin app to that folder. This is useful if you want to manage multiple book collections or keep your data separate from the code.

### What happens if I delete the dist/ folder?

Nothing bad—just rebuild with the admin app or `npm run build:site`. The `dist/` folder is generated output and is gitignored.

### Can multiple people edit the collection?

Yes, through git. Each person clones the repo, makes changes with the admin app, commits, and pushes. Merge conflicts in JSON files are easy to resolve.

### What if I select an invalid folder?

The admin app validates that the folder has required template files (index.html, app.js, CSS). If files are missing, it shows an error with the list of missing files. You'll need to select a valid site folder.
