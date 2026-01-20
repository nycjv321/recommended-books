import { useState, useEffect } from 'react';
import type { Book, BookWithMeta, Shelf, OpenLibrarySearchResult } from '@/types';
import { CATEGORIES } from '@/lib/books';
import { toKebabCase } from '@/lib/config';
import { getCoverUrl, openLibraryResultToBook } from '@/lib/open-library';

interface BookFormProps {
  book?: BookWithMeta;
  shelves: Shelf[];
  onClose: () => void;
  onSave: () => void;
}

export default function BookForm({ book, shelves, onClose, onSave }: BookFormProps) {
  const [formData, setFormData] = useState<Partial<Book>>({
    title: '',
    author: '',
    category: '',
    publishDate: '',
    pages: undefined,
    cover: '',
    coverLocal: '',
    notes: '',
    link: '',
    clickBehavior: 'overlay'
  });
  const [selectedShelf, setSelectedShelf] = useState(book?.shelfId || shelves[0]?.id || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OpenLibrarySearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title,
        author: book.author,
        category: book.category,
        publishDate: book.publishDate,
        pages: book.pages,
        cover: book.cover,
        coverLocal: book.coverLocal,
        notes: book.notes,
        link: book.link,
        clickBehavior: book.clickBehavior
      });
      setSelectedShelf(book.shelfId);
    }
  }, [book]);

  async function handleSearch() {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setError('');

    try {
      const results = await window.electronAPI.searchOpenLibrary(searchQuery);
      setSearchResults(results);
    } catch (err) {
      setError('Failed to search Open Library');
    } finally {
      setSearching(false);
    }
  }

  function handleSelectResult(result: OpenLibrarySearchResult) {
    const bookData = openLibraryResultToBook(result);
    setFormData({
      ...formData,
      title: bookData.title,
      author: bookData.author,
      publishDate: bookData.publishDate,
      pages: bookData.pages,
      cover: bookData.cover,
      link: bookData.link,
    });
    setSearchResults([]);
    setSearchQuery('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!formData.title?.trim()) {
      setError('Title is required');
      return;
    }
    if (!formData.author?.trim()) {
      setError('Author is required');
      return;
    }
    if (!selectedShelf) {
      setError('Please select a shelf');
      return;
    }

    setSaving(true);

    try {
      const bookData: Book = {
        title: formData.title.trim(),
        author: formData.author.trim(),
        category: formData.category?.trim() || 'Other',
        publishDate: formData.publishDate || '',
        pages: formData.pages,
        cover: formData.cover?.trim() || undefined,
        coverLocal: formData.coverLocal?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
        link: formData.link?.trim() || undefined,
        clickBehavior: formData.clickBehavior || 'overlay'
      };

      // Determine the filename
      const fileName = book?.fileName || `${toKebabCase(bookData.title)}.json`;

      // If editing and shelf changed, move first
      if (book && book.shelfId !== selectedShelf) {
        await window.electronAPI.moveBook(book.filePath, selectedShelf);
      }

      // Save the book
      await window.electronAPI.saveBook(selectedShelf, fileName, bookData);

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save book');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{book ? 'Edit Book' : 'Add Book'}</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}

            {!book && (
              <div className="card" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search Open Library..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearch();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleSearch}
                    disabled={searching}
                  >
                    {searching ? 'Searching...' : 'Search'}
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div className="search-results" style={{ marginTop: '12px' }}>
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        className="search-result-item"
                        onClick={() => handleSelectResult(result)}
                      >
                        {result.cover_i ? (
                          <img
                            src={getCoverUrl(result.cover_i, 'S')}
                            alt=""
                            className="search-result-cover"
                          />
                        ) : (
                          <div className="search-result-cover" style={{ background: 'var(--color-bg)' }} />
                        )}
                        <div className="search-result-info">
                          <div className="search-result-title">{result.title}</div>
                          <div className="search-result-author">
                            {result.author_name?.join(', ') || 'Unknown author'}
                          </div>
                          {result.first_publish_year && (
                            <div className="search-result-year">{result.first_publish_year}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ flex: 1 }}>
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Author *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.author || ''}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={formData.category || ''}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Shelf *</label>
                    <select
                      className="form-select"
                      value={selectedShelf}
                      onChange={(e) => setSelectedShelf(e.target.value)}
                      required
                    >
                      {shelves.map(shelf => (
                        <option key={shelf.id} value={shelf.id}>{shelf.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Publish Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.publishDate || ''}
                      onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Pages</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.pages || ''}
                      onChange={(e) => setFormData({ ...formData, pages: e.target.value ? parseInt(e.target.value) : undefined })}
                      min="1"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Cover URL</label>
                  <input
                    type="url"
                    className="form-input"
                    value={formData.cover || ''}
                    onChange={(e) => setFormData({ ...formData, cover: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Link</label>
                  <input
                    type="url"
                    className="form-input"
                    value={formData.link || ''}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Click Behavior</label>
                  <select
                    className="form-select"
                    value={formData.clickBehavior || 'overlay'}
                    onChange={(e) => setFormData({ ...formData, clickBehavior: e.target.value as 'overlay' | 'redirect' })}
                  >
                    <option value="overlay">Show overlay</option>
                    <option value="redirect">Redirect to link</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-textarea"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Optional notes about this book..."
                  />
                </div>
              </div>

              <div style={{ width: '140px' }}>
                <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Preview</label>
                {formData.cover ? (
                  <img
                    src={formData.coverLocal || formData.cover}
                    alt="Cover preview"
                    className="cover-preview"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="cover-preview-placeholder">No cover</div>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : (book ? 'Save Changes' : 'Add Book')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
