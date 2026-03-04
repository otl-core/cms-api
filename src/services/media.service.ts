/**
 * Media Service
 * Handles media file retrieval
 */

import type { APIResponse, Media } from "@otl-core/cms-types";
import { HttpClient } from "../http-client";

export class MediaService {
  constructor(private httpClient: HttpClient) {}

  async fetchMediaFile(
    siteId: string,
    mediaId: string,
  ): Promise<APIResponse<Media>> {
    return this.httpClient.get(
      `/api/v1/public/sites/${siteId}/media/${mediaId}`,
    );
  }

  async fetchMedia(siteId: string): Promise<APIResponse<Media[]>> {
    return this.httpClient.get(`/api/v1/public/sites/${siteId}/media`);
  }
}
