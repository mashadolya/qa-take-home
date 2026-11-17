import type { SqlBoolean } from './sql.types';

/** Section columns of the `forms` table (aliased to camelCase in the query). */
export interface FormDetailColumns {
  hasDetails: SqlBoolean;
  referenceCode: string | null;
  detailsNote: string | null;
}
