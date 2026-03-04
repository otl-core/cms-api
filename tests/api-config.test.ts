import { describe, expect, it, vi } from "vitest";
import { createAPIConfig, validateAPIConfig } from "../src/api.config";
import type { APIConfig } from "../src/api.config";

const validConfig: APIConfig = {
  http: {
    baseUrl: "https://api.example.com",
    timeout: 30000,
    defaultHeaders: { "Content-Type": "application/json" },
  },
  siteId: "deploy-123",
  devToken: "kpt_test-token",
  environment: "development",
};

describe("API Configuration", () => {
  describe("validateAPIConfig", () => {
    it("should accept a valid config", () => {
      expect(() => validateAPIConfig(validConfig)).not.toThrow();
    });

    it("should reject empty base URL", () => {
      const config: APIConfig = {
        ...validConfig,
        http: { ...validConfig.http, baseUrl: "" },
      };
      expect(() => validateAPIConfig(config)).toThrow(
        "API base URL is required",
      );
    });

    it("should reject invalid base URL format", () => {
      const config: APIConfig = {
        ...validConfig,
        http: { ...validConfig.http, baseUrl: "not-a-url" },
      };
      expect(() => validateAPIConfig(config)).toThrow(
        "Invalid API base URL format",
      );
    });

    it("should reject empty site ID", () => {
      const config: APIConfig = {
        ...validConfig,
        siteId: "",
      };
      expect(() => validateAPIConfig(config)).toThrow("Site ID is required");
    });

    it("should reject missing access token", () => {
      const config: APIConfig = {
        ...validConfig,
        devToken: undefined,
      };
      expect(() => validateAPIConfig(config)).toThrow(
        "Site access token is required",
      );
    });

    it("should warn about very low timeout", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const config: APIConfig = {
        ...validConfig,
        http: { ...validConfig.http, timeout: 500 },
      };
      validateAPIConfig(config);
      expect(warnSpy).toHaveBeenCalledWith(
        "API timeout is very low, this might cause issues",
      );
      warnSpy.mockRestore();
    });

    it("should not warn about normal timeout values", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      validateAPIConfig(validConfig);
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe("createAPIConfig", () => {
    it("should create config with overrides", () => {
      const result = createAPIConfig({
        siteId: "override-deploy",
        environment: "staging",
      });
      expect(result.siteId).toBe("override-deploy");
      expect(result.environment).toBe("staging");
    });

    it("should deep-merge http config", () => {
      const result = createAPIConfig({
        http: { baseUrl: "https://override.example.com" },
      });
      expect(result.http.baseUrl).toBe("https://override.example.com");
      expect(result.http.timeout).toBe(30000);
    });

    it("should preserve defaults when no overrides provided", () => {
      const result = createAPIConfig();
      expect(result.http.timeout).toBe(30000);
      expect(result.environment).toBeDefined();
    });
  });
});
