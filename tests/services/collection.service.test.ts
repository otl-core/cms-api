import { describe, expect, it, vi, beforeEach } from "vitest";
import { CollectionService } from "../../src/services/collection.service";
import { HttpClient } from "../../src/http-client";

function createMockHttpClient(): HttpClient {
  const client = new HttpClient({ baseUrl: "https://api.test.com" });
  client.get = vi.fn().mockResolvedValue({ success: true, data: [] });
  client.post = vi.fn().mockResolvedValue({ success: true });
  return client;
}

describe("CollectionService", () => {
  let service: CollectionService;
  let httpClient: HttpClient;

  beforeEach(() => {
    httpClient = createMockHttpClient();
    service = new CollectionService(httpClient);
  });

  describe("fetchCollections", () => {
    it("should call correct endpoint with site ID", async () => {
      await service.fetchCollections("deploy-123");
      expect(httpClient.get).toHaveBeenCalledWith(
        "/api/v1/public/sites/deploy-123/collections",
      );
    });
  });

  describe("fetchEntries", () => {
    it("should call correct endpoint with collection ID", async () => {
      await service.fetchEntries("collection-456");
      expect(httpClient.get).toHaveBeenCalledWith(
        "/api/v1/public/collections/collection-456/entries",
        undefined,
      );
    });

    it("should pass pagination params", async () => {
      await service.fetchEntries("collection-456", { page: 2, limit: 10 });
      expect(httpClient.get).toHaveBeenCalledWith(
        "/api/v1/public/collections/collection-456/entries",
        { page: 2, limit: 10 },
      );
    });

    it("should pass category filter", async () => {
      await service.fetchEntries("collection-456", { category: "tech" });
      expect(httpClient.get).toHaveBeenCalledWith(
        "/api/v1/public/collections/collection-456/entries",
        { category: "tech" },
      );
    });
  });

  describe("fetchEntry", () => {
    it("should call correct endpoint with collection ID and entry slug", async () => {
      await service.fetchEntry("collection-456", "my-post");
      expect(httpClient.get).toHaveBeenCalledWith(
        "/api/v1/public/collections/collection-456/entries/my-post",
      );
    });
  });

  describe("fetchCategories", () => {
    it("should call correct endpoint with collection ID", async () => {
      await service.fetchCategories("collection-456");
      expect(httpClient.get).toHaveBeenCalledWith(
        "/api/v1/public/collections/collection-456/categories",
      );
    });
  });
});
