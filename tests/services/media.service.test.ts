import { describe, expect, it, vi, beforeEach } from "vitest";
import { MediaService } from "../../src/services/media.service";
import { HttpClient } from "../../src/http-client";

function createMockHttpClient(): HttpClient {
  const client = new HttpClient({ baseUrl: "https://api.test.com" });
  client.get = vi.fn().mockResolvedValue({ success: true, data: {} });
  return client;
}

describe("MediaService", () => {
  let service: MediaService;
  let httpClient: HttpClient;

  beforeEach(() => {
    httpClient = createMockHttpClient();
    service = new MediaService(httpClient);
  });

  describe("fetchMediaFile", () => {
    it("should GET from correct endpoint with site and media IDs", async () => {
      await service.fetchMediaFile("deploy-123", "media-456");
      expect(httpClient.get).toHaveBeenCalledWith(
        "/api/v1/public/sites/deploy-123/media/media-456",
      );
    });
  });

  describe("fetchMedia", () => {
    it("should GET from correct endpoint with site ID", async () => {
      await service.fetchMedia("deploy-123");
      expect(httpClient.get).toHaveBeenCalledWith(
        "/api/v1/public/sites/deploy-123/media",
      );
    });
  });
});
