import { apiRoutes } from '../../api/data/api.routes';

/** Patterns for page.route / waitForRequest, built from the API routes. */
export const urlPatterns = {
  /** POST /api/forms or PATCH /api/forms/:id */
  formSave: new RegExp(`${apiRoutes.forms}(/[\\w-]+)?$`),
  /** POST /api/forms */
  formCreate: new RegExp(`${apiRoutes.forms}$`),
  /** POST /api/forms/:id/images (glob for page.route) */
  imageUpload: `**${apiRoutes.formImages('*')}`,
};
