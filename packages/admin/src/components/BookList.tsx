import { useState, useEffect, useMemo, useCallback } from 'react';
import type { BookWithMeta, Shelf } from '@/types';
import { useBookRepository, useConfigRepository } from '@/repositories';
import BookForm from './BookForm';

export default function BookList() {
  const bookRepo = useBookRepository();
  const configRepo = useConfigRepository();

  const [books, setBooks] = useState<BookWithMeta[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShelf, setSelectedShelf] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBook, setEditingBook] = useState<BookWithMeta | null>(null);
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    try {
      const [booksData, configData] = await Promise.all([
        bookRepo.getAll(),
        configRepo.get()
      ]);
      setBooks(booksData);
      setShelves(configData.shelves);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [bookRepo, configRepo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredBooks = useMemo(() => {
    let result = books;

    if (selectedShelf !== 'all') {
      result = result.filter(b => b.shelfId === selectedShelf);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        b =>
          b.title.toLowerCase().includes(query) ||
          b.author.toLowerCase().includes(query) ||
          b.category.toLowerCase().includes(query)
      );
    }

    return result;
  }, [books, selectedShelf, searchQuery]);

  async function handleDelete(book: BookWithMeta) {
    if (!confirm(`Delete "${book.title}"? This cannot be undone.`)) return;

    try {
      await bookRepo.delete(book.filePath);
      await loadData();
    } catch (error) {
      console.error('Failed to delete book:', error);
      alert('Failed to delete book');
    }
  }

  async function handleMove(book: BookWithMeta, targetShelfId: string) {
    try {
      await bookRepo.move(book.filePath, targetShelfId);
      await loadData();
    } catch (error) {
      console.error('Failed to move book:', error);
      alert('Failed to move book');
    }
  }

  async function handleBulkMove(targetShelfId: string) {
    if (selectedBooks.size === 0) return;

    try {
      for (const filePath of selectedBooks) {
        await bookRepo.move(filePath, targetShelfId);
      }
      setSelectedBooks(new Set());
      await loadData();
    } catch (error) {
      console.error('Failed to move books:', error);
      alert('Failed to move some books');
    }
  }

  async function handleBulkDelete() {
    if (selectedBooks.size === 0) return;
    if (!confirm(`Delete ${selectedBooks.size} book(s)? This cannot be undone.`)) return;

    try {
      for (const filePath of selectedBooks) {
        await bookRepo.delete(filePath);
      }
      setSelectedBooks(new Set());
      await loadData();
    } catch (error) {
      console.error('Failed to delete books:', error);
      alert('Failed to delete some books');
    }
  }

  function toggleBookSelection(filePath: string) {
    const newSelected = new Set(selectedBooks);
    if (newSelected.has(filePath)) {
      newSelected.delete(filePath);
    } else {
      newSelected.add(filePath);
    }
    setSelectedBooks(newSelected);
  }

  function toggleSelectAll() {
    if (selectedBooks.size === filteredBooks.length) {
      setSelectedBooks(new Set());
    } else {
      setSelectedBooks(new Set(filteredBooks.map(b => b.filePath)));
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Books</h1>
        <p className="page-subtitle">Manage your book collection</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-container" style={{ marginBottom: 0, width: '300px' }}>
            <svg className="search-icon" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={selectedShelf}
            onChange={(e) => setSelectedShelf(e.target.value)}
          >
            <option value="all">All Shelves</option>
            {shelves.map(shelf => (
              <option key={shelf.id} value={shelf.id}>{shelf.label}</option>
            ))}
          </select>
        </div>
        <div className="toolbar-right">
          {selectedBooks.size > 0 && (
            <>
              <span className="badge">{selectedBooks.size} selected</span>
              <select
                className="form-select"
                style={{ width: 'auto' }}
                value=""
                onChange={(e) => {
                  if (e.target.value) handleBulkMove(e.target.value);
                }}
              >
                <option value="">Move to...</option>
                {shelves.map(shelf => (
                  <option key={shelf.id} value={shelf.id}>{shelf.label}</option>
                ))}
              </select>
              <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>
                Delete Selected
              </button>
            </>
          )}
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Book
          </button>
        </div>
      </div>

      {filteredBooks.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="empty-state-title">No books found</h3>
          <p className="empty-state-text">
            {searchQuery ? 'Try adjusting your search or filter.' : 'Add your first book to get started.'}
          </p>
          {!searchQuery && (
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              Add Book
            </button>
          )}
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={selectedBooks.size === filteredBooks.length && filteredBooks.length > 0}
              onChange={toggleSelectAll}
            />
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              {filteredBooks.length} book{filteredBooks.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="book-grid">
            {filteredBooks.map((book) => (
              <div
                key={book.filePath}
                className="book-card"
                style={{
                  position: 'relative',
                  border: selectedBooks.has(book.filePath) ? '2px solid var(--color-primary)' : undefined
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedBooks.has(book.filePath)}
                  onChange={() => toggleBookSelection(book.filePath)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    zIndex: 10
                  }}
                />
                <div onClick={() => setEditingBook(book)}>
                  {book.cover || book.coverLocal ? (
                    <img
                      src={book.coverLocal || book.cover}
                      alt={book.title}
                      className="book-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`book-cover-placeholder ${book.cover || book.coverLocal ? 'hidden' : ''}`}>
                    {book.title}
                  </div>
                  <div className="book-info">
                    <div className="book-title">{book.title}</div>
                    <div className="book-author">{book.author}</div>
                    <span className="book-shelf-badge">{book.shelfLabel}</span>
                  </div>
                </div>
                <div style={{
                  padding: '0 12px 12px',
                  display: 'flex',
                  gap: '8px'
                }}>
                  <select
                    className="form-select"
                    style={{ flex: 1, fontSize: '12px', padding: '6px 8px' }}
                    value={book.shelfId}
                    onChange={(e) => handleMove(book, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {shelves.map(shelf => (
                      <option key={shelf.id} value={shelf.id}>{shelf.label}</option>
                    ))}
                  </select>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(book);
                    }}
                    title="Delete"
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {(showAddModal || editingBook) && (
        <BookForm
          book={editingBook || undefined}
          shelves={shelves}
          onClose={() => {
            setShowAddModal(false);
            setEditingBook(null);
          }}
          onSave={async () => {
            setShowAddModal(false);
            setEditingBook(null);
            await loadData();
          }}
        />
      )}
    </div>
  );
}
