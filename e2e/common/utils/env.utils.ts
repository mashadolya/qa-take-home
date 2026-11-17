import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../../..');

export const PORT = Number(process.env.PORT ?? 3100);
export const BASE_URL = `http://localhost:${PORT}`;
/** SQLite file the app writes and the tests read (read-only). Passed to the webServer via env. */
export const DB_PATH = path.resolve(
  process.env.DB_PATH ?? path.join(REPO_ROOT, '.data/product-a.db'),
);
/** Bugs re-enabled in the app for this run, e.g. BUGS=BUG-001 */
export const enabledBugs = (process.env.BUGS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
