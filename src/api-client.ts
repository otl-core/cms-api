/**
 * API Client
 * Main interface for CMS backend communication - SERVER-SIDE ONLY
 *
 * This module is protected by the `server-only` package.
 * Any attempt to import it from a client component will fail at build time.
 */

import { CollectionService } from "./services/collection.service";
import { APIConfig, defaultAPIConfig, validateAPIConfig } from "./api.config";
import { FormService } from "./services/form.service";
import { HttpClient } from "./http-client";
import { MediaService } from "./services/media.service";
import { WebsiteService } from "./services/website.service";

export class APIClient {
  private httpClient: HttpClient;
  private config: APIConfig;

  public readonly website: WebsiteService;
  public readonly collection: CollectionService;
  public readonly media: MediaService;
  public readonly forms: FormService;

  constructor(config?: Partial<APIConfig>) {
    this.config = {
      ...defaultAPIConfig,
      ...config,
      http: {
        ...defaultAPIConfig.http,
        ...config?.http,
      },
    };

    validateAPIConfig(this.config);

    this.httpClient = new HttpClient(this.config.http);

    if (this.config.devToken) {
      this.httpClient.setAuthToken(this.config.devToken);
    }

    this.website = new WebsiteService(this.httpClient);
    this.collection = new CollectionService(this.httpClient);
    this.media = new MediaService(this.httpClient);
    this.forms = new FormService(this.httpClient);
  }

  getSiteId(): string {
    return this.config.siteId;
  }

  setSiteId(siteId: string): void {
    this.config.siteId = siteId;
  }

  setAuthToken(token: string): void {
    this.httpClient.setAuthToken(token);
  }

  removeAuthToken(): void {
    this.httpClient.removeAuthToken();
  }

  setBaseUrl(baseUrl: string): void {
    this.httpClient.setBaseUrl(baseUrl);
    this.config.http.baseUrl = baseUrl;
  }

  getBaseUrl(): string {
    return this.httpClient.baseUrl;
  }

  getConfig(): APIConfig {
    return { ...this.config };
  }
}

// Singleton instance
let apiClient: APIClient;

/**
 * Initialize the API client
 */
export function initializeAPIClient(config?: Partial<APIConfig>): APIClient {
  apiClient = new APIClient(config);
  return apiClient;
}

/**
 * Get the initialized API client instance
 */
export function getAPIClient(): APIClient {
  if (!apiClient) {
    try {
      apiClient = new APIClient();
    } catch (error) {
      console.error("Failed to initialize API client:", error);
      throw error;
    }
  }
  return apiClient;
}
