import { test as base, expect } from '@playwright/test';
import { enabledBugs } from '../utils/env.utils';
import { uniqueTitle } from '../utils/form.utils';

/** How much of the test name goes into a form title: enough to spot it in the app, still readable. */
const TEST_NAME_IN_TITLE_LENGTH = 40;

export interface BaseFixtures {
  /**
   * Returns a new unique form title on every call, e.g. `[w0] <start of the test name> a1b2c3`.
   * Worker + test name prefix keeps parallel tests isolated and makes their data easy to find.
   */
  generateFormTitle: () => string;
  /**
   * When a bug is switched back on in the app (BUGS=BUG-001), tests tagged with it (@bug-001) are
   * EXPECTED to fail. A green "bug mode" run therefore proves the test really catches that bug.
   */
  bugGuard: void;
}

/** Shared by the API and UI layers. */
export const test = base.extend<BaseFixtures>({
  generateFormTitle: async ({}, use, testInfo) => {
    await use(() =>
      uniqueTitle(
        `[w${testInfo.workerIndex}] ${testInfo.title.slice(0, TEST_NAME_IN_TITLE_LENGTH)}`,
      ),
    );
  },

  bugGuard: [
    async ({}, use, testInfo) => {
      for (const bug of enabledBugs) {
        if (testInfo.tags.includes(`@${bug.toLowerCase()}`)) {
          testInfo.fail(true, `${bug} is re-enabled in the app`);
        }
      }
      await use();
    },
    { auto: true },
  ],
});

export { expect };
