import type { Shelf, Config } from '@/types';
import { getConfig, saveConfig, shelfIdToFolder } from './config';

export async function getShelves(): Promise<Shelf[]> {
  const config = await getConfig();
  return config.shelves;
}

export async function createShelf(shelf: Omit<Shelf, 'folder'> & { folder?: string }): Promise<void> {
  const config = await getConfig();

  // Check for duplicate id
  if (config.shelves.some(s => s.id === shelf.id)) {
    throw new Error(`Shelf with id "${shelf.id}" already exists`);
  }

  const newShelf: Shelf = {
    id: shelf.id,
    label: shelf.label,
    folder: shelf.folder || shelfIdToFolder(shelf.id)
  };

  config.shelves.push(newShelf);
  await saveConfig(config);

  // Create the folder via IPC
  await window.electronAPI.createShelf(newShelf);
}

export async function updateShelf(shelfId: string, updates: Partial<Omit<Shelf, 'id'>>): Promise<void> {
  const config = await getConfig();
  const shelfIndex = config.shelves.findIndex(s => s.id === shelfId);

  if (shelfIndex === -1) {
    throw new Error(`Shelf with id "${shelfId}" not found`);
  }

  config.shelves[shelfIndex] = {
    ...config.shelves[shelfIndex],
    ...updates
  };

  await saveConfig(config);
}

export async function deleteShelf(shelfId: string): Promise<void> {
  const config = await getConfig();
  const shelf = config.shelves.find(s => s.id === shelfId);

  if (!shelf) {
    throw new Error(`Shelf with id "${shelfId}" not found`);
  }

  // Check if shelf is empty (handled by main process)
  await window.electronAPI.deleteShelf(shelfId);

  // Remove from config
  config.shelves = config.shelves.filter(s => s.id !== shelfId);
  await saveConfig(config);
}

export async function reorderShelves(shelfIds: string[]): Promise<void> {
  const config = await getConfig();

  // Validate all shelf IDs exist
  const existingIds = new Set(config.shelves.map(s => s.id));
  for (const id of shelfIds) {
    if (!existingIds.has(id)) {
      throw new Error(`Shelf with id "${id}" not found`);
    }
  }

  // Reorder shelves based on provided order
  const shelfMap = new Map(config.shelves.map(s => [s.id, s]));
  config.shelves = shelfIds.map(id => shelfMap.get(id)!);

  await saveConfig(config);
  await window.electronAPI.reorderShelves(shelfIds);
}

export async function mergeShelf(sourceShelfId: string, targetShelfId: string): Promise<void> {
  const config = await getConfig();

  const sourceShelf = config.shelves.find(s => s.id === sourceShelfId);
  const targetShelf = config.shelves.find(s => s.id === targetShelfId);

  if (!sourceShelf) {
    throw new Error(`Source shelf with id "${sourceShelfId}" not found`);
  }
  if (!targetShelf) {
    throw new Error(`Target shelf with id "${targetShelfId}" not found`);
  }

  // Get all books in source shelf and move them
  const books = await window.electronAPI.getBooks();
  const sourceBooks = books.filter(b => b.shelfId === sourceShelfId);

  for (const book of sourceBooks) {
    await window.electronAPI.moveBook(book.filePath, targetShelfId);
  }

  // Delete the now-empty source shelf
  await deleteShelf(sourceShelfId);
}
