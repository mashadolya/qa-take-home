import { expect, test } from '@playwright/test';
import type { FormEditorPage } from '../pages/form-editor.page';
import { messages } from '../data/messages';
import type { FormResponse } from '../../common/types/form.types';

/** Form editor expectations (UI). */
export class FormEditorVerificationSteps {
  constructor(private readonly formEditorPage: FormEditorPage) {}

  /** Soft: a wrong status and a visible error are reported together. */
  async expectSaved(): Promise<void> {
    await test.step('expect the form to be saved without errors', async () => {
      await expect.soft(this.formEditorPage.status).toHaveText(messages.saved);
      await expect.soft(this.formEditorPage.error).toBeEmpty();
    });
  }

  async expectError(message: string): Promise<void> {
    await test.step(`expect error "${message}"`, async () => {
      await expect(this.formEditorPage.error).toHaveText(message);
    });
  }

  async expectImageCount(count: number): Promise<void> {
    await test.step(`expect ${count} image(s) in the details section`, async () => {
      await expect(this.formEditorPage.images).toHaveCount(count);
    });
  }

  async expectNoImages(): Promise<void> {
    await test.step('expect no images in the details section', async () => {
      await expect(this.formEditorPage.images).toHaveCount(0);
    });
  }

  async expectDetailsEnabled(): Promise<void> {
    await expect(this.formEditorPage.detailsCheckbox).toBeChecked();
  }

  /** Soft: a lost reference code and a lost note are reported together. */
  async expectDetailsValues(details: FormResponse['details']): Promise<void> {
    await test.step('expect the section to show the saved values', async () => {
      expect(details, 'the arranged form must have the details section').not.toBeNull();
      await expect
        .soft(this.formEditorPage.referenceCode)
        .toHaveValue(details?.referenceCode ?? '');
      await expect.soft(this.formEditorPage.note).toHaveValue(details?.note ?? '');
    });
  }

  /** Soft: leftover fields and leftover images are reported together. */
  async expectDetailsEmpty(): Promise<void> {
    await test.step('expect the section to be empty (no draft left in the client)', async () => {
      await expect.soft(this.formEditorPage.referenceCode).toBeEmpty();
      await expect.soft(this.formEditorPage.note).toBeEmpty();
      await expect.soft(this.formEditorPage.images).toHaveCount(0);
    });
  }

  /** The request body must not carry hidden section values once the box is unticked. */
  expectNoHiddenDetailsSent(payload: Record<string, unknown>): void {
    expect(payload, 'hidden section values must not be sent').toMatchObject({
      hasDetails: false,
      details: null,
    });
  }
}
