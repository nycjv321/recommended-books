# My Reads

[![Built with Claude](https://img.shields.io/badge/Built%20with-Claude-blueviolet)](https://claude.ai)

A minimalist static website to showcase book recommendations, with an Electron desktop app for management.

## Example

See [Javier's Recommended Books](https://github.com/nycjv321/javiers-recommended-books.git) for a live example.

## Features

**Website**: Clean design, customizable shelves, dark mode, responsive layout, book detail overlays

**Admin App**: Desktop app with Open Library search, drag-and-drop shelves, built-in preview server

## Quick Start

```bash
# Install dependencies
npm install

# Start the admin app
npm run dev
```

Use the admin app to add books, organize shelves, build, and preview your site.

For detailed workflow and deployment instructions, see **[docs/workflow.md](docs/workflow.md)**.

## Project Structure

```
recommended-books/
├── packages/
│   ├── admin/          # Electron admin app (React + TypeScript)
│   └── site/           # Static website (vanilla JS)
│       ├── books/      # Your book data (JSON files)
│       ├── config.json # Site configuration
│       └── dist/       # Build output (deploy this)
└── docs/               # Documentation
```

## Book JSON Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Book title |
| `author` | string | Yes | Author name |
| `category` | string | No | Genre or category |
| `publishDate` | string | No | ISO date (YYYY-MM-DD) |
| `pages` | number | No | Page count |
| `cover` | string | No | URL to cover image |
| `coverLocal` | string | No | Local path (e.g., `books/covers/my-book.jpg`) |
| `notes` | string | No | Your personal notes |
| `link` | string | No | External URL |
| `clickBehavior` | string | No | `"overlay"` (default) or `"redirect"` |

## Customization

### Site Text

Edit in the admin app's Site Config page, or directly in `packages/site/config.json`:

```json
{
  "siteTitle": "My Reads",
  "siteSubtitle": "Books that shaped my career",
  "footerText": "Books I love and books to explore",
  "shelves": [
    { "id": "top5", "label": "Top 5 Reads", "folder": "top-5-reads" }
  ]
}
```

### Colors

Edit CSS variables in `packages/site/styles-minimalist.css`:

```css
:root {
    --bg-primary: #FAF5FF;
    --accent: #292524;
    --text-primary: #292524;
}
```

## Deployment

Build and deploy the `packages/site/dist/` folder to any static hosting (GitHub Pages, Netlify, S3, etc.).

```bash
npm run build:site
```

See **[docs/workflow.md](docs/workflow.md)** for detailed deployment options including GitHub Actions.

## License

MIT
