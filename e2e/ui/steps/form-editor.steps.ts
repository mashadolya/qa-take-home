import { expect, test, type Page } from '@playwright/test';
import type { FilePayload, FormEditorPage } from '../pages/form-editor.page';
import type { FormEditorVerificationSteps } from './form-editor.verification.steps';
import { urlPatterns } from '../data/url-patterns';
import type { FormResponse } from '../../common/types/form.types';
import { HttpMethod, HttpStatus } from '../../common/types/http.types';

export interface DetailsInput {
  referenceCode?: string;
  note?: string;
}

/** Reusable form editor flows and actions (UI). */
export class FormEditorSteps {
  constructor(
    private readonly page: Page,
    private readonly formEditorPage: FormEditorPage,
    private readonly verify: FormEditorVerificationSteps,
  ) {}

  // ---- Navigation ---------------------------------------------------------

  async openNewForm(): Promise<void> {
    await test.step('open a new form', () => this.formEditorPage.gotoNew());
  }

  async openForm(id: string): Promise<void> {
    await test.step(`open form ${id} for editing`, () => this.formEditorPage.gotoEdit(id));
  }

  async reload(): Promise<void> {
    await test.step('reload the editor', () => this.formEditorPage.reload());
  }

  // ---- Actions ------------------------------------------------------------

  async fillTitle(title: string): Promise<void> {
    await test.step(`fill title "${title}"`, () => this.formEditorPage.title.fill(title));
  }

  /** Ticks "Add additional details" and fills the revealed section. */
  async enableDetails(details: DetailsInput = {}): Promise<void> {
    await test.step(`tick "Add additional details" and fill reference "${details.referenceCode ?? ''}"`, async () => {
      await this.formEditorPage.detailsCheckbox.check();
      await expect(this.formEditorPage.detailsSection).toBeVisible();
      await this.formEditorPage.fillDetails(details);
    });
  }

  async disableDetails(): Promise<void> {
    await test.step('untick "Add additional details"', async () => {
      await this.formEditorPage.detailsCheckbox.uncheck();
      await expect(this.formEditorPage.detailsSection).toBeHidden();
    });
  }

  /** Ticks the box again without typing: whatever the section shows comes from the edit draft. */
  async recheckDetails(): Promise<void> {
    await test.step('tick "Add additional details" again', async () => {
      await this.formEditorPage.detailsCheckbox.check();
      await expect(this.formEditorPage.detailsSection).toBeVisible();
    });
  }

  async attachImages(...files: FilePayload[]): Promise<void> {
    await test.step(`attach ${files.map((f) => f.name).join(', ')}`, () =>
      this.formEditorPage.attach(...files));
  }

  async save(): Promise<void> {
    await test.step('save the form', () => this.formEditorPage.save.click());
  }

  async cancel(): Promise<void> {
    await test.step('cancel the edit', () => this.formEditorPage.cancel.click());
  }

  /** Saves and returns the JSON body the client sent — BUG-002 is visible at this level. */
  async saveAndCaptureRequest(): Promise<Record<string, unknown>> {
    return test.step('save the form and capture the request body', async () => {
      const request = this.page.waitForRequest(
        (r) =>
          urlPatterns.formSave.test(new URL(r.url()).pathname) &&
          [HttpMethod.POST, HttpMethod.PATCH].includes(r.method() as HttpMethod),
      );
      await this.formEditorPage.save.click();
      return (await request).postDataJSON();
    });
  }

  /** Saves a new form and returns what the API created (the editor reloads on success). */
  async saveNewAndCaptureResponse(): Promise<FormResponse> {
    return test.step('save the new form and capture the created form', async () => {
      const response = this.page.waitForResponse(
        (r) =>
          urlPatterns.formCreate.test(new URL(r.url()).pathname) &&
          r.status() === HttpStatus.CREATED,
      );
      await this.formEditorPage.save.click();
      return (await (await response).json()) as FormResponse;
    });
  }

  /** Full UI flow: new form with the details section and images, saved. Returns the image URLs shown. */
  async createFormWithImages(
    title: string,
    details: DetailsInput,
    ...files: FilePayload[]
  ): Promise<string[]> {
    return test.step(`create form "${title}" with ${files.length} image(s) in the UI`, async () => {
      await this.openNewForm();
      await this.fillTitle(title);
      await this.enableDetails(details);
      await this.attachImages(...files);
      await this.save();
      await this.verify.expectSaved();
      await this.verify.expectImageCount(files.length);
      return this.formEditorPage.imageUrls();
    });
  }
}
