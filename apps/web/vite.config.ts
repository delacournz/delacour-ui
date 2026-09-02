import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { fumadocsMdx } from "fumadocs-mdx/vite";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
	server: {
		port: 3000,
		// All interfaces, not just loopback. `apps/playground`'s Generate CSS button
		// opens this site at whatever host Metro reached the app on — a LAN address
		// on a device, and on a simulator too whenever Metro was started on the LAN
		// rather than on localhost. Vite's default binds to `::1`, so every one of
		// those links died at "Safari can't open the page". Metro is already on the
		// LAN on 8088 for the same reason.
		host: true,
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
