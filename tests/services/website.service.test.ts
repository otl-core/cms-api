import { describe, expect, it, vi, beforeEach } from "vitest";
import { WebsiteService } from "../../src/services/website.service";
import { HttpClient } from "../../src/http-client";

function createMockHttpClient(): HttpClient {
  const client = new HttpClient({ baseUrl: "https://api.test.com" });
  client.get = vi.fn().mockResolvedValue({ success: true, data: {} });
  client.post = vi.fn().mockResolvedValue({ success: true, data: {} });
  return client;
}

describe("WebsiteService", () => {
  let service: WebsiteService;
  let httpClient: HttpClient;

  beforeEach(() => {
    httpClient = createMockHttpClient();
    service = new WebsiteService(httpClient);
  });

  describe("fetchConfigs", () => {
    it("should call correct endpoint for site configs", async () => {
      await service.fetchConfigs("deploy-123");
      expect(httpClient.get).toHaveBeenCalledWith(
        "/api/v1/public/sites/deploy-123/configs",
        undefined,
        expect.objectContaining({
          next: expect.objectContaining({
            tags: expect.arrayContaining(["site:deploy-123", "config"]),
          }),
        }),
      );
    });

    it("should append locale parameter when provided", async () => {
      await service.fetchConfigs("deploy-123", "de");
      const callArgs = (httpClient.get as ReturnType<typeof vi.fn>).mock
        .calls[0];
      expect(callArgs[0]).toContain("locale=de");
    });

    it("should append header preset parameter when provided", async () => {
      await service.fetchConfigs("deploy-123", undefined, "header-preset-1");
      const callArgs = (httpClient.get as ReturnType<typeof vi.fn>).mock
        .calls[0];
      expect(callArgs[0]).toContain("header_preset=header-preset-1");
    });

    it("should append footer preset parameter when provided", async () => {
      await service.fetchConfigs(
        "deploy-123",
        undefined,
        undefined,
        "footer-preset-1",
      );
      const callArgs = (httpClient.get as ReturnType<typeof vi.fn>).mock
        .calls[0];
      expect(callArgs[0]).toContain("footer_preset=footer-preset-1");
    });

    it("should include preset tags when presets are provided", async () => {
      await service.fetchConfigs("deploy-123", "en", "header-1", "footer-1");
      expect(httpClient.get).toHaveBeenCalledWith(
        expect.any(String),
        undefined,
        expect.objectContaining({
          next: expect.objectContaining({
            tags: expect.arrayContaining([
              "header-preset:header-1",
              "footer-preset:footer-1",
            ]),
          }),
        }),
      );
    });
  });

  describe("resolvePath", () => {
    it("should call correct endpoint with path and locale", async () => {
      await service.resolvePath("deploy-123", "/about", "en");
      const callArgs = (httpClient.get as ReturnType<typeof vi.fn>).mock
        .calls[0];
      expect(callArgs[0]).toContain(
        "/api/v1/public/sites/deploy-123/resolve-path",
      );
      expect(callArgs[0]).toContain("path=%2Fabout");
      expect(callArgs[0]).toContain("locale=en");
    });

    it("should include fetch_content option when provided", async () => {
      await service.resolvePath("deploy-123", "/about", "en", {
        fetchContent: true,
      });
      const callArgs = (httpClient.get as ReturnType<typeof vi.fn>).mock
        .calls[0];
      expect(callArgs[0]).toContain("fetch_content=true");
    });

    it("should include mode option when provided", async () => {
      await service.resolvePath("deploy-123", "/about", "en", {
        mode: "all",
      });
      const callArgs = (httpClient.get as ReturnType<typeof vi.fn>).mock
        .calls[0];
      expect(callArgs[0]).toContain("mode=all");
    });

    it("should include caching tags", async () => {
      await service.resolvePath("deploy-123", "/about", "en");
      expect(httpClient.get).toHaveBeenCalledWith(
        expect.any(String),
        undefined,
        expect.objectContaining({
          next: expect.objectContaining({
            tags: expect.arrayContaining([
              "site:deploy-123",
              "path:deploy-123:en:/about",
              "content",
            ]),
          }),
        }),
      );
    });
  });

  describe("resolvePaths", () => {
    it("should POST with paths array and locale", async () => {
      await service.resolvePaths("deploy-123", ["/page1", "/page2"], "en");
      expect(httpClient.post).toHaveBeenCalledWith(
        "/api/v1/public/sites/deploy-123/resolve-paths",
        {
          paths: ["/page1", "/page2"],
          locale: "en",
          fetch_content: false,
        },
      );
    });

    it("should include fetch_content when specified", async () => {
      await service.resolvePaths("deploy-123", ["/page1"], "en", true);
      expect(httpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ fetch_content: true }),
      );
    });
  });

  describe("fetchAllPaths", () => {
    it("should call correct endpoint with locale", async () => {
      await service.fetchAllPaths("deploy-123", "en");
      const callArgs = (httpClient.get as ReturnType<typeof vi.fn>).mock
        .calls[0];
      expect(callArgs[0]).toContain(
        "/api/v1/public/sites/deploy-123/all-paths",
      );
      expect(callArgs[0]).toContain("locale=en");
    });

    it("should include limit and offset options", async () => {
      await service.fetchAllPaths("deploy-123", "en", {
        limit: 50,
        offset: 100,
      });
      const callArgs = (httpClient.get as ReturnType<typeof vi.fn>).mock
        .calls[0];
      expect(callArgs[0]).toContain("limit=50");
      expect(callArgs[0]).toContain("offset=100");
    });
  });

  describe("fetchPageSections", () => {
    it("should call correct endpoint with encoded path", async () => {
      await service.fetchPageSections("deploy-123", "/about/team");
      expect(httpClient.get).toHaveBeenCalledWith(
        "/api/v1/sites/deploy-123/pages/%2Fabout%2Fteam/sections",
      );
    });

    it("should default to / when path is empty", async () => {
      await service.fetchPageSections("deploy-123", "");
      expect(httpClient.get).toHaveBeenCalledWith(
        "/api/v1/sites/deploy-123/pages/%2F/sections",
      );
    });
  });

  describe("fetchPageSEO", () => {
    it("should call correct endpoint with encoded path", async () => {
      await service.fetchPageSEO("deploy-123", "/about");
      expect(httpClient.get).toHaveBeenCalledWith(
        "/api/v1/sites/deploy-123/pages/%2Fabout/seo",
      );
    });
  });

  describe("fetchRedirects", () => {
    it("should call correct endpoint", async () => {
      await service.fetchRedirects("deploy-123");
      expect(httpClient.get).toHaveBeenCalledWith(
        "/api/v1/sites/deploy-123/redirects",
      );
    });
  });

  describe("fetchSitemap", () => {
    it("should call correct endpoint", async () => {
      await service.fetchSitemap("deploy-123");
      expect(httpClient.get).toHaveBeenCalledWith(
        "/api/v1/sites/deploy-123/sitemap",
      );
    });
  });

  describe("fetchRobots", () => {
    it("should call correct endpoint", async () => {
      await service.fetchRobots("deploy-123");
      expect(httpClient.get).toHaveBeenCalledWith(
        "/api/v1/sites/deploy-123/robots",
      );
    });
  });
});
