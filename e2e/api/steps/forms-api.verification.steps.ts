import { expect, test, type APIRequestContext } from '@playwright/test';
import type { FormsApi } from '../clients/forms-api.client';
import { formWithDetails } from '../../common/utils/form.utils';
import type { FormResponse } from '../../common/types/form.types';
import { HttpStatus } from '../../common/types/http.types';

/** API expectations for forms and their section images. */
export class FormsApiVerificationSteps {
  constructor(
    private readonly request: APIRequestContext,
    private readonly formsApi: FormsApi,
  ) {}

  /**
   * The actual escape of BUG-001: old image URLs stayed reachable after the section was removed.
   * Soft per URL, so the report lists every leaked image, not only the first one.
   */
  async expectImagesNotServed(urls: string[]): Promise<void> {
    await test.step('expect old image URLs to return 404', async () => {
      for (const url of urls) {
        expect
          .soft((await this.request.get(url)).status(), `${url} must not be served anymore`)
          .toBe(HttpStatus.NOT_FOUND);
      }
    });
  }

  async expectSectionImages(formId: string, count: number): Promise<void> {
    await test.step(`API: expect ${count} image(s) in the details section`, async () => {
      expect((await this.getForm(formId)).details?.images ?? []).toHaveLength(count);
    });
  }

  async expectNoSectionImages(formId: string): Promise<void> {
    await test.step('API: expect no images in the details section', async () => {
      expect((await this.getForm(formId)).details?.images ?? []).toEqual([]);
    });
  }

  async expectUploadRejected(formId: string, status: HttpStatus): Promise<void> {
    await test.step(`expect image upload to be rejected with ${status}`, async () => {
      expect((await this.formsApi.uploadImage(formId)).status()).toBe(status);
    });
  }

  async expectCreateRejected(title: string, referenceCode: string, field: string): Promise<void> {
    await test.step(`expect create with reference "${referenceCode}" to fail on ${field}`, async () => {
      const res = await this.formsApi.create(formWithDetails(title, { referenceCode }));
      expect(res.status()).toBe(HttpStatus.BAD_REQUEST);
      expect((await res.json()).errors).toContainEqual(expect.objectContaining({ field }));
    });
  }

  private async getForm(id: string): Promise<FormResponse> {
    const res = await this.formsApi.get(id);
    expect(res.status()).toBe(HttpStatus.OK);
    return (await res.json()) as FormResponse;
  }
}
