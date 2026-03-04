import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  APIClient,
  initializeAPIClient,
  getAPIClient,
} from "../src/api-client";
import type { APIConfig } from "../src/api.config";

const testConfig: APIConfig = {
  http: {
    baseUrl: "https://api.test.com",
    timeout: 30000,
    defaultHeaders: { "Content-Type": "application/json" },
  },
  siteId: "test-deploy-id",
  devToken: "kpt_test-token",
  environment: "development",
};

describe("APIClient", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  describe("constructor", () => {
    it("should initialize with provided config", () => {
      const client = new APIClient(testConfig);
      expect(client.getSiteId()).toBe("test-deploy-id");
      expect(client.getBaseUrl()).toBe("https://api.test.com");
    });

    it("should expose all service instances", () => {
      const client = new APIClient(testConfig);
      expect(client.website).toBeDefined();
      expect(client.collection).toBeDefined();
      expect(client.media).toBeDefined();
      expect(client.forms).toBeDefined();
    });
  });

  describe("getSiteId / setSiteId", () => {
    it("should get and set site ID", () => {
      const client = new APIClient(testConfig);
      expect(client.getSiteId()).toBe("test-deploy-id");

      client.setSiteId("new-deploy-id");
      expect(client.getSiteId()).toBe("new-deploy-id");
    });
  });

  describe("getBaseUrl / setBaseUrl", () => {
    it("should get and set base URL", () => {
      const client = new APIClient(testConfig);
      expect(client.getBaseUrl()).toBe("https://api.test.com");

      client.setBaseUrl("https://new-api.test.com");
      expect(client.getBaseUrl()).toBe("https://new-api.test.com");
    });
  });

  describe("getConfig", () => {
    it("should return a copy of the config", () => {
      const client = new APIClient(testConfig);
      const config = client.getConfig();
      expect(config.siteId).toBe("test-deploy-id");
      expect(config.environment).toBe("development");

      // Verify it's a copy, not a reference
      config.siteId = "mutated";
      expect(client.getSiteId()).toBe("test-deploy-id");
    });
  });

  describe("auth token management", () => {
    it("should set auth token without throwing", () => {
      const client = new APIClient(testConfig);
      expect(() => client.setAuthToken("new-token")).not.toThrow();
    });

    it("should remove auth token without throwing", () => {
      const client = new APIClient(testConfig);
      client.setAuthToken("token");
      expect(() => client.removeAuthToken()).not.toThrow();
    });
  });
});

describe("Singleton pattern", () => {
  beforeEach(() => {
    initializeAPIClient(testConfig);
  });

  it("initializeAPIClient should create a new instance", () => {
    const client = initializeAPIClient(testConfig);
    expect(client.getSiteId()).toBe("test-deploy-id");
  });

  it("getAPIClient should return the initialized instance", () => {
    initializeAPIClient(testConfig);
    const client = getAPIClient();
    expect(client.getSiteId()).toBe("test-deploy-id");
  });

  it("initializeAPIClient should replace existing instance", () => {
    initializeAPIClient(testConfig);

    const newConfig: APIConfig = {
      ...testConfig,
      siteId: "replaced-deploy-id",
    };
    initializeAPIClient(newConfig);

    const client = getAPIClient();
    expect(client.getSiteId()).toBe("replaced-deploy-id");
  });
});
