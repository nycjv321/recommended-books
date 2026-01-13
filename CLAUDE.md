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
| `build-index.js` | Build script - generates dist/ folder |
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
books/                           # Real user data (source)
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
├── config.json
└── books/
    ├── index.json               # Auto-generated
    └── [book JSON files]
```

## Common Tasks

### Add a new book
1. Create JSON file in appropriate `books/` subfolder
2. Run `node build-index.js` to rebuild

### Build the site
```bash
node build-index.js           # Build with real data from books/
node build-index.js --sample  # Build with sample data from books-sample/
```

The build script:
- Cleans and creates `dist/` folder
- Copies HTML, CSS, JS to `dist/`
- Copies book JSON files to `dist/books/`
- Generates `dist/books/index.json`

### Change site text or shelf names
Edit `config.json` and rebuild

### Adjust "Show More" threshold
Change `INITIAL_BOOKS_TO_SHOW` in `app.js` (default: 12)

### Modify colors/theme
Edit CSS variables in `:root` section of `styles-minimalist.css`

### Test locally
```bash
node build-index.js --sample  # Build with sample data
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

## Things to Avoid

- Don't manually edit `dist/` - it gets cleaned on each build
- Don't add `shelf` field to book JSON - it's derived from folder
- Don't use `1fr` grid columns if centering is needed - use fixed widths with `auto-fit`
- Don't serve from root - always serve from `dist/`
