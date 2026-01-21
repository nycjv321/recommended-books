export interface SampleDataResult {
  success: boolean;
  message: string;
  booksLoaded?: number;
  booksRemoved?: number;
}

export interface SampleDataRepository {
  checkExistingBooks(): Promise<{ count: number }>;
  load(): Promise<SampleDataResult>;
  remove(): Promise<SampleDataResult>;
}
