# My Reads

A minimalist static website to showcase your book recommendations. No backend required - just HTML, CSS, and JavaScript.

## Features

- Clean, minimalist design with soft lavender theme
- Three customizable shelves: Top 5 Reads, Good Reads, Current and Future Reads
- "Show More" button for large collections (12+ books)
- Click on any book to see details, notes, and external links
- Dark mode toggle with localStorage persistence
- Fully responsive (mobile, tablet, desktop)
- Book covers from Open Library or local images

## Getting Started

### 1. Build and run locally

```bash
# Build the site (with sample data for testing)
node build-index.js --sample

# Serve the built site
npx serve dist
# Or
cd dist && python -m http.server 8080
```

Then open http://localhost:8080

### 2. Add a book

Create a JSON file in the appropriate shelf folder:

```
books/
├── top-5-reads/
├── good-reads/
└── current-and-future-reads/
```

Example book file (`books/good-reads/my-book.json`):

```json
{
    "title": "Book Title",
    "author": "Author Name",
    "category": "Category",
    "publishDate": "2024-01-15",
    "pages": 320,
    "cover": "https://covers.openlibrary.org/b/isbn/9780123456789-L.jpg",
    "notes": "Your personal notes about the book...",
    "link": "https://example.com/book",
    "clickBehavior": "overlay"
}
```

### 3. Build the site

After adding or removing books, rebuild:

```bash
# Build with your real data
node build-index.js

# Or build with sample data for testing/demo
node build-index.js --sample
```

The build script:
- Creates `dist/` folder with the complete site
- Copies HTML, CSS, JS files
- Copies book JSON files from `books/` (or `books-sample/` with `--sample`)
- Generates `dist/books/index.json`

## Book JSON Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Book title |
| `author` | string | Yes | Author name |
| `category` | string | No | Genre or category |
| `publishDate` | string | No | ISO date (YYYY-MM-DD) |
| `pages` | number | No | Page count |
| `cover` | string | Yes | URL to cover image |
| `notes` | string | No | Your personal notes |
| `link` | string | No | External URL (Amazon, publisher, etc.) |
| `clickBehavior` | string | No | `"overlay"` (default) or `"redirect"` |

### Cover Images

You can use Open Library for free cover images:
```
https://covers.openlibrary.org/b/isbn/{ISBN}-L.jpg
```

## Project Structure

```
reccommended-books/
├── index.html              # Source HTML (with placeholders)
├── styles-minimalist.css   # Source CSS
├── app.js                  # Source JS
├── config.json             # Site configuration (titles, labels)
├── build-index.js          # Build script
├── books/                  # Your real book data
│   ├── top-5-reads/
│   ├── good-reads/
│   └── current-and-future-reads/
├── books-sample/           # Sample data for testing/demo
│   ├── top-5-reads/
│   ├── good-reads/
│   └── current-and-future-reads/
└── dist/                   # Built output (gitignored)
    ├── index.html
    ├── styles-minimalist.css
    ├── app.js
    ├── config.json
    └── books/
        ├── index.json
        └── [book files]
```

## Deployment

Build first, then deploy the `dist/` folder:

```bash
node build-index.js  # Build with your real data
```

Works with any static hosting:

- **GitHub Pages**: Deploy the `dist/` folder
- **Netlify**: Drag and drop `dist/`
- **Vercel**: Set build output to `dist/`
- **Any web server**: Serve the `dist/` folder

## Customization

### Site Text

Edit `config.json` to customize titles and labels:

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

Then rebuild with `node build-index.js`.

### Colors

Edit CSS variables in `styles-minimalist.css`:

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

## License

MIT
