# My Reads

[![Built with Claude](https://img.shields.io/badge/Built%20with-Claude-blueviolet)](https://claude.ai)

A minimalist static website to showcase book recommendations, with an Electron desktop app for management.

## Example

See [Javier's Recommended Books](https://github.com/nycjv321/javiers-recommended-books.git) for a live example of this template in action.

## Features

### Website
- Clean, minimalist design with soft lavender theme
- Customizable shelves for organizing books
- "Show More" button for large collections (12+ books)
- Click on any book to see details, notes, and external links
- Dark mode toggle with localStorage persistence
- Fully responsive (mobile, tablet, desktop)
- Book covers from Open Library or local images (with fallback placeholder)

### Admin App (Electron)
- Desktop app for managing your book collection
- Add books with Open Library search integration
- Drag-and-drop shelf reordering
- Built-in site builder and preview server
- Edit site configuration in a visual editor
- Cross-platform (macOS, Windows, Linux)

## Project Structure

```
recommended-books/
├── packages/
│   ├── admin/                    # Electron admin app
│   │   ├── electron/             # Electron main process
│   │   ├── src/                  # React UI
│   │   │   ├── components/       # React components
│   │   │   ├── lib/              # Business logic
│   │   │   └── types/            # TypeScript types
│   │   └── package.json
│   └── site/                     # Static website
│       ├── index.html            # Source HTML (with placeholders)
│       ├── styles-minimalist.css # Styles
│       ├── app.js                # Site JavaScript
│       ├── config.json           # Site configuration
│       ├── favicon.svg           # Favicon
│       ├── books/                # Your book data
│       │   ├── covers/           # Downloaded covers (optional)
│       │   ├── top-5-reads/
│       │   ├── good-reads/
│       │   └── current-reads/
│       ├── books-sample/         # Sample data for testing
│       ├── scripts/              # Build script
│       └── dist/                 # Built output (gitignored)
├── package.json                  # Workspace root
├── README.md
├── LICENSE
└── .gitignore
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/recommended-books.git
cd recommended-books

# Install dependencies (uses npm workspaces)
npm install
```

### Using the Admin App

```bash
# Start the admin app in development mode
npm run dev

# Or build and package the app
npm run package
```

The admin app provides:
- **Dashboard**: Overview of your book collection
- **Books**: Add, edit, move, and delete books
- **Shelves**: Create and organize shelves with drag-and-drop
- **Site Config**: Edit site title, subtitle, and footer
- **Build & Preview**: Build the site and preview locally

### Manual Site Build (without Admin App)

```bash
# Build the site from packages/site
npm run build:site

# Or build with sample data
npm run build:site -- --sample

# Serve the built site
cd packages/site && npx serve dist
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
| `coverLocal` | string | No | Local path to cover (e.g., `books/covers/my-book.jpg`) |
| `notes` | string | No | Your personal notes |
| `link` | string | No | External URL (Amazon, publisher, etc.) |
| `clickBehavior` | string | No | `"overlay"` (default) or `"redirect"` |

### Cover Images

You can use Open Library for free cover images:
```
https://covers.openlibrary.org/b/isbn/{ISBN}-L.jpg
```

If a cover image fails to load, a placeholder with the book title is shown automatically.

## Deployment

### Building for Production

Use the admin app's Build & Preview page, or run:

```bash
npm run build:site
```

This creates `packages/site/dist/` with the complete static site.

### Hosting Options

Deploy the `packages/site/dist/` folder to any static hosting:

- **GitHub Pages**: Deploy the `dist/` folder
- **Netlify**: Drag and drop `dist/`
- **Vercel**: Set build output to `packages/site/dist/`
- **S3**: `aws s3 sync packages/site/dist/ s3://your-bucket --delete`

### Automatic Deployment (GitHub Actions + S3)

This repo includes a GitHub Actions workflow for automatic S3 deployment.

**Required GitHub Secrets:**

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |
| `AWS_REGION` | AWS region (e.g., `us-east-1`) |
| `S3_BUCKET_NAME` | Your S3 bucket name |

## Customization

### Site Text

Use the admin app's Site Config page, or edit `packages/site/config.json`:

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

### Colors

Edit CSS variables in `packages/site/styles-minimalist.css`:

```css
:root {
    --bg-primary: #FAF5FF;      /* Page background */
    --bg-secondary: #FFFFFF;     /* Card background */
    --accent: #292524;           /* Buttons, links */
    --text-primary: #292524;     /* Main text */
    --text-secondary: #57534E;   /* Secondary text */
    --text-muted: #A8A29E;       /* Muted text */
}
```

## Development

### Admin App Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Package as distributable app
npm run package
```

### Site Development

```bash
# Build site
npm run build:site

# Build with sample data
npm run build:site -- --sample
```

## License

MIT
