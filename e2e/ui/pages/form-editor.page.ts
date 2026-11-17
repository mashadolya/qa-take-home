import { expect, type Locator, type Page } from '@playwright/test';
import { appRoutes } from '../data/app.routes';

export type FilePayload = { name: string; mimeType: string; buffer: Buffer };

/** Form editor: base fields + the optional "Additional details" section (fields and images). */
export class FormEditorPage {
  readonly title: Locator;
  readonly detailsCheckbox: Locator;
  readonly detailsSection: Locator;
  readonly referenceCode: Locator;
  readonly note: Locator;
  readonly imagesInput: Locator;
  readonly images: Locator;
  readonly save: Locator;
  readonly cancel: Locator;
  readonly error: Locator;
  readonly status: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('title');
    this.detailsCheckbox = page.getByLabel('Add additional details');
    this.detailsSection = page.getByTestId('details-section');
    this.referenceCode = page.getByTestId('reference-code');
    this.note = page.getByTestId('note');
    this.imagesInput = page.getByTestId('images-input');
    this.images = page.getByTestId('detail-image');
    this.save = page.getByRole('button', { name: 'Save' });
    this.cancel = page.getByRole('button', { name: 'Cancel' });
    this.error = page.getByRole('alert');
    this.status = page.getByRole('status');
  }

  async gotoNew(): Promise<void> {
    await this.page.goto(appRoutes.newForm);
    await this.waitUntilReady();
  }

  async gotoEdit(id: string): Promise<void> {
    await this.page.goto(appRoutes.editForm(id));
    await this.waitUntilReady();
  }

  async reload(): Promise<void> {
    await this.page.reload();
    await this.waitUntilReady();
  }

  async fillDetails({
    referenceCode,
    note,
  }: {
    referenceCode?: string;
    note?: string;
  }): Promise<void> {
    if (referenceCode !== undefined) {
      await this.referenceCode.fill(referenceCode);
    }
    if (note !== undefined) {
      await this.note.fill(note);
    }
  }

  async attach(...files: FilePayload[]): Promise<void> {
    await this.imagesInput.setInputFiles(files);
  }

  async imageUrls(): Promise<string[]> {
    return Promise.all(
      (await this.images.all()).map(async (img) => (await img.getAttribute('src'))!),
    );
  }

  /** The page marks <body data-ready> once the form data is loaded. */
  private async waitUntilReady(): Promise<void> {
    await expect(this.page.locator('body')).toHaveAttribute('data-ready', 'true');
  }
}
