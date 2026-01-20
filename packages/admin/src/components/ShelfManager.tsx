import { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Shelf, BookWithMeta, Config } from '@/types';

interface SortableShelfProps {
  shelf: Shelf;
  bookCount: number;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableShelf({ shelf, bookCount, onEdit, onDelete }: SortableShelfProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: shelf.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="shelf-card"
    >
      <div className="shelf-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            {...attributes}
            {...listeners}
            style={{ cursor: 'grab', padding: '4px' }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>
          <div>
            <div className="shelf-label">{shelf.label}</div>
            <div className="shelf-folder">{shelf.folder}/</div>
          </div>
        </div>
        <div className="shelf-count">{bookCount}</div>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button className="btn btn-sm btn-secondary" onClick={onEdit}>
          Edit
        </button>
        <button
          className="btn btn-sm btn-secondary"
          onClick={onDelete}
          disabled={bookCount > 0}
          title={bookCount > 0 ? 'Cannot delete shelf with books' : 'Delete shelf'}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

interface ShelfFormModalProps {
  shelf?: Shelf;
  onClose: () => void;
  onSave: (shelf: Shelf) => void;
}

function ShelfFormModal({ shelf, onClose, onSave }: ShelfFormModalProps) {
  const [formData, setFormData] = useState({
    id: shelf?.id || '',
    label: shelf?.label || '',
    folder: shelf?.folder || ''
  });
  const [error, setError] = useState('');

  const isEditing = !!shelf;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!formData.id.trim()) {
      setError('ID is required');
      return;
    }
    if (!formData.label.trim()) {
      setError('Label is required');
      return;
    }

    // Auto-generate folder from id if not provided
    const folder = formData.folder.trim() ||
      formData.id.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');

    onSave({
      id: formData.id.trim(),
      label: formData.label.trim(),
      folder
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isEditing ? 'Edit Shelf' : 'Add Shelf'}</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <label className="form-label">ID *</label>
              <input
                type="text"
                className="form-input"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                disabled={isEditing}
                placeholder="e.g., top5, good, current"
              />
              <p className="form-hint">Used internally to identify the shelf</p>
            </div>

            <div className="form-group">
              <label className="form-label">Label *</label>
              <input
                type="text"
                className="form-input"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g., Top 5 Reads"
              />
              <p className="form-hint">Displayed on the website</p>
            </div>

            <div className="form-group">
              <label className="form-label">Folder</label>
              <input
                type="text"
                className="form-input"
                value={formData.folder}
                onChange={(e) => setFormData({ ...formData, folder: e.target.value })}
                placeholder="e.g., top-5-reads"
                disabled={isEditing}
              />
              <p className="form-hint">Folder name in books/. Auto-generated if empty.</p>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? 'Save Changes' : 'Add Shelf'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ShelfManager() {
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [books, setBooks] = useState<BookWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingShelf, setEditingShelf] = useState<Shelf | null>(null);
  const [error, setError] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function loadData() {
    try {
      const [configData, booksData] = await Promise.all([
        window.electronAPI.getConfig(),
        window.electronAPI.getBooks()
      ]);
      setShelves(configData.shelves);
      setBooks(booksData);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function getBookCount(shelfId: string): number {
    return books.filter(b => b.shelfId === shelfId).length;
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = shelves.findIndex(s => s.id === active.id);
      const newIndex = shelves.findIndex(s => s.id === over.id);
      const newShelves = arrayMove(shelves, oldIndex, newIndex);

      setShelves(newShelves);

      try {
        const config = await window.electronAPI.getConfig();
        config.shelves = newShelves;
        await window.electronAPI.saveConfig(config);
      } catch (err) {
        setError('Failed to save shelf order');
        await loadData();
      }
    }
  }

  async function handleAddShelf(shelf: Shelf) {
    try {
      // Check for duplicate id
      if (shelves.some(s => s.id === shelf.id)) {
        setError(`Shelf with id "${shelf.id}" already exists`);
        return;
      }

      await window.electronAPI.createShelf(shelf);

      const config = await window.electronAPI.getConfig();
      config.shelves.push(shelf);
      await window.electronAPI.saveConfig(config);

      setShowAddModal(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add shelf');
    }
  }

  async function handleEditShelf(updatedShelf: Shelf) {
    try {
      const config = await window.electronAPI.getConfig();
      const index = config.shelves.findIndex(s => s.id === updatedShelf.id);
      if (index !== -1) {
        config.shelves[index] = updatedShelf;
        await window.electronAPI.saveConfig(config);
      }

      setEditingShelf(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update shelf');
    }
  }

  async function handleDeleteShelf(shelf: Shelf) {
    const bookCount = getBookCount(shelf.id);
    if (bookCount > 0) {
      setError(`Cannot delete "${shelf.label}" - it contains ${bookCount} book(s)`);
      return;
    }

    if (!confirm(`Delete shelf "${shelf.label}"? This cannot be undone.`)) return;

    try {
      await window.electronAPI.deleteShelf(shelf.id);

      const config = await window.electronAPI.getConfig();
      config.shelves = config.shelves.filter(s => s.id !== shelf.id);
      await window.electronAPI.saveConfig(config);

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete shelf');
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
        <h1 className="page-title">Shelves</h1>
        <p className="page-subtitle">Organize your book categories</p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          {error}
          <button
            style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => setError('')}
          >
            &times;
          </button>
        </div>
      )}

      <div className="toolbar">
        <div className="toolbar-left">
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            Drag to reorder shelves
          </span>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Shelf
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={shelves.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="shelf-grid">
            {shelves.map((shelf) => (
              <SortableShelf
                key={shelf.id}
                shelf={shelf}
                bookCount={getBookCount(shelf.id)}
                onEdit={() => setEditingShelf(shelf)}
                onDelete={() => handleDeleteShelf(shelf)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {shelves.length === 0 && (
        <div className="empty-state">
          <svg className="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          <h3 className="empty-state-title">No shelves</h3>
          <p className="empty-state-text">Create your first shelf to organize your books.</p>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            Add Shelf
          </button>
        </div>
      )}

      {showAddModal && (
        <ShelfFormModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddShelf}
        />
      )}

      {editingShelf && (
        <ShelfFormModal
          shelf={editingShelf}
          onClose={() => setEditingShelf(null)}
          onSave={handleEditShelf}
        />
      )}
    </div>
  );
}
