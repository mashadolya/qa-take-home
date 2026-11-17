import { referenceCodes } from '../data/forms';
import type { FormRequest } from '../types/form.types';

/** Unique, readable titles keep parallel tests isolated without any shared reset. */
export const uniqueTitle = (prefix: string) =>
  `${prefix} ${Math.random().toString(36).slice(2, 8)}`;

export const formWithDetails = (
  title: string,
  details: Partial<NonNullable<FormRequest['details']>> = {},
): FormRequest => ({
  title,
  hasDetails: true,
  details: { referenceCode: referenceCodes.valid, note: 'site photos', ...details },
});

export const formWithoutDetails = (title: string): FormRequest => ({
  title,
  hasDetails: false,
  details: null,
});
