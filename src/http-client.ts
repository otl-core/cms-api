export interface HttpClientConfig {
  baseUrl: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
}

interface FetchOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string | undefined>;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
}

export class HttpClient {
  public baseUrl: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;

  constructor(config: HttpClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.timeout = config.timeout || 30000;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      ...config.defaultHeaders,
    };
  }

  /**
   * Make a generic HTTP request
   */
  private async request<T>(
    endpoint: string,
    options: FetchOptions = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const { next: nextOptions, ...fetchOptions } = options;

    const mergedHeaders: Record<string, string | undefined> = {
      ...this.defaultHeaders,
      ...fetchOptions.headers,
    };
    const headers = Object.fromEntries(
      Object.entries(mergedHeaders).filter(
        (entry): entry is [string, string] => entry[1] !== undefined,
      ),
    );

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
        ...(process.env.NODE_ENV === "development"
          ? { cache: "no-store" as const }
          : nextOptions
            ? { next: nextOptions }
            : {}),
      });

      clearTimeout(timeoutId);

      // Server error (5xx) -- try stale cache before returning the error
      if (
        response.status >= 500 &&
        process.env.NODE_ENV === "production" &&
        nextOptions
      ) {
        const staleData = await this.tryStaleCache<T>(
          url,
          fetchOptions,
          headers,
        );
        if (staleData !== null) return staleData;
      }

      const data = await response.json();

      if (!response.ok) {
        if (data && typeof data === "object") {
          if ("success" in data) {
            return data;
          }
          if ("type" in data) {
            return {
              success: response.status >= 200 && response.status < 300,
              data,
            } as T;
          }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        // Network failure, timeout, or unstructured error -- try stale cache
        if (process.env.NODE_ENV === "production" && nextOptions) {
          const staleData = await this.tryStaleCache<T>(
            url,
            fetchOptions,
            headers,
          );
          if (staleData !== null) return staleData;
        }

        if (error.name === "AbortError") {
          throw new Error("Request timeout");
        }
        throw error;
      }

      throw new Error("Unknown error occurred");
    }
  }

  /**
   * Attempt to serve a stale cached response when the backend is unreachable
   * or returning server errors. Returns null if no cache entry exists.
   */
  private async tryStaleCache<T>(
    url: string,
    fetchOptions: Omit<RequestInit, "headers">,
    headers: Record<string, string>,
  ): Promise<T | null> {
    try {
      console.warn(
        `[HttpClient] Backend unavailable, attempting stale cache: ${url}`,
      );
      const staleResponse = await fetch(url, {
        ...fetchOptions,
        headers,
        cache: "force-cache" as const,
      });

      if (staleResponse.ok) {
        const staleData = await staleResponse.json();
        console.log(`[HttpClient] Serving stale cache for: ${url}`);
        return staleData;
      }
    } catch (cacheError) {
      console.error(
        `[HttpClient] No cache available for: ${url}`,
        cacheError instanceof Error ? cacheError.message : cacheError,
      );
    }
    return null;
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, unknown>,
    options?: FetchOptions,
  ): Promise<T> {
    let url = endpoint;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });

      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }

    return this.request<T>(url, { method: "GET", ...options });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: formData,
      headers: { "Content-Type": undefined },
    });
  }

  setAuthToken(token: string) {
    this.defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  removeAuthToken() {
    delete this.defaultHeaders["Authorization"];
  }

  setBaseUrl(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }
}
