import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    env: {
      SITE_ID: "test-deploy-id",
      SITE_ACCESS_TOKEN: "kpt_test-token",
      API_URL: "https://api.test.com",
    },
  },
});
