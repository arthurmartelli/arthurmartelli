// @ts-check
import { defineConfig } from 'astro/config';
import rehypeExternalLinks from 'rehype-external-links';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
    site: "https://arthurcm.com",
    trailingSlash: "never",
    base: "/",
    publicDir: "./public",

    output: "static",
    outDir: "./dist",
    compressHTML: true,
    vite: {
        plugins: [ tailwindcss() ]
    },

    image: { domains: ["images.unsplash.com"] },
    prefetch: { defaultStrategy: 'viewport' },
    markdown: {
        shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } },
        rehypePlugins: [[ rehypeExternalLinks, { content: { type: 'text', value: ' 🔗' } }]]
    },
});
