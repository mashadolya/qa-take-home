import { test as base, expect } from '../../api/fixtures/api.fixture';
import { FormEditorPage } from '../pages/form-editor.page';
import { FormEditorSteps } from '../steps/form-editor.steps';
import { FormEditorVerificationSteps } from '../steps/form-editor.verification.steps';

export interface UiFixtures {
  formEditorPage: FormEditorPage;
  formEditorSteps: FormEditorSteps;
  formEditorVerificationSteps: FormEditorVerificationSteps;
}

/** UI layer: page objects + UI action and verification steps. Extends the API layer so UI tests can arrange data fast via API. */
export const test = base.extend<UiFixtures>({
  // Any uncaught JS error on the page fails the UI test, even if every assertion passed
  // (e.g. a handler throwing on a missing element and silently skipping the save logic).
  formEditorPage: async ({ page }, use) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await use(new FormEditorPage(page));
    expect(pageErrors, 'uncaught JS errors on the page').toEqual([]);
  },
  formEditorVerificationSteps: async ({ formEditorPage }, use) => {
    await use(new FormEditorVerificationSteps(formEditorPage));
  },
  formEditorSteps: async ({ page, formEditorPage, formEditorVerificationSteps }, use) => {
    await use(new FormEditorSteps(page, formEditorPage, formEditorVerificationSteps));
  },
});

export { expect };
