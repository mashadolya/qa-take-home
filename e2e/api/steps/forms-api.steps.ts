import { expect, test } from '@playwright/test';
import type { FormsApi } from '../clients/forms-api.client';
import { formWithDetails, formWithoutDetails } from '../../common/utils/form.utils';
import type { FormResponse } from '../../common/types/form.types';
import { HttpStatus } from '../../common/types/http.types';

/** One image is enough for most arrangements; tests pass a count only when it matters. */
const DEFAULT_IMAGE_COUNT = 1;

export interface ArrangedForm {
  form: FormResponse;
  imageUrls: string[];
}

/** API arrange flows and actions for forms and their section images. */
export class FormsApiSteps {
  constructor(private readonly formsApi: FormsApi) {}

  // ---- Arrange ------------------------------------------------------------

  /** Fast setup through the API: a form with the details section and `images` uploaded images. */
  async createFormWithDetails(title: string, images = DEFAULT_IMAGE_COUNT): Promise<ArrangedForm> {
    return test.step(`arrange via API: form with details section and ${images} image(s)`, async () => {
      const res = await this.formsApi.create(formWithDetails(title));
      expect(res.status()).toBe(HttpStatus.CREATED);
      const form = (await res.json()) as FormResponse;
      const imageUrls: string[] = [];
      for (let i = 0; i < images; i++) {
        const upload = await this.formsApi.uploadImage(form.id);
        expect(upload.status()).toBe(HttpStatus.CREATED);
        imageUrls.push((await upload.json()).url);
      }
      return { form, imageUrls };
    });
  }

  async createFormWithoutDetails(title: string): Promise<FormResponse> {
    return test.step('arrange via API: form without details section', async () => {
      const res = await this.formsApi.create(formWithoutDetails(title));
      expect(res.status()).toBe(HttpStatus.CREATED);
      return (await res.json()) as FormResponse;
    });
  }

  // ---- Actions ------------------------------------------------------------

  async disableDetails(form: FormResponse): Promise<FormResponse> {
    return test.step('PATCH: disable the details section', async () => {
      const res = await this.formsApi.update(form.id, formWithoutDetails(form.title));
      expect(res.status()).toBe(HttpStatus.OK);
      return (await res.json()) as FormResponse;
    });
  }

  async enableDetails(form: FormResponse, referenceCode: string): Promise<FormResponse> {
    return test.step(`PATCH: enable the details section with "${referenceCode}"`, async () => {
      const res = await this.formsApi.update(
        form.id,
        formWithDetails(form.title, { referenceCode, note: '' }),
      );
      expect(res.status()).toBe(HttpStatus.OK);
      return (await res.json()) as FormResponse;
    });
  }

  async deleteForm(id: string): Promise<void> {
    await test.step('DELETE the form', async () => {
      expect((await this.formsApi.delete(id)).status()).toBe(HttpStatus.NO_CONTENT);
    });
  }

  async getForm(id: string): Promise<FormResponse> {
    return test.step(`GET form ${id}`, async () => {
      const res = await this.formsApi.get(id);
      expect(res.status()).toBe(HttpStatus.OK);
      return (await res.json()) as FormResponse;
    });
  }
}
