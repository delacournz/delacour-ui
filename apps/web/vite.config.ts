import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fumadocsMdx } from "fumadocs-mdx/vite";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
	server: {
		port: 3000,
	},
	plugins: [
		fumadocsMdx(),
		tailwindcss(),
		// Prerendering is off: the crawler times out against its own dev server
		// here and emits 0 pages, and Railway runs a live process anyway. Turn it
		// back on only alongside a static host.
		tanstackStart(),
		react(),
		// Railway runs the built server as a long-lived Bun process:
		// `bun .output/server/index.mjs`, honouring $PORT.
		nitro({
			preset: "bun",
		}),
	],
	resolve: {
		tsconfigPaths: true,
		alias: {
			tslib: "tslib/tslib.es6.js",
		},
	},
});
