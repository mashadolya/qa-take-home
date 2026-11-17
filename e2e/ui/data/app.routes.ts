/** App routes as used in `page.goto`; mirrors src/server.mjs. */
export const appRoutes = {
  newForm: '/',
  editForm: (id: string) => `/?id=${id}`,
};
