#!/usr/bin/env node

/**
 * Interactive CLI to add and move books
 *
 * Usage:
 *   node scripts/add-book.js          # Add a new book (with Open Library lookup)
 *   node scripts/add-book.js --move   # Move existing book between shelves
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT_DIR = path.join(__dirname, '..');
const CONFIG_FILE = path.join(ROOT_DIR, 'config.json');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    console.error('Error: config.json not found');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
}

function getShelfDirs(config) {
  const shelfDirs = {};
  if (config.shelves && Array.isArray(config.shelves)) {
    config.shelves.forEach(s => {
      shelfDirs[s.id] = s.folder;
    });
  }
  return shelfDirs;
}

const CATEGORIES = ['Programming', 'Self-Improvement', 'Business', 'Science', 'Biography', 'Fiction', 'Other'];

function question(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

function toKebabCase(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function validateRequired(value, fieldName) {
  if (!value || !value.trim()) {
    throw new Error(`${fieldName} is required`);
  }
  return value.trim();
}

function validateDate(value) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(value)) {
    throw new Error('Date must be in YYYY-MM-DD format');
  }
  return value;
}

function validateNumber(value, fieldName) {
  const num = parseInt(value, 10);
  if (isNaN(num) || num <= 0) {
    throw new Error(`${fieldName} must be a positive number`);
  }
  return num;
}

async function promptWithValidation(prompt, validator) {
  while (true) {
    const answer = await question(prompt);
    try {
      return validator(answer);
    } catch (err) {
      console.log(`  Error: ${err.message}. Please try again.`);
    }
  }
}

// ============================================
// Open Library API Lookup
// ============================================

function isIsbn(query) {
  const cleaned = query.replace(/[-\s]/g, '');
  return /^\d{10}$/.test(cleaned) || /^\d{13}$/.test(cleaned);
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpGet(res.headers.location).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    }).on('error', reject);
  });
}

async function httpGetWithRetry(url, maxRetries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await httpGet(url);
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        console.log(`  Retry ${attempt}/${maxRetries - 1}...`);
        await new Promise(r => setTimeout(r, 500));
      }
    }
  }
  throw lastError;
}

async function lookupByIsbn(isbn) {
  const cleanIsbn = isbn.replace(/[-\s]/g, '');
  const url = `https://openlibrary.org/isbn/${cleanIsbn}.json`;

  try {
    const data = await httpGetWithRetry(url);

    // Get author info if available
    let authorName = '';
    if (data.authors && data.authors.length > 0) {
      const authorKey = data.authors[0].key;
      try {
        const authorData = await httpGetWithRetry(`https://openlibrary.org${authorKey}.json`);
        authorName = authorData.name || '';
      } catch (e) {
        // Author lookup failed, continue without it
      }
    }

    return [{
      title: data.title || '',
      author: authorName,
      publishDate: data.publish_date ? extractYear(data.publish_date) : '',
      pages: data.number_of_pages || '',
      cover: data.covers && data.covers.length > 0
        ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg`
        : '',
      link: `https://openlibrary.org/isbn/${cleanIsbn}`
    }];
  } catch (e) {
    return [];
  }
}

async function lookupByTitle(query) {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://openlibrary.org/search.json?q=${encodedQuery}&limit=5`;

  try {
    const data = await httpGet(url);

    if (!data.docs || data.docs.length === 0) {
      return [];
    }

    return data.docs.map(doc => ({
      title: doc.title || '',
      author: doc.author_name ? doc.author_name[0] : '',
      publishDate: doc.first_publish_year ? `${doc.first_publish_year}-01-01` : '',
      pages: doc.number_of_pages_median || '',
      cover: doc.cover_edition_key
        ? `https://covers.openlibrary.org/b/olid/${doc.cover_edition_key}-L.jpg`
        : (doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : ''),
      link: doc.key ? `https://openlibrary.org${doc.key}` : ''
    }));
  } catch (e) {
    return [];
  }
}

function extractYear(dateStr) {
  const match = dateStr.match(/\d{4}/);
  return match ? `${match[0]}-01-01` : '';
}

async function lookupBook(query) {
  console.log('  Searching Open Library...');

  if (isIsbn(query)) {
    return lookupByIsbn(query);
  } else {
    return lookupByTitle(query);
  }
}

// ============================================
// Move Book Functionality
// ============================================

function listAllBooks(shelfDirs) {
  const booksDir = path.join(ROOT_DIR, 'books');
  const books = [];

  for (const [shelfKey, shelfDir] of Object.entries(shelfDirs)) {
    const shelfPath = path.join(booksDir, shelfDir);

    if (!fs.existsSync(shelfPath)) continue;

    const files = fs.readdirSync(shelfPath).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const filePath = path.join(shelfPath, file);
      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        books.push({
          shelf: shelfKey,
          shelfDir,
          filename: file,
          filePath,
          title: content.title || file,
          author: content.author || ''
        });
      } catch (e) {
        // Skip invalid JSON files
      }
    }
  }

  return books;
}

function moveBook(fromPath, toShelf, shelfDirs) {
  const filename = path.basename(fromPath);
  const toDir = path.join(ROOT_DIR, 'books', shelfDirs[toShelf]);
  const toPath = path.join(toDir, filename);

  // Ensure destination directory exists
  if (!fs.existsSync(toDir)) {
    fs.mkdirSync(toDir, { recursive: true });
  }

  fs.renameSync(fromPath, toPath);
  return toPath;
}

async function moveBookFlow() {
  console.log('\nMove a Book');
  console.log('-----------\n');

  const config = loadConfig();
  const shelfDirs = getShelfDirs(config);
  const books = listAllBooks(shelfDirs);

  if (books.length === 0) {
    console.log('No books found in books/ directory.\n');
    return;
  }

  // Display numbered list
  books.forEach((book, index) => {
    console.log(`${index + 1}. [${book.shelf}] ${book.title}${book.author ? ` by ${book.author}` : ''}`);
  });
  console.log();

  // Select book
  const selection = await question('Select book number (or press Enter to cancel): ');
  if (!selection.trim()) {
    console.log('Cancelled.\n');
    return;
  }

  const bookIndex = parseInt(selection, 10) - 1;
  if (isNaN(bookIndex) || bookIndex < 0 || bookIndex >= books.length) {
    console.log('Invalid selection.\n');
    return;
  }

  const selectedBook = books[bookIndex];
  console.log(`\nCurrent shelf: ${selectedBook.shelf}`);
  console.log(`Options: ${Object.keys(shelfDirs).join(', ')}`);

  const newShelf = await question('Move to: ');
  if (!newShelf.trim()) {
    console.log('Cancelled.\n');
    return;
  }

  if (!shelfDirs[newShelf]) {
    console.log('Invalid shelf.\n');
    return;
  }

  if (newShelf === selectedBook.shelf) {
    console.log('Book is already on that shelf.\n');
    return;
  }

  try {
    const newPath = moveBook(selectedBook.filePath, newShelf, shelfDirs);
    console.log(`\n✓ Moved to books/${shelfDirs[newShelf]}/${selectedBook.filename}\n`);
  } catch (err) {
    console.error(`\nError moving book: ${err.message}\n`);
  }
}

// ============================================
// Add Book Flow (with lookup)
// ============================================

async function promptWithDefault(prompt, defaultValue, validator) {
  const displayDefault = defaultValue !== undefined && defaultValue !== '' ? defaultValue : '';
  const fullPrompt = displayDefault ? `${prompt} [${displayDefault}]: ` : `${prompt}: `;

  while (true) {
    const answer = await question(fullPrompt);
    const value = answer.trim() || displayDefault;

    if (validator) {
      try {
        return validator(value);
      } catch (err) {
        console.log(`  Error: ${err.message}. Please try again.`);
      }
    } else {
      return value;
    }
  }
}

async function addBookFlow() {
  console.log('\nAdd a New Book');
  console.log('--------------\n');

  const config = loadConfig();
  const shelfDirs = getShelfDirs(config);
  const shelfIds = Object.keys(shelfDirs);

  let bookData = {};

  // Search for book or manual entry
  const searchQuery = await question('Search for book (or press Enter for manual entry): ');

  if (searchQuery.trim()) {
    const results = await lookupBook(searchQuery.trim());

    if (results.length === 0) {
      console.log('  No results found. Proceeding with manual entry.\n');
    } else if (results.length === 1) {
      bookData = results[0];
      console.log(`\n  Found: "${bookData.title}"${bookData.author ? ` by ${bookData.author}` : ''}\n`);
    } else {
      console.log('\n  Results:');
      results.forEach((result, index) => {
        console.log(`  ${index + 1}. "${result.title}"${result.author ? ` by ${result.author}` : ''}`);
      });
      console.log();

      const selection = await question('  Select number (or press Enter to skip): ');
      const selectedIndex = parseInt(selection, 10) - 1;

      if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < results.length) {
        bookData = results[selectedIndex];
        console.log(`\n  Selected: "${bookData.title}"\n`);
      } else {
        console.log('  Proceeding with manual entry.\n');
      }
    }
  }

  // Edit/accept each field with defaults from lookup
  const title = await promptWithDefault(
    'Title',
    bookData.title,
    val => validateRequired(val, 'Title')
  );

  const author = await promptWithDefault(
    'Author',
    bookData.author,
    val => validateRequired(val, 'Author')
  );

  console.log(`  Categories: ${CATEGORIES.join(', ')}`);
  const category = await promptWithDefault(
    'Category',
    '',
    val => validateRequired(val, 'Category')
  );

  const publishDate = await promptWithDefault(
    'Publish Date (YYYY-MM-DD)',
    bookData.publishDate,
    val => validateDate(validateRequired(val, 'Publish Date'))
  );

  const pages = await promptWithDefault(
    'Pages',
    bookData.pages ? String(bookData.pages) : '',
    val => validateNumber(val, 'Pages')
  );

  const cover = await promptWithDefault(
    'Cover URL',
    bookData.cover,
    val => validateRequired(val, 'Cover URL')
  );

  const link = await promptWithDefault(
    'Link',
    bookData.link,
    val => validateRequired(val, 'Link')
  );

  let clickBehavior = await question('Click Behavior (overlay/redirect) [overlay]: ');
  clickBehavior = clickBehavior.trim() || 'overlay';
  if (!['overlay', 'redirect'].includes(clickBehavior)) {
    clickBehavior = 'overlay';
  }

  console.log(`  Options: ${shelfIds.join(', ')}`);
  const defaultShelf = shelfIds.includes('good') ? 'good' : shelfIds[0];
  let shelf = await question(`Shelf (${shelfIds.join('/')}) [${defaultShelf}]: `);
  shelf = shelf.trim() || defaultShelf;
  if (!shelfDirs[shelf]) {
    console.log(`  Invalid shelf, defaulting to "${defaultShelf}"`);
    shelf = defaultShelf;
  }

  const book = {
    title,
    author,
    category,
    publishDate,
    pages,
    cover,
    link,
    clickBehavior
  };

  const filename = `${toKebabCase(title)}.json`;
  const shelfDir = shelfDirs[shelf];
  const filePath = path.join(ROOT_DIR, 'books', shelfDir, filename);

  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, JSON.stringify(book, null, 2) + '\n');

  console.log(`\n✓ Saved to books/${shelfDir}/${filename}\n`);
}

// ============================================
// Main Entry Point
// ============================================

async function main() {
  const args = process.argv.slice(2);

  try {
    if (args.includes('--move')) {
      await moveBookFlow();
    } else {
      await addBookFlow();
    }
    rl.close();
    process.exit(0);
  } catch (err) {
    console.error(`\nError: ${err.message}\n`);
    rl.close();
    process.exit(1);
  }
}

main();
