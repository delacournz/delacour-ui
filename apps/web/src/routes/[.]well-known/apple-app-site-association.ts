import { createFileRoute } from "@tanstack/react-router";
import { appleAppSiteAssociation } from "@/lib/native-app";

/**
 * The file iOS fetches — through Apple's CDN, at install time — to decide
 * whether this domain may open the playground app.
 *
 * A route handler rather than a file in `public/`, for two reasons that both
 * end in a silent 404. Vite does not reliably copy a leading-dot directory out
 * of `publicDir`, and Nitro types a static response from its extension, which
 * this filename does not have — Apple requires `application/json` and ignores
 * anything else. A handler settles both.
 *
 * `[.]` is the router generator's literal-dot escape, so the directory is not
 * hidden on disk.
 *
 * Apple caches the result, so a change here reaches devices on Apple's
 * schedule, not on a deploy's. Verify with
 * `curl -s https://app-site-association.cdn-apple.com/a/v1/ui.delacour.co.nz`.
 */
export const Route = createFileRoute("/.well-known/apple-app-site-association")({
	server: {
		handlers: {
			GET() {
				return new Response(JSON.stringify(appleAppSiteAssociation()), {
					headers: { "Content-Type": "application/json" },
				});
			},
		},
	},
});
