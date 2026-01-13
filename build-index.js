#!/usr/bin/env node

/**
 * Build script to generate the dist/ folder with all site files
 *
 * Usage:
 *   node build-index.js           # Build with real data from books/
 *   node build-index.js --sample  # Build with sample data from books-sample/
 */

const fs = require('fs');
const path = require('path');

// Check for --sample flag
const useSampleData = process.argv.includes('--sample');

const ROOT_DIR = __dirname;
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const CONFIG_FILE = path.join(ROOT_DIR, 'config.json');
const SOURCE_DIR = useSampleData
    ? path.join(ROOT_DIR, 'books-sample')
    : path.join(ROOT_DIR, 'books');

// Static files to copy to dist/
const STATIC_FILES = [
    'styles-minimalist.css',
    'app.js'
];

// Files that need placeholder replacement
const TEMPLATE_FILES = [
    'index.html'
];

// Shelf folders to scan for books
const SHELF_FOLDERS = [
    'top-5-reads',
    'good-reads',
    'current-and-future-reads'
];

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function copyFile(src, dest) {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
}

function loadConfig() {
    if (!fs.existsSync(CONFIG_FILE)) {
        console.error('Error: config.json not found');
        process.exit(1);
    }
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
}

function processTemplate(content, config) {
    return content
        .replace(/\{\{siteTitle\}\}/g, config.siteTitle)
        .replace(/\{\{siteSubtitle\}\}/g, config.siteSubtitle)
        .replace(/\{\{footerText\}\}/g, config.footerText);
}

function cleanDist() {
    if (fs.existsSync(DIST_DIR)) {
        fs.rmSync(DIST_DIR, { recursive: true });
    }
    ensureDir(DIST_DIR);
}

function copyStaticFiles(config) {
    // Copy static files (no processing)
    for (const file of STATIC_FILES) {
        const srcPath = path.join(ROOT_DIR, file);
        const destPath = path.join(DIST_DIR, file);
        if (fs.existsSync(srcPath)) {
            copyFile(srcPath, destPath);
        } else {
            console.warn(`Warning: Static file not found: ${file}`);
        }
    }

    // Process template files (placeholder replacement)
    for (const file of TEMPLATE_FILES) {
        const srcPath = path.join(ROOT_DIR, file);
        const destPath = path.join(DIST_DIR, file);
        if (fs.existsSync(srcPath)) {
            const content = fs.readFileSync(srcPath, 'utf-8');
            const processed = processTemplate(content, config);
            fs.writeFileSync(destPath, processed);
        } else {
            console.warn(`Warning: Template file not found: ${file}`);
        }
    }

    // Copy config.json to dist/ for app.js to use
    copyFile(CONFIG_FILE, path.join(DIST_DIR, 'config.json'));
}

function buildBooks() {
    const bookFiles = [];
    const distBooksDir = path.join(DIST_DIR, 'books');
    ensureDir(distBooksDir);

    for (const folder of SHELF_FOLDERS) {
        const folderPath = path.join(SOURCE_DIR, folder);

        if (!fs.existsSync(folderPath)) {
            console.warn(`Warning: Folder not found: ${folder}`);
            continue;
        }

        const files = fs.readdirSync(folderPath)
            .filter(file => file.endsWith('.json'))
            .map(file => `${folder}/${file}`);

        // Copy book JSON files to dist/books/
        for (const file of files) {
            const srcPath = path.join(SOURCE_DIR, file);
            const destPath = path.join(distBooksDir, file);
            copyFile(srcPath, destPath);
        }

        bookFiles.push(...files);
    }

    // Write index.json to dist/books/
    const indexPath = path.join(distBooksDir, 'index.json');
    fs.writeFileSync(indexPath, JSON.stringify(bookFiles, null, 4) + '\n');

    return bookFiles;
}

function build() {
    console.log('Building site...\n');

    // Load config
    const config = loadConfig();
    console.log('Loaded config.json');

    // Clean and create dist/
    cleanDist();
    console.log('Created dist/');

    // Copy static files and process templates
    copyStaticFiles(config);
    console.log(`Copied files: ${[...STATIC_FILES, ...TEMPLATE_FILES].join(', ')}`);
    console.log('Processed templates with config values');

    // Build books
    const bookFiles = buildBooks();

    const dataSource = useSampleData ? 'sample' : 'real';
    console.log(`\nGenerated dist/books/index.json (${dataSource} data)`);
    console.log(`Source: ${SOURCE_DIR}`);
    console.log(`Found ${bookFiles.length} books:`);

    for (const folder of SHELF_FOLDERS) {
        const count = bookFiles.filter(f => f.startsWith(folder)).length;
        console.log(`  - ${folder}: ${count} books`);
    }

    console.log('\nBuild complete! Serve with:');
    console.log('  npx serve dist');
    console.log('  # or');
    console.log('  cd dist && python -m http.server 8080');
}

build();
