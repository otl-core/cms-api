/**
 * Collection Service
 * Handles collection, entry, and category retrieval
 */

import type {
  APIResponse,
  Collection,
  Category,
  Entry,
} from "@otl-core/cms-types";
import { HttpClient } from "../http-client";

export class CollectionService {
  constructor(private httpClient: HttpClient) {}

  async fetchCollections(siteId: string): Promise<APIResponse<Collection[]>> {
    return this.httpClient.get(`/api/v1/public/sites/${siteId}/collections`);
  }

  async fetchEntries(
    collectionId: string,
    params?: { page?: number; limit?: number; category?: string },
  ): Promise<APIResponse<Entry[]>> {
    return this.httpClient.get(
      `/api/v1/public/collections/${collectionId}/entries`,
      params,
    );
  }

  async fetchEntry(
    collectionId: string,
    entrySlug: string,
  ): Promise<APIResponse<Entry>> {
    return this.httpClient.get(
      `/api/v1/public/collections/${collectionId}/entries/${entrySlug}`,
    );
  }

  async fetchCategories(
    collectionId: string,
  ): Promise<APIResponse<Category[]>> {
    return this.httpClient.get(
      `/api/v1/public/collections/${collectionId}/categories`,
    );
  }
}
