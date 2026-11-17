/** Base path of the forms REST resource — the single place it is spelled out. */
const FORMS_PATH = '/api/forms';

/** REST endpoints of the app, used by the API client and to build UI URL patterns. */
export const apiRoutes = {
  forms: FORMS_PATH,
  form: (id: string) => `${FORMS_PATH}/${id}`,
  formImages: (id: string) => `${FORMS_PATH}/${id}/images`,
};
