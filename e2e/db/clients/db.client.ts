import { DatabaseSync } from 'node:sqlite';
import { DB_PATH } from '../../common/utils/env.utils';
import type { FormDetailColumns } from '../types/form-row.types';

/** Read-only SQL access to the app database — the data-layer check from the incident. */
export class DbClient {
  private readonly conn = new DatabaseSync(DB_PATH, { readOnly: true });

  detailImageCount(formId: string): number {
    const row = this.conn
      .prepare(`SELECT COUNT(*) AS n FROM stored_images WHERE form_id = ? AND section = 'details'`)
      .get(formId) as { n: number };
    return row.n;
  }

  formDetailColumns(formId: string): FormDetailColumns {
    return this.conn
      .prepare(
        `SELECT has_details AS hasDetails, reference_code AS referenceCode, details_note AS detailsNote FROM forms WHERE id = ?`,
      )
      .get(formId) as unknown as FormDetailColumns;
  }

  close(): void {
    this.conn.close();
  }
}
