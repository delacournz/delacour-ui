import { createFileRoute } from "@tanstack/react-router";
import { assetLinks } from "@/lib/native-app";

/**
 * Android's half of the association, fetched by Play Services to verify the
 * `autoVerify` intent filters in the playground's `app.config.ts`.
 *
 * A handler for the same reason as its iOS twin next door: a leading-dot
 * directory under `public/` is not a dependable build output.
 *
 * Verification fails while `ANDROID_SHA256_FINGERPRINTS` is empty, and a
 * playground link opens the browser instead of the app — which is the fallback
 * page, so the unfinished state degrades rather than breaks. Check it with
 * `https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=…`.
 */
export const Route = createFileRoute("/.well-known/assetlinks.json")({
	server: {
		handlers: {
			GET() {
				return new Response(JSON.stringify(assetLinks()), {
					headers: { "Content-Type": "application/json" },
				});
			},
		},
	},
});
