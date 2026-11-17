import type { APIRequestContext, APIResponse } from '@playwright/test';
import { apiRoutes } from '../data/api.routes';
import { imageUploadBody } from '../../common/data/files';
import type { FormRequest } from '../../common/types/form.types';

/** Thin REST client: raw calls only, every method returns the APIResponse so callers assert status. */
export class FormsApi {
  constructor(private readonly request: APIRequestContext) {}

  create(body: FormRequest): Promise<APIResponse> {
    return this.request.post(apiRoutes.forms, { data: body });
  }

  get(id: string): Promise<APIResponse> {
    return this.request.get(apiRoutes.form(id));
  }

  update(id: string, body: FormRequest): Promise<APIResponse> {
    return this.request.patch(apiRoutes.form(id), { data: body });
  }

  delete(id: string): Promise<APIResponse> {
    return this.request.delete(apiRoutes.form(id));
  }

  uploadImage(id: string, body = imageUploadBody()): Promise<APIResponse> {
    return this.request.post(apiRoutes.formImages(id), { data: body });
  }
}
