/**
 * @otl-core/cms-api
 * Server-side API client for OTL CMS backend communication.
 *
 * This package is enforced server-only via the `server-only` package.
 * The backend URL (API_URL) is never exposed to client JavaScript.
 */

import "server-only";

// API Client
export { APIClient, initializeAPIClient, getAPIClient } from "./api-client";

// HTTP Client
export { HttpClient } from "./http-client";
export type { HttpClientConfig } from "./http-client";

// API Configuration
export {
  defaultAPIConfig,
  createAPIConfig,
  validateAPIConfig,
} from "./api.config";
export type { APIConfig } from "./api.config";

// Services
export { CollectionService } from "./services/collection.service";
export { FormService } from "./services/form.service";
export { MediaService } from "./services/media.service";
export { WebsiteService } from "./services/website.service";

// Response types from services
export type {
  PathResolutionResponse,
  BatchPathResolutionResponse,
  PathInfo,
  AllPathsResponse,
} from "./services/website.service";
