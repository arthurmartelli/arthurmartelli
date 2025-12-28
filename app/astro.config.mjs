// @ts-check

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://arthurcm.com",
  integrations: [mdx(), sitemap()],
  devToolbar: { enabled: process.env.NODE_ENV === "development" },
  markdown: {
    syntaxHighlight: "shiki",
    shikiConfig: {
      theme: "one-dark-pro",
      wrap: true,
    },
  },
  prefetch: { defaultStrategy: "viewport" },
});
