#!/usr/bin/env node

/**
 * Download Book Covers for Offline Use
 *
 * Usage:
 *   node scripts/download-covers.js           # Interactive mode
 *   node scripts/download-covers.js --all     # Download all without prompting
 *   node scripts/download-covers.js --check   # Report only (no downloads)
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const ROOT_DIR = path.join(__dirname, '..');
const BOOKS_DIR = path.join(ROOT_DIR, 'books');
const COVERS_DIR = path.join(BOOKS_DIR, 'covers');
const SHELF_FOLDERS = ['top-5-reads', 'good-reads', 'current-and-future-reads'];

/**
 * Convert string to kebab-case for safe filenames
 */
function toKebabCase(str) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 50); // Limit length
}

/**
 * Prompt user for input
 */
function question(prompt) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            rl.close();
            resolve(answer.trim().toLowerCase());
        });
    });
}

/**
 * Download an image from URL to destination path
 */
function downloadImage(url, destPath, retries = 3) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;

        const request = protocol.get(url, (response) => {
            // Handle redirects
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                downloadImage(response.headers.location, destPath, retries)
                    .then(resolve)
                    .catch(reject);
                return;
            }

            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}`));
                return;
            }

            const file = fs.createWriteStream(destPath);
            response.pipe(file);

            file.on('finish', () => {
                file.close();
                resolve(destPath);
            });

            file.on('error', (err) => {
                fs.unlink(destPath, () => {}); // Clean up partial file
                reject(err);
            });
        });

        request.on('error', (err) => {
            if (retries > 0) {
                console.log(`  Retrying... (${retries} attempts left)`);
                setTimeout(() => {
                    downloadImage(url, destPath, retries - 1)
                        .then(resolve)
                        .catch(reject);
                }, 1000);
            } else {
                reject(err);
            }
        });

        request.setTimeout(30000, () => {
            request.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

/**
 * Scan all book JSONs and find books with external covers
 */
function scanBooksForExternalCovers() {
    const books = [];

    for (const folder of SHELF_FOLDERS) {
        const folderPath = path.join(BOOKS_DIR, folder);

        if (!fs.existsSync(folderPath)) {
            continue;
        }

        const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.json'));

        for (const file of files) {
            const filePath = path.join(folderPath, file);
            try {
                const book = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

                // Skip if already has local cover
                if (book.coverLocal) {
                    continue;
                }

                // Skip if no external cover URL
                if (!book.cover || !book.cover.startsWith('http')) {
                    continue;
                }

                books.push({
                    filePath,
                    book,
                    coverUrl: book.cover
                });
            } catch (err) {
                console.warn(`Warning: Could not parse ${file}: ${err.message}`);
            }
        }
    }

    return books;
}

/**
 * Generate unique filename for cover
 */
function generateCoverFilename(title, existingFiles) {
    let baseName = toKebabCase(title);
    let fileName = `${baseName}.jpg`;
    let counter = 1;

    // Handle filename collisions
    while (existingFiles.has(fileName)) {
        fileName = `${baseName}-${counter}.jpg`;
        counter++;
    }

    existingFiles.add(fileName);
    return fileName;
}

/**
 * Update book JSON with coverLocal field
 */
function updateBookJson(filePath, coverLocal) {
    const book = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    book.coverLocal = coverLocal;
    fs.writeFileSync(filePath, JSON.stringify(book, null, 2) + '\n');
}

/**
 * Main function
 */
async function main() {
    const args = process.argv.slice(2);
    const checkOnly = args.includes('--check');
    const downloadAll = args.includes('--all');

    console.log('Scanning books for external covers...\n');

    const books = scanBooksForExternalCovers();

    if (books.length === 0) {
        console.log('All covers are already downloaded!');
        return;
    }

    console.log(`Found ${books.length} book(s) with external covers:\n`);
    books.forEach((b, i) => {
        console.log(`  ${i + 1}. ${b.book.title}`);
    });
    console.log();

    if (checkOnly) {
        console.log('Run without --check to download covers.');
        return;
    }

    // Determine which books to download
    let booksToDownload = books;

    if (!downloadAll) {
        const answer = await question('Download all covers? (y/n/select): ');

        if (answer === 'n' || answer === 'no') {
            console.log('Aborted.');
            return;
        }

        if (answer === 'select' || answer === 's') {
            const selectAnswer = await question('Enter book numbers to download (comma-separated, e.g., 1,3,5): ');
            const indices = selectAnswer.split(',')
                .map(s => parseInt(s.trim(), 10) - 1)
                .filter(i => i >= 0 && i < books.length);

            if (indices.length === 0) {
                console.log('No valid selections. Aborted.');
                return;
            }

            booksToDownload = indices.map(i => books[i]);
            console.log(`\nSelected ${booksToDownload.length} book(s) to download.\n`);
        }
    }

    // Ensure covers directory exists
    if (!fs.existsSync(COVERS_DIR)) {
        fs.mkdirSync(COVERS_DIR, { recursive: true });
        console.log(`Created covers directory: ${COVERS_DIR}\n`);
    }

    // Track existing filenames to avoid collisions
    const existingFiles = new Set(
        fs.existsSync(COVERS_DIR) ? fs.readdirSync(COVERS_DIR) : []
    );

    // Download covers
    let successCount = 0;
    let failCount = 0;

    console.log('Downloading covers...\n');

    for (const { filePath, book, coverUrl } of booksToDownload) {
        const fileName = generateCoverFilename(book.title, existingFiles);
        const destPath = path.join(COVERS_DIR, fileName);
        const coverLocal = `covers/${fileName}`;

        process.stdout.write(`  ${book.title}... `);

        try {
            await downloadImage(coverUrl, destPath);
            updateBookJson(filePath, coverLocal);
            console.log('done');
            successCount++;
        } catch (err) {
            console.log(`failed (${err.message})`);
            failCount++;
            // Clean up partial file if it exists
            if (fs.existsSync(destPath)) {
                fs.unlinkSync(destPath);
            }
        }
    }

    // Summary
    console.log('\n--- Summary ---');
    console.log(`Downloaded: ${successCount}`);
    if (failCount > 0) {
        console.log(`Failed: ${failCount}`);
    }
    console.log('\nRun "node build-index.js" to include covers in the build.');
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
