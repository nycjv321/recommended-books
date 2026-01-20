/**
 * Recommended Books - Application Logic
 * Handles loading books, rendering the bookshelf, and modal interactions
 */

(function () {
  "use strict";

  // Configuration
  const BOOKS_PER_SHELF = 6;
  const BOOKS_INDEX_PATH = "books/index.json";
  const CONFIG_PATH = "config.json";

  // Shelf configuration
  const SHELF_ORDER = ["top5", "current", "good"];
  let SHELF_LABELS = {
    top5: "Top 5 Reads",
    good: "Good Reads",
    current: "Current and Future Reads",
  };
  const SHELF_FOLDERS = {
    "top-5-reads": "top5",
    "good-reads": "good",
    "current-and-future-reads": "current",
  };
  const INITIAL_BOOKS_TO_SHOW = 12;

  /**
   * Load configuration from config.json
   */
  async function loadConfig() {
    try {
      const response = await fetch(CONFIG_PATH);
      if (!response.ok) {
        console.warn("Could not load config.json, using defaults");
        return;
      }
      const config = await response.json();
      if (config.shelves) {
        SHELF_LABELS = config.shelves;
      }
    } catch (error) {
      console.warn("Error loading config:", error);
    }
  }

  // DOM Elements
  const bookshelf = document.getElementById("bookshelf");
  const overlay = document.getElementById("overlay");
  const modalClose = document.getElementById("modal-close");

  // Modal elements
  const modalElements = {
    coverImg: document.getElementById("modal-cover-img"),
    title: document.getElementById("modal-title"),
    author: document.getElementById("modal-author"),
    category: document.querySelector("#meta-category .meta-value"),
    pages: document.querySelector("#meta-pages .meta-value"),
    published: document.querySelector("#meta-published .meta-value"),
    readContainer: document.getElementById("meta-read"),
    read: document.querySelector("#meta-read .meta-value"),
    notesContainer: document.getElementById("modal-notes"),
    notes: document.getElementById("modal-notes-text"),
    link: document.getElementById("modal-link"),
  };

  /**
   * Initialize the application
   */
  async function init() {
    showLoading();

    try {
      // Load config first (for shelf labels)
      await loadConfig();

      const books = await loadBooks();

      if (books.length === 0) {
        showEmptyState();
        return;
      }

      renderBookshelf(books);
      setupEventListeners();
    } catch (error) {
      console.error("Failed to load books:", error);
      showError(error.message);
    }
  }

  /**
   * Load the book index and all book data
   */
  async function loadBooks() {
    // Load the index file
    const indexResponse = await fetch(BOOKS_INDEX_PATH);

    if (!indexResponse.ok) {
      throw new Error(
        "Could not load books index. Make sure books/index.json exists.",
      );
    }

    const bookFiles = await indexResponse.json();

    // Load each book file
    const bookPromises = bookFiles.map(async (filepath) => {
      try {
        const response = await fetch(`books/${filepath}`);
        if (!response.ok) {
          console.warn(`Failed to load book: ${filepath}`);
          return null;
        }
        const book = await response.json();

        // Derive shelf from folder path if not explicitly set
        if (!book.shelf) {
          const folder = filepath.split("/")[0];
          book.shelf = SHELF_FOLDERS[folder] || "good";
        }

        return book;
      } catch (error) {
        console.warn(`Error loading book ${filepath}:`, error);
        return null;
      }
    });

    const books = await Promise.all(bookPromises);

    // Filter out any failed loads
    return books.filter((book) => book !== null);
  }

  /**
   * Render the bookshelf with all books grouped by shelf
   */
  function renderBookshelf(books) {
    bookshelf.innerHTML = "";

    // Group books by shelf
    const booksByShelf = {};
    SHELF_ORDER.forEach((shelfId) => {
      booksByShelf[shelfId] = [];
    });

    books.forEach((book) => {
      const shelfId = book.shelf || "good";
      if (booksByShelf[shelfId]) {
        booksByShelf[shelfId].push(book);
      } else {
        booksByShelf["good"].push(book);
      }
    });

    // Render each shelf section
    SHELF_ORDER.forEach((shelfId) => {
      const shelfBooks = booksByShelf[shelfId];
      if (shelfBooks.length === 0) return;

      const section = document.createElement("section");
      section.className = "shelf-section";

      const header = document.createElement("h2");
      header.className = "shelf-header";
      header.textContent = SHELF_LABELS[shelfId];
      section.appendChild(header);

      // For "good" shelf, limit initial display and add Show More
      const isGoodShelf = shelfId === "good";
      const hasMoreBooks =
        isGoodShelf && shelfBooks.length > INITIAL_BOOKS_TO_SHOW;
      const booksToShow = hasMoreBooks
        ? shelfBooks.slice(0, INITIAL_BOOKS_TO_SHOW)
        : shelfBooks;
      const hiddenBooks = hasMoreBooks
        ? shelfBooks.slice(INITIAL_BOOKS_TO_SHOW)
        : [];

      // Render visible books
      renderBooksInRows(booksToShow, section);

      // Create hidden container for remaining books
      if (hasMoreBooks) {
        const hiddenContainer = document.createElement("div");
        hiddenContainer.className = "hidden-books";
        hiddenContainer.style.display = "none";
        renderBooksInRows(hiddenBooks, hiddenContainer);
        section.appendChild(hiddenContainer);

        // Add Show More button
        const showMoreBtn = document.createElement("button");
        showMoreBtn.className = "show-more-btn";
        showMoreBtn.textContent = `Show ${hiddenBooks.length} More Books`;
        showMoreBtn.addEventListener("click", () => {
          hiddenContainer.style.display = "block";
          showMoreBtn.style.display = "none";
        });
        section.appendChild(showMoreBtn);
      }

      bookshelf.appendChild(section);
    });
  }

  /**
   * Helper to render books in rows within a container
   */
  function renderBooksInRows(books, container) {
    for (let i = 0; i < books.length; i += BOOKS_PER_SHELF) {
      const rowBooks = books.slice(i, i + BOOKS_PER_SHELF);

      const shelfRow = document.createElement("div");
      shelfRow.className = "shelf-row";

      const booksContainer = document.createElement("div");
      booksContainer.className = "books-container";

      rowBooks.forEach((book) => {
        const bookElement = createBookElement(book);
        booksContainer.appendChild(bookElement);
      });

      shelfRow.appendChild(booksContainer);
      container.appendChild(shelfRow);
    }
  }

  /**
   * Create a single book element
   */
  function createBookElement(book) {
    const bookDiv = document.createElement("div");
    bookDiv.className = "book";
    bookDiv.tabIndex = 0;
    bookDiv.setAttribute("role", "button");
    bookDiv.setAttribute("aria-label", `${book.title} by ${book.author}`);

    const coverImg = document.createElement("img");
    coverImg.className = "book-cover";
    coverImg.src = book.coverLocal
      ? `books/${book.coverLocal}`
      : book.cover;
    coverImg.alt = `Cover of ${book.title}`;
    coverImg.loading = "lazy";

    // Handle image load errors
    coverImg.onerror = function () {
      this.src =
        "data:image/svg+xml," +
        encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="120" height="180" viewBox="0 0 120 180">
                    <rect fill="#8B5A2B" width="120" height="180"/>
                    <text x="60" y="90" text-anchor="middle" fill="#FDF5E6" font-family="Georgia" font-size="12">
                        ${book.title.substring(0, 15)}${book.title.length > 15 ? "..." : ""}
                    </text>
                </svg>
            `);
    };

    bookDiv.appendChild(coverImg);

    // Store book data on the element
    bookDiv.bookData = book;

    return bookDiv;
  }

  /**
   * Setup all event listeners
   */
  function setupEventListeners() {
    // Book click/keyboard events (delegated)
    bookshelf.addEventListener("click", handleBookInteraction);
    bookshelf.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleBookInteraction(e);
      }
    });

    // Modal close events
    modalClose.addEventListener("click", closeModal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    });

    // Escape key to close modal
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("active")) {
        closeModal();
      }
    });
  }

  /**
   * Handle book click/keyboard interaction
   */
  function handleBookInteraction(event) {
    const bookElement = event.target.closest(".book");
    if (!bookElement || !bookElement.bookData) return;

    const book = bookElement.bookData;

    // Check click behavior
    if (book.clickBehavior === "redirect" && book.link) {
      window.open(book.link, "_blank", "noopener,noreferrer");
    } else {
      openModal(book);
    }
  }

  /**
   * Open the modal with book details
   */
  function openModal(book) {
    // Populate modal content
    modalElements.coverImg.src = book.coverLocal
      ? `books/${book.coverLocal}`
      : book.cover;
    modalElements.coverImg.alt = `Cover of ${book.title}`;
    modalElements.coverImg.onerror = function () {
      this.src =
        "data:image/svg+xml," +
        encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
            <rect fill="#8B5A2B" width="200" height="300"/>
            <text x="100" y="150" text-anchor="middle" fill="#FDF5E6" font-family="Georgia" font-size="16">
              ${book.title.substring(0, 20)}${book.title.length > 20 ? "..." : ""}
            </text>
          </svg>
        `);
    };
    modalElements.title.textContent = book.title;
    modalElements.author.textContent = `by ${book.author}`;
    modalElements.category.textContent = book.category || "N/A";

    // Hide pages when < 5 (likely missing/placeholder data)
    const pagesContainer = document.getElementById("meta-pages");
    if (book.pages && book.pages >= 5) {
      pagesContainer.style.display = "flex";
      modalElements.pages.textContent = book.pages.toLocaleString();
    } else {
      pagesContainer.style.display = "none";
    }

    modalElements.published.textContent = formatDate(book.publishDate);

    // Read date (optional)
    if (book.readDate) {
      modalElements.readContainer.style.display = "flex";
      modalElements.read.textContent = formatDate(book.readDate);
    } else {
      modalElements.readContainer.style.display = "none";
    }

    // Notes (optional)
    if (book.notes && book.notes.trim()) {
      modalElements.notesContainer.style.display = "block";
      modalElements.notes.textContent = book.notes;
    } else {
      modalElements.notesContainer.style.display = "none";
    }

    // Link
    if (book.link) {
      modalElements.link.href = book.link;
      modalElements.link.style.display = "inline-flex";
    } else {
      modalElements.link.style.display = "none";
    }

    // Show overlay
    overlay.classList.add("active");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    // Focus management
    modalClose.focus();
  }

  /**
   * Close the modal
   */
  function closeModal() {
    overlay.classList.remove("active");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    // Return focus to the bookshelf
    const firstBook = bookshelf.querySelector(".book");
    if (firstBook) {
      firstBook.focus();
    }
  }

  /**
   * Format a date string for display
   */
  function formatDate(dateString) {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Show loading state
   */
  function showLoading() {
    bookshelf.innerHTML = '<div class="loading">Loading your library</div>';
  }

  /**
   * Show empty state
   */
  function showEmptyState() {
    bookshelf.innerHTML = `
            <div class="empty-state">
                <h2>No books yet</h2>
                <p>Add your first book by creating a JSON file in the books/ folder.</p>
            </div>
        `;
  }

  /**
   * Show error state
   */
  function showError(message) {
    bookshelf.innerHTML = `
            <div class="empty-state">
                <h2>Unable to load books</h2>
                <p>${message}</p>
                <p style="margin-top: 1rem; font-size: 0.9rem;">
                    Tip: If running locally, you may need to use a local server (e.g., python -m http.server)
                </p>
            </div>
        `;
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /**
   * Theme Toggle Functionality
   */
  const themeToggle = document.getElementById("theme-toggle");
  const html = document.documentElement;

  // Check for saved theme preference or default to light
  function getThemePreference() {
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    return "light"; // Default to light mode
  }

  // Apply theme
  function setTheme(theme) {
    if (theme === "dark") {
      html.setAttribute("data-theme", "dark");
    } else {
      html.removeAttribute("data-theme");
    }
    localStorage.setItem("theme", theme);
  }

  // Initialize theme
  setTheme(getThemePreference());

  // Toggle theme on button click
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const currentTheme = html.getAttribute("data-theme");
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      setTheme(newTheme);
    });
  }
})();
