# My Reads

[![Built with Claude](https://img.shields.io/badge/Built%20with-Claude-blueviolet)](https://claude.ai)

A minimalist static website to showcase book recommendations. No backend required - just HTML, CSS, and JavaScript.

## Example

See [Javier's Recommended Books](https://github.com/nycjv321/javiers-recommended-books.git) for a live example of this template in action.

## Features

- Clean, minimalist design with soft lavender theme
- Three customizable shelves: Top 5 Reads, Good Reads, Current and Future Reads
- "Show More" button for large collections (12+ books)
- Click on any book to see details, notes, and external links
- Dark mode toggle with localStorage persistence
- Fully responsive (mobile, tablet, desktop)
- Book covers from Open Library or local images (with fallback placeholder)

## Getting Started

### 1. Build and run locally

```bash
# Build the site
node scripts/build-index.js

# Serve the built site
npx serve dist
# Or
cd dist && python -m http.server 8080
```

Then open http://localhost:8080

### 2. Add a book

**Option A: Interactive CLI (recommended)**
```bash
node scripts/add-book.js         # Search Open Library or enter manually
```

**Option B: Manual JSON file**

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
node scripts/build-index.js
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
| `coverLocal` | string | No | Local path to downloaded cover (e.g., `covers/my-book.jpg`) |
| `notes` | string | No | Your personal notes |
| `link` | string | No | External URL (Amazon, publisher, etc.) |
| `clickBehavior` | string | No | `"overlay"` (default) or `"redirect"` |

### Cover Images

You can use Open Library for free cover images:
```
https://covers.openlibrary.org/b/isbn/{ISBN}-L.jpg
```

If a cover image fails to load, a placeholder with the book title is shown automatically.

**Download covers for offline use:**
```bash
node scripts/download-covers.js          # Interactive mode
node scripts/download-covers.js --all    # Download all without prompting
node scripts/download-covers.js --check  # Report only (no downloads)
```

This downloads external cover images to `books/covers/` and adds a `coverLocal` field to each book's JSON. Local covers take precedence over external URLs.

### Moving Books Between Shelves

```bash
node scripts/add-book.js --move
```

Lists all books and lets you move them between shelves interactively.

## Project Structure

```
recommended-books/
├── index.html              # Source HTML (with placeholders)
├── styles-minimalist.css   # Source CSS
├── app.js                  # Source JS
├── config.json             # Site configuration (titles, labels)
├── favicon.svg             # Book-shaped favicon
├── scripts/                # CLI tools
│   ├── build-index.js      # Build script
│   ├── add-book.js         # Interactive CLI to add/move books
│   └── download-covers.js  # Download covers for offline use
├── books/                  # Your real book data
│   ├── covers/             # Downloaded cover images (optional)
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
    ├── favicon.svg
    ├── config.json
    └── books/
        ├── covers/
        ├── index.json
        └── [book files]
```

## Deployment

### Automatic (GitHub Actions + S3)

This repo includes a GitHub Actions workflow that automatically deploys to S3 on push to `main`.

**Required GitHub Secrets:**

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |
| `AWS_REGION` | AWS region (e.g., `us-east-1`) |
| `S3_BUCKET_NAME` | Your S3 bucket name |

**Setup:**

1. **Create an S3 bucket** with static website hosting enabled

2. **Create an IAM user** with the following policy (replace `YOUR-BUCKET-NAME`):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Action": [
         "s3:PutObject",
         "s3:DeleteObject",
         "s3:ListBucket"
       ],
       "Resource": [
         "arn:aws:s3:::YOUR-BUCKET-NAME",
         "arn:aws:s3:::YOUR-BUCKET-NAME/*"
       ]
     }]
   }
   ```

3. **Add GitHub Secrets** to your repository:
   - Go to your repo on GitHub
   - Navigate to Settings → Secrets and variables → Actions
   - Click "New repository secret" for each secret listed above

4. **Push to `main`** - the workflow runs automatically

### Manual

Build first, then deploy the `dist/` folder:

```bash
node scripts/build-index.js
```

Works with any static hosting:

- **GitHub Pages**: Deploy the `dist/` folder
- **Netlify**: Drag and drop `dist/`
- **Vercel**: Set build output to `dist/`
- **S3**: `aws s3 sync dist/ s3://your-bucket --delete`

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

Then rebuild with `node scripts/build-index.js`.

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
