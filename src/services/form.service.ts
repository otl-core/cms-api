/**
 * Form Service
 * Handles form submissions
 */

import type { HttpClient } from "../http-client";

export interface FormSubmissionRequest {
  type: string;
  locale: string;
  data: Record<string, unknown>;
  form_variant_id?: string;
  environment_type?: string;
  environment_id?: string;
  environment_path?: string;
  environment_variant_id?: string;
  metadata?: Record<string, unknown>;
}

export interface FormSubmissionResponse {
  success: boolean;
  submission_id: string;
  message?: string;
}

export class FormService {
  constructor(private httpClient: HttpClient) {}

  async submitForm(
    formId: string,
    data: FormSubmissionRequest,
  ): Promise<FormSubmissionResponse> {
    return this.httpClient.post<FormSubmissionResponse>(
      `/api/v1/public/forms/${formId}/submit`,
      data,
    );
  }
}
