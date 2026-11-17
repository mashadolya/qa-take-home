export interface DetailImage {
  id: string;
  url: string;
}

export interface FormDetails {
  referenceCode: string;
  note: string;
  images: DetailImage[];
}

/** Shape returned by GET/POST/PATCH /api/forms */
export interface FormResponse {
  id: string;
  title: string;
  hasDetails: boolean;
  details: FormDetails | null;
  updatedAt: string;
}

/** Body accepted by POST/PATCH /api/forms */
export interface FormRequest {
  title: string;
  hasDetails: boolean;
  details?: { referenceCode: string; note?: string } | null;
}
