import { describe, it, expect } from 'vitest';
import { shelfIdToFolder, toKebabCase } from './config';

describe('shelfIdToFolder', () => {
  it('converts camelCase to kebab-case', () => {
    expect(shelfIdToFolder('goodReads')).toBe('good-reads');
    expect(shelfIdToFolder('topFiveReads')).toBe('top-five-reads');
    expect(shelfIdToFolder('currentReads')).toBe('current-reads');
  });

  it('handles single word IDs', () => {
    expect(shelfIdToFolder('good')).toBe('good');
    expect(shelfIdToFolder('top')).toBe('top');
  });

  it('handles already lowercase IDs', () => {
    expect(shelfIdToFolder('goodreads')).toBe('goodreads');
  });

  it('handles IDs starting with uppercase', () => {
    expect(shelfIdToFolder('GoodReads')).toBe('good-reads');
  });

  it('handles multiple consecutive uppercase letters', () => {
    expect(shelfIdToFolder('myAPIBooks')).toBe('my-a-p-i-books');
  });

  it('handles empty string', () => {
    expect(shelfIdToFolder('')).toBe('');
  });
});

describe('toKebabCase', () => {
  it('converts spaces to hyphens', () => {
    expect(toKebabCase('Good Reads')).toBe('good-reads');
    expect(toKebabCase('Top Five Reads')).toBe('top-five-reads');
  });

  it('converts to lowercase', () => {
    expect(toKebabCase('GOOD READS')).toBe('good-reads');
    expect(toKebabCase('GoodReads')).toBe('goodreads');
  });

  it('removes special characters', () => {
    expect(toKebabCase("Good Read's!")).toBe('good-reads');
    expect(toKebabCase('Top 5 Reads')).toBe('top-5-reads');
    expect(toKebabCase('Books & More')).toBe('books-more');
  });

  it('collapses multiple spaces/hyphens', () => {
    expect(toKebabCase('Good   Reads')).toBe('good-reads');
    expect(toKebabCase('Good--Reads')).toBe('good-reads');
    expect(toKebabCase('Good - Reads')).toBe('good-reads');
  });

  it('handles empty string', () => {
    expect(toKebabCase('')).toBe('');
  });

  it('preserves numbers', () => {
    expect(toKebabCase('Top 5 Reads')).toBe('top-5-reads');
    expect(toKebabCase('2024 Reading List')).toBe('2024-reading-list');
  });

  it('handles strings with only special characters', () => {
    expect(toKebabCase('!!!@@@')).toBe('');
  });

  it('preserves existing hyphens', () => {
    expect(toKebabCase('good-reads')).toBe('good-reads');
  });
});
