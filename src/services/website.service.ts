/**
 * Website Service
 * Handles configuration, path resolution, sitemap, and redirect operations
 */

import type { APIResponse, SiteConfig } from "@otl-core/cms-types";
import { HttpClient } from "../http-client";

export interface PathResolutionResponse {
  path: string;
  type:
    | "page"
    | "collection"
    | "entry"
    | "category"
    | "category_index"
    | "author"
    | "author_index"
    | "tag"
    | "tag_index"
    | "redirect"
    | "not_found"
    | "multiple";
  content_id?: string;
  entry_id?: string;
  category_id?: string;
  collection_id?: string;
  locale: string;
  content?: Record<string, unknown>;
  redirect?: {
    to_path?: string;
    to_url?: string;
    status_code: number;
    query_string_behavior: string;
  };
  status_code?: number;
  cache_ttl: number;
  all_matches?: {
    redirect?: unknown;
    page?: unknown;
    category?: unknown;
    entry?: unknown;
    primary_match: string;
  };
}

export interface BatchPathResolutionResponse {
  results: PathResolutionResponse[];
}

export interface PathInfo {
  path: string;
  content_type: string;
  content_id?: string;
  locale: string;
}

export interface AllPathsResponse {
  paths: PathInfo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export class WebsiteService {
  constructor(private httpClient: HttpClient) {}

  async fetchConfigs(
    siteId: string,
    locale?: string,
    headerPresetId?: string,
    footerPresetId?: string,
  ): Promise<APIResponse<SiteConfig>> {
    const params = new URLSearchParams();
    if (locale) params.set("locale", locale);
    if (headerPresetId) params.set("header_preset", headerPresetId);
    if (footerPresetId) params.set("footer_preset", footerPresetId);

    const queryString = params.toString();
    const url = queryString
      ? `/api/v1/public/sites/${siteId}/configs?${queryString}`
      : `/api/v1/public/sites/${siteId}/configs`;

    const defaultRevalidate = parseInt(
      process.env.CACHE_REVALIDATE_SECONDS || "60",
      10,
    );

    const tags = [`site:${siteId}`, `config:${siteId}`, "config"];
    if (headerPresetId) tags.push(`header-preset:${headerPresetId}`);
    if (footerPresetId) tags.push(`footer-preset:${footerPresetId}`);

    return this.httpClient.get(url, undefined, {
      next: {
        revalidate: defaultRevalidate === 0 ? false : defaultRevalidate,
        tags,
      },
    });
  }

  async resolvePath(
    siteId: string,
    path: string,
    locale: string,
    options?: {
      fetchContent?: boolean;
      mode?: "default" | "all";
      page?: number;
      perPage?: number;
      searchQuery?: string;
    },
  ): Promise<APIResponse<PathResolutionResponse>> {
    const params = new URLSearchParams({
      path,
      locale,
      ...(options?.fetchContent && { fetch_content: "true" }),
      ...(options?.mode && { mode: options.mode }),
      ...(options?.page && { page: options.page.toString() }),
      ...(options?.perPage && { perPage: options.perPage.toString() }),
      ...(options?.searchQuery && { q: options.searchQuery }),
    });

    const defaultRevalidate = parseInt(
      process.env.CACHE_REVALIDATE_SECONDS || "60",
      10,
    );

    return this.httpClient.get(
      `/api/v1/public/sites/${siteId}/resolve-path?${params}`,
      undefined,
      {
        next: {
          revalidate: defaultRevalidate === 0 ? false : defaultRevalidate,
          tags: [
            `site:${siteId}`,
            `path:${siteId}:${locale}:${path}`,
            "content",
          ],
        },
      },
    );
  }

  async resolvePaths(
    siteId: string,
    paths: string[],
    locale: string,
    fetchContent: boolean = false,
  ): Promise<APIResponse<BatchPathResolutionResponse>> {
    return this.httpClient.post(
      `/api/v1/public/sites/${siteId}/resolve-paths`,
      {
        paths,
        locale,
        fetch_content: fetchContent,
      },
    );
  }

  async fetchAllPaths(
    siteId: string,
    locale: string,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<APIResponse<AllPathsResponse>> {
    const params = new URLSearchParams({
      locale,
      ...(options?.limit && { limit: options.limit.toString() }),
      ...(options?.offset && { offset: options.offset.toString() }),
    });

    return this.httpClient.get(
      `/api/v1/public/sites/${siteId}/all-paths?${params}`,
    );
  }

  async fetchPageSections(
    siteId: string,
    path: string,
  ): Promise<APIResponse<unknown[]>> {
    const encodedPath = encodeURIComponent(path || "/");
    return this.httpClient.get(
      `/api/v1/sites/${siteId}/pages/${encodedPath}/sections`,
    );
  }

  async fetchPageSEO(
    siteId: string,
    path: string,
  ): Promise<APIResponse<unknown>> {
    const encodedPath = encodeURIComponent(path || "/");
    return this.httpClient.get(
      `/api/v1/sites/${siteId}/pages/${encodedPath}/seo`,
    );
  }

  async fetchRedirects(siteId: string): Promise<APIResponse<unknown[]>> {
    return this.httpClient.get(`/api/v1/sites/${siteId}/redirects`);
  }

  async fetchSitemap(siteId: string): Promise<APIResponse<string>> {
    return this.httpClient.get(`/api/v1/sites/${siteId}/sitemap`);
  }

  async fetchRobots(siteId: string): Promise<APIResponse<string>> {
    return this.httpClient.get(`/api/v1/sites/${siteId}/robots`);
  }
}
