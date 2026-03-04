import { describe, expect, it, vi, beforeEach } from "vitest";
import { FormService } from "../../src/services/form.service";
import type { FormSubmissionRequest } from "../../src/services/form.service";
import { HttpClient } from "../../src/http-client";

function createMockHttpClient(): HttpClient {
  const client = new HttpClient({ baseUrl: "https://api.test.com" });
  client.post = vi.fn().mockResolvedValue({
    success: true,
    submission_id: "sub-123",
  });
  return client;
}

describe("FormService", () => {
  let service: FormService;
  let httpClient: HttpClient;

  beforeEach(() => {
    httpClient = createMockHttpClient();
    service = new FormService(httpClient);
  });

  describe("submitForm", () => {
    it("should POST to correct endpoint with form data", async () => {
      const formData: FormSubmissionRequest = {
        type: "contact",
        locale: "en",
        data: { name: "Test User", email: "test@example.com" },
      };

      await service.submitForm("form-789", formData);
      expect(httpClient.post).toHaveBeenCalledWith(
        "/api/v1/public/forms/form-789/submit",
        formData,
      );
    });

    it("should include optional fields when provided", async () => {
      const formData: FormSubmissionRequest = {
        type: "signup",
        locale: "de",
        data: { name: "Max" },
        form_variant_id: "variant-1",
        environment_type: "page",
        environment_id: "page-123",
        environment_path: "/contact",
        metadata: { source: "footer" },
      };

      await service.submitForm("form-789", formData);
      expect(httpClient.post).toHaveBeenCalledWith(
        "/api/v1/public/forms/form-789/submit",
        formData,
      );
    });

    it("should return submission response", async () => {
      const formData: FormSubmissionRequest = {
        type: "contact",
        locale: "en",
        data: { name: "Test" },
      };

      const result = await service.submitForm("form-789", formData);
      expect(result).toEqual({
        success: true,
        submission_id: "sub-123",
      });
    });
  });
});
