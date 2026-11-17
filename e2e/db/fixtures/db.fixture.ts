import { test as base, expect } from '../../common/fixtures/base.fixture';
import { DbClient } from '../clients/db.client';
import { FormsDbVerificationSteps } from '../steps/forms-db.verification.steps';

export interface DbFixtures {
  /** Read-only SQL access to the app database. Lazy: opened only for tests that ask for it. */
  dbClient: DbClient;
  formsDbVerificationSteps: FormsDbVerificationSteps;
}

/** Data layer: read-only SQL client + SQL steps. */
export const test = base.extend<DbFixtures>({
  dbClient: async ({}, use) => {
    const dbClient = new DbClient();
    await use(dbClient);
    dbClient.close();
  },
  formsDbVerificationSteps: async ({ dbClient }, use) => {
    await use(new FormsDbVerificationSteps(dbClient));
  },
});

export { expect };
