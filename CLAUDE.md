# Claude Code Instructions

This is a static book recommendation website built with HTML, CSS, and JavaScript.

## Project Overview

- **Purpose**: Display personal book recommendations in a clean, minimalist UI
- **Stack**: Vanilla HTML/CSS/JS, no frameworks
- **Hosting**: Static files only, no backend

## Key Files

| File | Purpose |
|------|---------|
| `index.html` | Source HTML with `{{placeholder}}` syntax |
| `styles-minimalist.css` | Source CSS (active theme) |
| `styles.css` | Alternative warm bookshelf theme (unused) |
| `app.js` | Source JS - book loading, rendering, modal logic |
| `config.json` | Site configuration (titles, labels) |
| `favicon.svg` | Book-shaped favicon |
| `scripts/build-index.js` | Build script - generates dist/ folder |
| `scripts/add-book.js` | Interactive CLI to add/move books with Open Library lookup |
| `scripts/download-covers.js` | Download external cover images for offline use |
| `books/` | Your real book data (source) |
| `books-sample/` | Sample book data for testing/demos |
| `dist/` | Built output (gitignored) - serve this folder |

## Architecture

### Book Data Flow
1. `app.js` fetches `books/index.json` to get list of book files
2. Each book JSON is fetched from its shelf folder
3. Shelf is derived from folder path (e.g., `good-reads/` → `good` shelf)
4. Books are grouped by shelf and rendered with section headers

### Site Configuration (config.json)
```json
{
    "siteTitle": "My Reads",
    "siteSubtitle": "A curated collection",
    "footerText": "Books I love and books to explore",
    "shelves": {
        "top5": "Top 5 Reads",
        "good": "Good Reads",
        "current": "Current and Future Reads"
    }
}
```

Build script replaces `{{placeholders}}` in HTML with config values.
App.js fetches config.json at runtime for shelf labels.

### Folder Structure
```
scripts/                         # CLI tools
├── build-index.js               # Build script
├── add-book.js                  # Add/move books interactively
└── download-covers.js           # Download cover images

books/                           # Real user data (source)
├── covers/                      # Downloaded cover images (optional)
├── top-5-reads/*.json
├── good-reads/*.json
└── current-and-future-reads/*.json

books-sample/                    # Sample data for testing/demos
├── top-5-reads/*.json
├── good-reads/*.json
└── current-and-future-reads/*.json

dist/                            # Built output (gitignored)
├── index.html                   # Placeholders replaced with config values
├── styles-minimalist.css
├── app.js
├── favicon.svg
├── config.json
└── books/
    ├── covers/                  # Copied from source if exists
    ├── index.json               # Auto-generated
    └── [book JSON files]
```

## Common Tasks

### Add a new book (interactive)
```bash
node scripts/add-book.js                 # Search Open Library or enter manually
node scripts/add-book.js --move          # Move existing book between shelves
```

### Add a new book (manual)
1. Create JSON file in appropriate `books/` subfolder
2. Run `node scripts/build-index.js` to rebuild

### Build the site
```bash
node scripts/build-index.js           # Build with real data from books/
node scripts/build-index.js --sample  # Build with sample data from books-sample/
```

The build script:
- Cleans and creates `dist/` folder
- Copies HTML, CSS, JS to `dist/`
- Copies book JSON files to `dist/books/`
- Copies cover images to `dist/books/covers/` (if exists)
- Generates `dist/books/index.json`

### Download covers for offline use
```bash
node scripts/download-covers.js          # Interactive mode
node scripts/download-covers.js --all    # Download all without prompting
node scripts/download-covers.js --check  # Report only (no downloads)
```

Downloads external cover images and adds `coverLocal` field to book JSON.

### Change site text or shelf names
Edit `config.json` and rebuild

### Adjust "Show More" threshold
Change `INITIAL_BOOKS_TO_SHOW` in `app.js` (default: 12)

### Modify colors/theme
Edit CSS variables in `:root` section of `styles-minimalist.css`

### Test locally
```bash
node scripts/build-index.js   # Build with real data
npx serve dist                # Serve the built site
# or
cd dist && python -m http.server 8080
```

## Design Decisions

- **Simple build script**: Node.js script copies files to dist/, no bundlers
- **Folder-based shelves**: Book's shelf determined by folder, not JSON field
- **System fonts + Inter**: Fast loading with modern typography
- **Auto-fit grid**: Centers partial rows automatically
- **Show More for Good Reads**: Handles large collections without overwhelming the page
- **Separate source and output**: `books/` for source data, `dist/` for built output
- **Cover image fallback**: SVG placeholder with book title shown if cover fails to load
- **Local cover support**: `coverLocal` field in book JSON for offline covers (takes precedence over `cover` URL)

## Things to Avoid

- Don't manually edit `dist/` - it gets cleaned on each build
- Don't add `shelf` field to book JSON - it's derived from folder
- Don't use `1fr` grid columns if centering is needed - use fixed widths with `auto-fit`
- Don't serve from root - always serve from `dist/`
