import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { BookWithMeta, Config } from '@/types';
import { useBookRepository, useConfigRepository } from '@/repositories';

export default function Dashboard() {
  const bookRepo = useBookRepository();
  const configRepo = useConfigRepository();

  const [books, setBooks] = useState<BookWithMeta[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [booksData, configData] = await Promise.all([
          bookRepo.getAll(),
          configRepo.get()
        ]);
        setBooks(booksData);
        setConfig(configData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [bookRepo, configRepo]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const totalBooks = books.length;
  const totalShelves = config?.shelves.length || 0;

  const booksByShelf = config?.shelves.map(shelf => ({
    shelf,
    count: books.filter(b => b.shelfId === shelf.id).length
  })) || [];

  const recentBooks = [...books]
    .slice(0, 5);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of your book collection</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Books</div>
          <div className="stat-value">{totalBooks}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Shelves</div>
          <div className="stat-value">{totalShelves}</div>
        </div>
        {booksByShelf.slice(0, 2).map(({ shelf, count }) => (
          <div key={shelf.id} className="stat-card">
            <div className="stat-label">{shelf.label}</div>
            <div className="stat-value">{count}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Quick Actions</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link to="/books" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New Book
            </Link>
            <Link to="/preview" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Build Site
            </Link>
            <Link to="/preview" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview Site
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Shelf Summary</h2>
            <Link to="/shelves" className="btn btn-sm btn-secondary">Manage</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {booksByShelf.map(({ shelf, count }) => (
              <div
                key={shelf.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: 'var(--color-bg)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <span>{shelf.label}</span>
                <span className="badge">{count} books</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {recentBooks.length > 0 && (
        <div className="card" style={{ marginTop: '16px' }}>
          <div className="card-header">
            <h2 className="card-title">Books</h2>
            <Link to="/books" className="btn btn-sm btn-secondary">View All</Link>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Shelf</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {recentBooks.map((book) => (
                <tr key={book.filePath}>
                  <td style={{ fontWeight: 500 }}>{book.title}</td>
                  <td>{book.author}</td>
                  <td>
                    <span className="badge">{book.shelfLabel}</span>
                  </td>
                  <td>{book.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
