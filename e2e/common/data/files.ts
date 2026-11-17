import fs from 'node:fs';
import path from 'node:path';
import { MimeType } from '../types/http.types';

const FILES_DIR = path.resolve(import.meta.dirname, 'files');

/** 1x1 PNG used for every upload in the suite (no real customer images). */
export const IMAGE_PNG = 'image.png';

/** File payload for `setInputFiles`; `uploadAs` renames it for the browser. */
export const imageFile = (fileName = IMAGE_PNG, uploadAs = fileName) => ({
  name: uploadAs,
  mimeType: MimeType.PNG,
  buffer: fs.readFileSync(path.join(FILES_DIR, fileName)),
});

/** Same file in the JSON shape the app's upload endpoint accepts. */
export const imageUploadBody = (fileName = IMAGE_PNG) => ({
  mime: MimeType.PNG,
  base64: fs.readFileSync(path.join(FILES_DIR, fileName)).toString('base64'),
});
