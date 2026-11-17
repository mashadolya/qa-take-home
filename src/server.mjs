// Stub of "Product A" form service — models only the critical path of BUG-001 / BUG-002:
// a form with an optional "Additional details" section (fields + images) that is toggled by a checkbox.
//
// Bugs can be switched back on to prove the tests catch them:
//   BUGS=BUG-001          -> backend keeps section images after the section is disabled (orphaned + reachable by URL)
//   BUGS=BUG-002          -> client keeps hidden section state and sends it on save (validation error on a hidden field)
//   BUGS=BUG-001,BUG-002  -> both
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 3100);
const DB_PATH = process.env.DB_PATH ?? path.join(__dirname, '..', '.data', 'product-a.db');
const enabledBugs = new Set(
  (process.env.BUGS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
for (const suffix of ['', '-wal', '-shm']) {
  fs.rmSync(DB_PATH + suffix, { force: true });
}

const db = new DatabaseSync(DB_PATH);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE forms (
    id            TEXT PRIMARY KEY,
    title         TEXT NOT NULL,
    has_details   INTEGER NOT NULL DEFAULT 0,
    reference_code TEXT,
    details_note  TEXT,
    updated_at    TEXT NOT NULL
  );
  -- models the separate image storage: rows are addressable by /images/:id
  CREATE TABLE stored_images (
    id        TEXT PRIMARY KEY,
    form_id   TEXT NOT NULL,
    section   TEXT NOT NULL,
    mime      TEXT NOT NULL,
    data      BLOB NOT NULL
  );
`);

// ---------- helpers ----------
const send = (res, status, body, headers = {}) => {
  const payload = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(status, {
    'content-type':
      typeof body === 'object' && !Buffer.isBuffer(body) ? 'application/json' : 'text/plain',
    ...headers,
  });
  res.end(payload);
};

const readJson = (req) =>
  new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('invalid JSON'));
      }
    });
  });

const imagesOf = (formId) =>
  db
    .prepare(
      `SELECT id FROM stored_images WHERE form_id = ? AND section = 'details' ORDER BY rowid`,
    )
    .all(formId)
    .map((r) => ({ id: r.id, url: `/images/${r.id}` }));

const toDto = (row) => ({
  id: row.id,
  title: row.title,
  hasDetails: Boolean(row.has_details),
  details: row.has_details
    ? { referenceCode: row.reference_code, note: row.details_note ?? '', images: imagesOf(row.id) }
    : null,
  updatedAt: row.updated_at,
});

const getForm = (id) => db.prepare('SELECT * FROM forms WHERE id = ?').get(id);

// Validation runs on whatever "details" the client sent — that is what made BUG-002 visible to users:
// hidden, stale client state reached the server and failed validation on a field the user could not see.
const validate = (body) => {
  const errors = [];
  if (!body.title || !String(body.title).trim()) {
    errors.push({ field: 'title', message: 'Title is required' });
  }
  if (body.hasDetails && !body.details) {
    errors.push({ field: 'details', message: 'Details are required' });
  }
  if (body.details) {
    if (!String(body.details.referenceCode ?? '').trim()) {
      errors.push({
        field: 'details.referenceCode',
        message: 'Reference code is required',
      });
    }
  }
  return errors;
};

// ---------- handlers ----------
const routes = [
  ['GET', /^\/api\/config$/, (req, res) => send(res, 200, { bugs: [...enabledBugs] })],

  [
    'POST',
    /^\/api\/forms$/,
    async (req, res) => {
      const body = await readJson(req);
      const errors = validate(body);
      if (errors.length) {
        return send(res, 400, { errors });
      }
      const id = crypto.randomUUID();
      db.prepare(
        `INSERT INTO forms (id, title, has_details, reference_code, details_note, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        body.title,
        body.hasDetails ? 1 : 0,
        body.hasDetails ? body.details.referenceCode : null,
        body.hasDetails ? (body.details.note ?? '') : null,
        new Date().toISOString(),
      );
      send(res, 201, toDto(getForm(id)));
    },
  ],

  [
    'GET',
    /^\/api\/forms\/([\w-]+)$/,
    (req, res, [id]) => {
      const row = getForm(id);
      return row ? send(res, 200, toDto(row)) : send(res, 404, { error: 'not found' });
    },
  ],

  [
    'PATCH',
    /^\/api\/forms\/([\w-]+)$/,
    async (req, res, [id]) => {
      const row = getForm(id);
      if (!row) {
        return send(res, 404, { error: 'not found' });
      }
      const body = await readJson(req);
      const errors = validate(body);
      if (errors.length) {
        return send(res, 400, { errors });
      }

      if (body.hasDetails) {
        db.prepare(
          `UPDATE forms SET title = ?, has_details = 1, reference_code = ?, details_note = ?, updated_at = ? WHERE id = ?`,
        ).run(
          body.title,
          body.details.referenceCode,
          body.details.note ?? '',
          new Date().toISOString(),
          id,
        );
      } else if (enabledBugs.has('BUG-001')) {
        // original behaviour: only the flag is flipped, section data and images stay in storage
        db.prepare(`UPDATE forms SET title = ?, has_details = 0, updated_at = ? WHERE id = ?`).run(
          body.title,
          new Date().toISOString(),
          id,
        );
      } else {
        // fixed behaviour: disabling the section clears its fields and deletes its images in one transaction
        db.exec('BEGIN');
        try {
          db.prepare(
            `UPDATE forms SET title = ?, has_details = 0, reference_code = NULL, details_note = NULL, updated_at = ? WHERE id = ?`,
          ).run(body.title, new Date().toISOString(), id);
          db.prepare(`DELETE FROM stored_images WHERE form_id = ? AND section = 'details'`).run(id);
          db.exec('COMMIT');
        } catch (e) {
          db.exec('ROLLBACK');
          throw e;
        }
      }
      send(res, 200, toDto(getForm(id)));
    },
  ],

  [
    'DELETE',
    /^\/api\/forms\/([\w-]+)$/,
    (req, res, [id]) => {
      if (!getForm(id)) {
        return send(res, 404, { error: 'not found' });
      }
      db.prepare('DELETE FROM stored_images WHERE form_id = ?').run(id);
      db.prepare('DELETE FROM forms WHERE id = ?').run(id);
      send(res, 204, '');
    },
  ],

  // Image upload: JSON { mime, base64 } to keep the stub dependency-free (no multipart parser).
  [
    'POST',
    /^\/api\/forms\/([\w-]+)\/images$/,
    async (req, res, [id]) => {
      const row = getForm(id);
      if (!row) {
        return send(res, 404, { error: 'not found' });
      }
      if (!row.has_details) {
        return send(res, 409, { error: 'Additional details section is disabled' });
      }
      const { mime, base64 } = await readJson(req);
      if (!/^image\/(png|jpeg)$/.test(mime ?? '') || !base64) {
        return send(res, 400, { error: 'PNG or JPEG required' });
      }
      const imageId = crypto.randomUUID();
      db.prepare(
        `INSERT INTO stored_images (id, form_id, section, mime, data) VALUES (?, ?, 'details', ?, ?)`,
      ).run(imageId, id, mime, Buffer.from(base64, 'base64'));
      send(res, 201, { id: imageId, url: `/images/${imageId}` });
    },
  ],

  [
    'GET',
    /^\/images\/([\w-]+)$/,
    (req, res, [imageId]) => {
      const img = db.prepare('SELECT mime, data FROM stored_images WHERE id = ?').get(imageId);
      if (!img) {
        return send(res, 404, 'not found');
      }
      send(res, 200, Buffer.from(img.data), { 'content-type': img.mime });
    },
  ],

  [
    'GET',
    /^\/favicon\.ico$/,
    (req, res) => {
      res.writeHead(204);
      res.end();
    },
  ],

  [
    'GET',
    /^\/(index\.html)?$/,
    (req, res) => {
      send(res, 200, fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8'), {
        'content-type': 'text/html; charset=utf-8',
      });
    },
  ],
];

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  for (const [method, pattern, handler] of routes) {
    const m = req.method === method && pathname.match(pattern);
    if (m) {
      try {
        return await handler(req, res, m.slice(1));
      } catch (e) {
        return send(res, 500, { error: e.message });
      }
    }
  }
  send(res, 404, { error: 'not found' });
});

server.listen(PORT, () => {
  console.log(
    `Product A stub on http://localhost:${PORT}  db=${DB_PATH}  bugs=[${[...enabledBugs].join(',')}]`,
  );
});
