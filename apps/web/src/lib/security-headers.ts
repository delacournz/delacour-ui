/**
 * The response headers every page carries. None of them changes what a reader
 * sees; together they are what an auditor (and a search engine's trust signals)
 * check first.
 *
 * - **HSTS** for a year, subdomains included, no `preload` — preloading is a
 *   decision for the apex `delacour.co.nz`, not this host.
 * - **`X-Frame-Options: SAMEORIGIN`** — nothing embeds this site, and nothing here
 *   embeds itself from another origin.
 * - **No CSP yet.** GA's inline bootstrap and the theme-color script would need
 *   nonces threaded through SSR; a CSP that is `unsafe-inline` buys nothing.
 */
export const SECURITY_HEADERS = {
	"Strict-Transport-Security": "max-age=31536000; includeSubDomains",
	"X-Content-Type-Options": "nosniff",
	"X-Frame-Options": "SAMEORIGIN",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	"Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
} as const satisfies Record<string, string>;

/** The response with every header in `SECURITY_HEADERS` a route did not already set. */
export function withSecurityHeaders(response: Response): Response {
	const headers = new Headers(response.headers);
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) if (!headers.has(name)) headers.set(name, value);

	return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
