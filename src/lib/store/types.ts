import type { TableMap, TableName } from "../types";

export type Row<T extends TableName> = TableMap[T];

export interface ListOptions {
  /** column to sort by, ascending unless prefixed with "-" */
  order?: string;
  /** only rows whose created_at is >= this ISO date */
  since?: string;
  limit?: number;
}

export interface Store {
  readonly kind: "supabase" | "local";
  list<T extends TableName>(table: T, opts?: ListOptions): Promise<Row<T>[]>;
  get<T extends TableName>(table: T, id: string | number): Promise<Row<T> | null>;
  insert<T extends TableName>(table: T, row: Partial<Row<T>>): Promise<Row<T>>;
  update<T extends TableName>(table: T, id: string | number, patch: Partial<Row<T>>): Promise<Row<T>>;
  upsert<T extends TableName>(table: T, rows: Partial<Row<T>>[]): Promise<void>;
  remove<T extends TableName>(table: T, id: string | number): Promise<void>;
  incrementScan(code: string): Promise<boolean>;
  upload(path: string, data: Blob, contentType: string): Promise<string>;
}

export const KEY_COLUMN: Partial<Record<TableName, string>> = { rates: "currency" };
export const keyOf = (table: TableName) => KEY_COLUMN[table] ?? "id";
