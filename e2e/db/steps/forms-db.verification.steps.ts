import { expect, test } from '@playwright/test';
import type { DbClient } from '../clients/db.client';
import { SqlBoolean } from '../types/sql.types';

/** Data-layer (SQL) expectations for forms and their section images. */
export class FormsDbVerificationSteps {
  constructor(private readonly db: DbClient) {}

  async expectImagesInDb(formId: string, count: number): Promise<void> {
    await test.step(`SQL: expect ${count} section image row(s) in stored_images`, async () => {
      expect(this.db.detailImageCount(formId)).toBe(count);
    });
  }

  async expectNoImagesInDb(formId: string): Promise<void> {
    await test.step('SQL: expect no section image rows in stored_images', async () => {
      expect(this.db.detailImageCount(formId)).toBe(0);
    });
  }

  async expectDetailColumnsCleared(formId: string): Promise<void> {
    await test.step('SQL: expect section columns to be NULL', async () => {
      expect(this.db.formDetailColumns(formId)).toEqual({
        hasDetails: SqlBoolean.FALSE,
        referenceCode: null,
        detailsNote: null,
      });
    });
  }
}
