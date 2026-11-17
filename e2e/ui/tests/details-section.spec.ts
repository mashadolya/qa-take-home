import { test } from '../fixtures/ui.fixture';
import { messages } from '../data/messages';
import { urlPatterns } from '../data/url-patterns';
import { referenceCodes } from '../../common/data/forms';
import { IMAGE_PNG, imageFile } from '../../common/data/files';
import { HttpStatus } from '../../common/types/http.types';

test.describe('Additional details section — user journey (UI)', () => {
  test(
    'BUG-002: details filled then unchecked are not sent on save — no hidden validation error',
    { tag: '@bug-002' },
    async ({ formEditorSteps, formEditorVerificationSteps, generateFormTitle }) => {
      await formEditorSteps.openNewForm();
      await formEditorSteps.fillTitle(generateFormTitle());
      await formEditorSteps.enableDetails({ note: 'draft note' });
      await formEditorSteps.disableDetails();

      const payload = await formEditorSteps.saveAndCaptureRequest();

      formEditorVerificationSteps.expectNoHiddenDetailsSent(payload);
      await formEditorVerificationSteps.expectSaved();
    },
  );

  test(
    'BUG-001: removing the details section in edit makes its image unreachable and it does not come back',
    { tag: '@bug-001' },
    async ({
      formEditorSteps,
      formEditorVerificationSteps,
      formsApiVerificationSteps,
      generateFormTitle,
    }) => {
      const imageUrls = await formEditorSteps.createFormWithImages(
        generateFormTitle(),
        { referenceCode: referenceCodes.uiCreated },
        imageFile(),
      );

      await formEditorSteps.disableDetails();
      await formEditorSteps.save();
      await formEditorVerificationSteps.expectSaved();
      await formsApiVerificationSteps.expectImagesNotServed(imageUrls);

      // the user changes their mind later: after re-enabling and saving, old images must not come back
      await formEditorSteps.reload();
      await formEditorSteps.enableDetails({ referenceCode: referenceCodes.reEnabled });
      await formEditorSteps.save();
      await formEditorVerificationSteps.expectSaved();
      await formEditorVerificationSteps.expectNoImages();
    },
  );

  test(
    'BUG-001 / BUG-002: details edited then unchecked and saved are removed from the client state and the backend',
    { tag: ['@bug-001', '@bug-002'] },
    async ({
      formEditorSteps,
      formEditorVerificationSteps,
      formsApiSteps,
      formsApiVerificationSteps,
      generateFormTitle,
    }) => {
      const { form, imageUrls } = await formsApiSteps.createFormWithDetails(generateFormTitle());
      await formEditorSteps.openForm(form.id);
      await formEditorSteps.enableDetails({ note: 'edited before unticking' });
      await formEditorSteps.attachImages(imageFile());

      await formEditorSteps.disableDetails();
      const payload = await formEditorSteps.saveAndCaptureRequest();
      formEditorVerificationSteps.expectNoHiddenDetailsSent(payload);
      await formEditorVerificationSteps.expectSaved();

      // no reload: re-ticking right after save must not bring back the draft
      await formEditorSteps.recheckDetails();
      await formEditorVerificationSteps.expectDetailsEmpty();
      await formsApiVerificationSteps.expectNoSectionImages(form.id);
      await formsApiVerificationSteps.expectImagesNotServed(imageUrls);
    },
  );

  test('unchecking and then cancelling the edit keeps the saved images', async ({
    formEditorSteps,
    formEditorVerificationSteps,
    formsApiSteps,
    formsApiVerificationSteps,
    generateFormTitle,
  }) => {
    const { form, imageUrls } = await formsApiSteps.createFormWithDetails(generateFormTitle());
    await formEditorSteps.openForm(form.id);
    await formEditorVerificationSteps.expectImageCount(imageUrls.length);

    await formEditorSteps.disableDetails();
    await formEditorSteps.cancel();

    await formEditorVerificationSteps.expectDetailsEnabled();
    await formEditorVerificationSteps.expectImageCount(imageUrls.length);
    await formsApiVerificationSteps.expectSectionImages(form.id, imageUrls.length);
  });

  test('unticking and re-ticking during one edit restores the draft and keeps the saved images', async ({
    formEditorSteps,
    formEditorVerificationSteps,
    formsApiSteps,
    formsApiVerificationSteps,
    generateFormTitle,
  }) => {
    const { form, imageUrls } = await formsApiSteps.createFormWithDetails(generateFormTitle());
    const newImages = [imageFile()];
    await formEditorSteps.openForm(form.id);
    await formEditorSteps.attachImages(...newImages);

    // the user changes their mind before saving: the section comes back from the edit draft
    await formEditorSteps.disableDetails();
    await formEditorSteps.recheckDetails();
    await formEditorVerificationSteps.expectDetailsValues(form.details);
    await formEditorVerificationSteps.expectImageCount(imageUrls.length);

    await formEditorSteps.save();
    await formEditorVerificationSteps.expectSaved();
    await formEditorVerificationSteps.expectImageCount(imageUrls.length + newImages.length);
    await formsApiVerificationSteps.expectSectionImages(
      form.id,
      imageUrls.length + newImages.length,
    );
  });

  test('failed image upload is reported to the user (mocked 500 from image storage)', async ({
    page,
    formEditorSteps,
    formEditorVerificationSteps,
    formsApiVerificationSteps,
    generateFormTitle,
  }) => {
    await page.route(urlPatterns.imageUpload, (route) =>
      route.fulfill({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        json: { error: 'storage unavailable' },
      }),
    );

    await formEditorSteps.openNewForm();
    await formEditorSteps.fillTitle(generateFormTitle());
    await formEditorSteps.enableDetails({ referenceCode: referenceCodes.uploadFailure });
    await formEditorSteps.attachImages(imageFile());
    const form = await formEditorSteps.saveNewAndCaptureResponse();

    await formEditorVerificationSteps.expectError(messages.imageUploadFailed(IMAGE_PNG));
    await formsApiVerificationSteps.expectNoSectionImages(form.id);
  });
});
