import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { TableName } from "../types";
import { keyOf, type ListOptions, type Row, type Store } from "./types";

/**
 * Local demo store: keeps every table in data/local-db.json so the app runs
 * with no Supabase project. Meant for development and demos only.
 */
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "local-db.json");
const SEED_FILE = path.join(DATA_DIR, "seed.json");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

type DB = Record<string, Record<string, unknown>[]>;

let queue: Promise<unknown> = Promise.resolve();
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const next = queue.then(fn, fn);
  queue = next.catch(() => undefined);
  return next;
}

async function load(): Promise<DB> {
  try {
    return JSON.parse(await fs.readFile(DB_FILE, "utf8")) as DB;
  } catch {
    const seed = JSON.parse(await fs.readFile(SEED_FILE, "utf8")) as DB;
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DB_FILE, JSON.stringify(seed, null, 1));
    return seed;
  }
}

async function save(db: DB) {
  const tmp = DB_FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(db, null, 1));
  await fs.rename(tmp, DB_FILE);
}

function sortRows(rows: Record<string, unknown>[], order?: string) {
  if (!order) return rows;
  const desc = order.startsWith("-");
  const col = desc ? order.slice(1) : order;
  return [...rows].sort((a, b) => {
    const x = a[col] as number | string;
    const y = b[col] as number | string;
    const r = x < y ? -1 : x > y ? 1 : 0;
    return desc ? -r : r;
  });
}

export const localStore: Store = {
  kind: "local",

  async list<T extends TableName>(table: T, opts: ListOptions = {}) {
    const db = await load();
    let rows = db[table] ?? [];
    if (opts.since) rows = rows.filter((r) => String(r.created_at ?? "") >= opts.since!);
    rows = sortRows(rows, opts.order);
    if (opts.limit) rows = rows.slice(0, opts.limit);
    return structuredClone(rows) as unknown as Row<T>[];
  },

  async get<T extends TableName>(table: T, id: string | number) {
    const db = await load();
    const k = keyOf(table);
    const row = (db[table] ?? []).find((r) => String(r[k]) === String(id));
    return row ? (structuredClone(row) as unknown as Row<T>) : null;
  },

  insert<T extends TableName>(table: T, row: Partial<Row<T>>) {
    return serial(async () => {
      const db = await load();
      const k = keyOf(table);
      const full = { ...row, created_at: new Date().toISOString() } as Record<string, unknown>;
      if (full[k] == null) full[k] = randomUUID();
      (db[table] ??= []).push(full);
      await save(db);
      return full as unknown as Row<T>;
    });
  },

  update<T extends TableName>(table: T, id: string | number, patch: Partial<Row<T>>) {
    return serial(async () => {
      const db = await load();
      const k = keyOf(table);
      const rows = (db[table] ??= []);
      const i = rows.findIndex((r) => String(r[k]) === String(id));
      if (i < 0) throw new Error(`${table} ${id} not found`);
      rows[i] = { ...rows[i], ...patch, updated_at: new Date().toISOString() };
      await save(db);
      return rows[i] as unknown as Row<T>;
    });
  },

  upsert<T extends TableName>(table: T, list: Partial<Row<T>>[]) {
    return serial(async () => {
      const db = await load();
      const k = keyOf(table);
      const rows = (db[table] ??= []);
      for (const row of list as Record<string, unknown>[]) {
        const i = rows.findIndex((r) => String(r[k]) === String(row[k]));
        if (i >= 0) rows[i] = { ...rows[i], ...row };
        else rows.push({ ...row, [k]: row[k] ?? randomUUID() });
      }
      await save(db);
    });
  },

  remove<T extends TableName>(table: T, id: string | number) {
    return serial(async () => {
      const db = await load();
      const k = keyOf(table);
      db[table] = (db[table] ?? []).filter((r) => String(r[k]) !== String(id));
      await save(db);
    });
  },

  incrementScan(code: string) {
    return serial(async () => {
      const db = await load();
      const row = (db.tables ?? []).find((r) => r.code === code);
      if (!row) return false;
      row.scans = Number(row.scans ?? 0) + 1;
      await save(db);
      return true;
    });
  },

  async upload(name: string, data: Blob) {
    const safe = name.replace(/[^a-zA-Z0-9._/-]/g, "_").replace(/\.\.+/g, ".");
    const target = path.join(UPLOAD_DIR, safe);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, Buffer.from(await data.arrayBuffer()));
    return `/media/${safe}`;
  },
};
