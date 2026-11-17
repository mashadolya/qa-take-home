import { test as base, expect } from '../../db/fixtures/db.fixture';
import { FormsApi } from '../clients/forms-api.client';
import { FormsApiSteps } from '../steps/forms-api.steps';
import { FormsApiVerificationSteps } from '../steps/forms-api.verification.steps';

export interface ApiFixtures {
  formsApi: FormsApi;
  formsApiSteps: FormsApiSteps;
  formsApiVerificationSteps: FormsApiVerificationSteps;
}

/**
 * API layer: REST client + API action and verification steps.
 * Extends the DB layer so API tests can verify rows via SQL.
 */
export const test = base.extend<ApiFixtures>({
  formsApi: async ({ request }, use) => {
    await use(new FormsApi(request));
  },
  formsApiSteps: async ({ formsApi }, use) => {
    await use(new FormsApiSteps(formsApi));
  },
  formsApiVerificationSteps: async ({ request, formsApi }, use) => {
    await use(new FormsApiVerificationSteps(request, formsApi));
  },
});

export { expect };
