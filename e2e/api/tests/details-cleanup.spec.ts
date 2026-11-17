import { test, expect } from '../fixtures/api.fixture';
import { referenceCodes } from '../../common/data/forms';
import { HttpStatus } from '../../common/types/http.types';

/**
 * API + data layer for BUG-001 (REST via formsApiSteps, SQL via formsDbVerificationSteps).
 * After the original save the UI looked correct (section hidden, "Saved"), so the escape was only
 * visible below the UI: in the API response, in the image storage URL and in the DB rows.
 */
test.describe('Additional details section — data cleanup (API + SQL)', () => {
  test(
    'BUG-001: disabling the details section deletes its images and fields',
    { tag: '@bug-001' },
    async ({
      formsApiSteps,
      formsApiVerificationSteps,
      formsDbVerificationSteps,
      generateFormTitle,
    }) => {
      const imagesToUpload = 2;
      const { form, imageUrls } = await formsApiSteps.createFormWithDetails(
        generateFormTitle(),
        imagesToUpload,
      );
      await formsDbVerificationSteps.expectImagesInDb(form.id, imagesToUpload);

      await formsApiSteps.disableDetails(form);

      await formsApiVerificationSteps.expectNoSectionImages(form.id);
      await formsApiVerificationSteps.expectImagesNotServed(imageUrls);
      await formsDbVerificationSteps.expectNoImagesInDb(form.id);
      await formsDbVerificationSteps.expectDetailColumnsCleared(form.id);
    },
  );

  test(
    'BUG-001: re-enabling the details section starts empty — old images are not resurrected',
    { tag: '@bug-001' },
    async ({ formsApiSteps, formsApiVerificationSteps, generateFormTitle }) => {
      const { form } = await formsApiSteps.createFormWithDetails(generateFormTitle());

      await formsApiSteps.disableDetails(form);
      const reEnabled = await formsApiSteps.enableDetails(form, referenceCodes.reEnabled);

      expect(reEnabled.details?.referenceCode).toBe(referenceCodes.reEnabled);
      await formsApiVerificationSteps.expectNoSectionImages(form.id);
    },
  );

  test('deleting a form removes all of its images (cascade)', async ({
    formsApiSteps,
    formsApiVerificationSteps,
    formsDbVerificationSteps,
    generateFormTitle,
  }) => {
    const { form, imageUrls } = await formsApiSteps.createFormWithDetails(generateFormTitle());

    await formsApiSteps.deleteForm(form.id);

    await formsApiVerificationSteps.expectImagesNotServed(imageUrls);
    await formsDbVerificationSteps.expectNoImagesInDb(form.id);
  });

  test('image upload is rejected (409) while the details section is disabled', async ({
    formsApiSteps,
    formsApiVerificationSteps,
    formsDbVerificationSteps,
    generateFormTitle,
  }) => {
    const form = await formsApiSteps.createFormWithoutDetails(generateFormTitle());

    await formsApiVerificationSteps.expectUploadRejected(form.id, HttpStatus.CONFLICT);
    await formsDbVerificationSteps.expectNoImagesInDb(form.id);
  });

  test('enabled details section requires a reference code', async ({
    formsApiVerificationSteps,
    generateFormTitle,
  }) => {
    await formsApiVerificationSteps.expectCreateRejected(
      generateFormTitle(),
      referenceCodes.empty,
      'details.referenceCode',
    );
  });
});
