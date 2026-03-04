import { describe, expect, it, vi, beforeEach } from "vitest";
import { HttpClient } from "../src/http-client";

describe("HttpClient", () => {
  describe("constructor", () => {
    it("should set baseUrl and strip trailing slash", () => {
      const client = new HttpClient({
        baseUrl: "https://api.example.com/",
      });
      expect(client.baseUrl).toBe("https://api.example.com");
    });

    it("should preserve baseUrl without trailing slash", () => {
      const client = new HttpClient({
        baseUrl: "https://api.example.com",
      });
      expect(client.baseUrl).toBe("https://api.example.com");
    });

    it("should accept custom headers", () => {
      const client = new HttpClient({
        baseUrl: "https://api.example.com",
        defaultHeaders: { "X-Custom": "value" },
      });
      expect(client.baseUrl).toBe("https://api.example.com");
    });
  });

  describe("setAuthToken", () => {
    it("should set Authorization header with Bearer prefix", () => {
      const client = new HttpClient({
        baseUrl: "https://api.example.com",
      });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      global.fetch = mockFetch;

      client.setAuthToken("my-token");
      client.get("/test");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/test",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer my-token",
          }),
        }),
      );
    });
  });

  describe("removeAuthToken", () => {
    it("should remove Authorization header", () => {
      const client = new HttpClient({
        baseUrl: "https://api.example.com",
      });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      global.fetch = mockFetch;

      client.setAuthToken("my-token");
      client.removeAuthToken();
      client.get("/test");

      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1].headers;
      expect(headers.Authorization).toBeUndefined();
    });
  });

  describe("setBaseUrl", () => {
    it("should update baseUrl and strip trailing slash", () => {
      const client = new HttpClient({
        baseUrl: "https://old.example.com",
      });
      client.setBaseUrl("https://new.example.com/");
      expect(client.baseUrl).toBe("https://new.example.com");
    });
  });

  describe("get", () => {
    let client: HttpClient;
    let mockFetch: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      client = new HttpClient({ baseUrl: "https://api.example.com" });
      mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });
      global.fetch = mockFetch;
    });

    it("should make GET request to correct URL", async () => {
      await client.get("/api/v1/test");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/api/v1/test",
        expect.objectContaining({ method: "GET" }),
      );
    });

    it("should append query params", async () => {
      await client.get("/api/v1/test", { page: 1, limit: 10 });
      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain("page=1");
      expect(url).toContain("limit=10");
    });

    it("should skip undefined and null params", async () => {
      await client.get("/api/v1/test", { key: undefined, other: null });
      const url = mockFetch.mock.calls[0][0];
      expect(url).toBe("https://api.example.com/api/v1/test");
    });
  });

  describe("post", () => {
    let client: HttpClient;
    let mockFetch: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      client = new HttpClient({ baseUrl: "https://api.example.com" });
      mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      global.fetch = mockFetch;
    });

    it("should make POST request with JSON body", async () => {
      const data = { name: "test" };
      await client.post("/api/v1/test", data);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/api/v1/test",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(data),
        }),
      );
    });

    it("should make POST request without body when data is undefined", async () => {
      await client.post("/api/v1/test");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/api/v1/test",
        expect.objectContaining({
          method: "POST",
          body: undefined,
        }),
      );
    });
  });

  describe("put", () => {
    it("should make PUT request with JSON body", async () => {
      const client = new HttpClient({ baseUrl: "https://api.example.com" });
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      global.fetch = mockFetch;

      const data = { name: "updated" };
      await client.put("/api/v1/test/1", data);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/api/v1/test/1",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify(data),
        }),
      );
    });
  });

  describe("upload", () => {
    let client: HttpClient;
    let mockFetch: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      client = new HttpClient({ baseUrl: "https://api.example.com" });
      mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ id: "file-123", url: "/uploads/file.jpg" }),
      });
      global.fetch = mockFetch;
    });

    it("should send POST request with FormData", async () => {
      const formData = new FormData();
      formData.append("file", new Blob(["test content"]), "test.txt");

      await client.upload("/api/v1/upload", formData);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/api/v1/upload",
        expect.objectContaining({
          method: "POST",
          body: formData,
        }),
      );
    });

    it("should remove Content-Type header", async () => {
      const formData = new FormData();

      await client.upload("/api/v1/upload", formData);

      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1].headers as Record<string, string>;
      expect(headers["Content-Type"]).toBeUndefined();
    });

    it("should return parsed response data", async () => {
      const formData = new FormData();
      const responseData = { id: "file-456", url: "/uploads/avatar.png" };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(responseData),
      });

      const result = await client.upload<{ id: string; url: string }>(
        "/api/v1/upload",
        formData,
      );

      expect(result).toEqual(responseData);
    });
  });

  describe("delete", () => {
    it("should make DELETE request", async () => {
      const client = new HttpClient({ baseUrl: "https://api.example.com" });
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      global.fetch = mockFetch;

      await client.delete("/api/v1/test/1");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/api/v1/test/1",
        expect.objectContaining({ method: "DELETE" }),
      );
    });
  });

  describe("error handling", () => {
    it("should throw on non-ok response without success field", async () => {
      const client = new HttpClient({ baseUrl: "https://api.example.com" });
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: () => Promise.resolve({ error: "something failed" }),
      });

      await expect(client.get("/test")).rejects.toThrow(
        "HTTP 500: Internal Server Error",
      );
    });

    it("should return data with success field on non-ok response", async () => {
      const client = new HttpClient({ baseUrl: "https://api.example.com" });
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: () => Promise.resolve({ success: false, message: "Not found" }),
      });

      const result = await client.get("/test");
      expect(result).toEqual({ success: false, message: "Not found" });
    });
  });
});
