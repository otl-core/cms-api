/**
 * API Configuration
 * Server-side only configuration for CMS backend communication.
 * Uses only process.env.API_URL (never NEXT_PUBLIC_ prefixed variables).
 */

import { HttpClientConfig } from "./http-client";

export interface APIConfig {
  http: HttpClientConfig;
  siteId: string;
  devToken?: string;
  environment: "development" | "production" | "staging";
}

/**
 * Get backend API base URL (server-side only, never exposed to client)
 */
function getBackendApiBaseUrl(): string {
  if (process.env.API_URL) {
    return process.env.API_URL;
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:8080";
  }

  if (process.env.STAGE === "staging") {
    return "https://api-staging.otl-cms.com";
  }

  return "https://api.otl-cms.com";
}

/**
 * Get site ID from environment (server-side only)
 */
function getBackendSiteId(): string {
  const siteId = process.env.SITE_ID;
  if (!siteId) {
    console.error("SITE_ID environment variable is not set!");
    console.error("Add the following to your .env.local:");
    console.error("  SITE_ID=your-site-id");
    console.error("  API_URL=http://localhost:8080");
    throw new Error("SITE_ID environment variable is required.");
  }
  return siteId;
}

/**
 * Get site access token from environment (server-side only)
 */
function getSiteAccessToken(): string {
  const token = process.env.SITE_ACCESS_TOKEN;
  if (!token) {
    console.error("SITE_ACCESS_TOKEN environment variable is not set!");
    console.error("Add the following to your .env.local:");
    console.error("  SITE_ACCESS_TOKEN=kpt_...");
    console.error("");
    console.error("To obtain an access token:");
    console.error("1. Log into the CMS management interface");
    console.error("2. Navigate to your site settings");
    console.error("3. Go to Access Tokens section");
    console.error("4. Create a new token and copy it here");
    throw new Error(
      "SITE_ACCESS_TOKEN environment variable is required. " +
        "Please obtain an access token from the CMS site settings.",
    );
  }
  return token;
}

/**
 * Get current environment (server-side only)
 */
function getBackendEnvironment(): "development" | "production" | "staging" {
  if (process.env.NODE_ENV === "production") {
    return process.env.STAGE === "staging" ? "staging" : "production";
  }
  return "development";
}

/**
 * Default API configuration
 */
export const defaultAPIConfig: APIConfig = {
  http: {
    baseUrl: getBackendApiBaseUrl(),
    timeout: 30000,
    defaultHeaders: {
      "Content-Type": "application/json",
      "User-Agent": "OTL-CMS-Engine/1.0",
    },
  },
  siteId: getBackendSiteId(),
  devToken: getSiteAccessToken(),
  environment: getBackendEnvironment(),
};

/**
 * Create API configuration with overrides
 */
export function createAPIConfig(overrides?: Partial<APIConfig>): APIConfig {
  return {
    ...defaultAPIConfig,
    ...overrides,
    http: {
      ...defaultAPIConfig.http,
      ...overrides?.http,
    },
  };
}

/**
 * Validate API configuration
 */
export function validateAPIConfig(config: APIConfig): void {
  if (!config.http.baseUrl) {
    throw new Error("API base URL is required");
  }

  try {
    new URL(config.http.baseUrl);
  } catch {
    throw new Error("Invalid API base URL format");
  }

  if (!config.siteId) {
    throw new Error("Site ID is required");
  }

  if (!config.devToken) {
    throw new Error(
      "Site access token is required. " +
        "Please set SITE_ACCESS_TOKEN environment variable.",
    );
  }

  if (config.http.timeout && config.http.timeout < 1000) {
    console.warn("API timeout is very low, this might cause issues");
  }
}
