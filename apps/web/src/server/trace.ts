import { withServerSpan } from "@delacournz/otel-start";

/** Railway injects `OTEL_SERVICE_NAME` with tracing on; the resource takes it from there, this only labels the metrics. */
const SERVICE = process.env.OTEL_SERVICE_NAME ?? "ui-web";

/**
 * Runs one Nitro middleware turn inside `@delacournz/otel-start`'s SERVER span, continuing the
 * caller's W3C `traceparent`. `withServerSpan` wraps a `fetch`-shaped handler, but `next()` may
 * resolve to a non-`Response` body, so the span is given a stand-in carrying `status` and the
 * original body is what the middleware returns. A no-op until the preload registers a provider.
 */
export async function traceRequest(request: Request, next: () => unknown, status: () => number): Promise<unknown> {
	let body: unknown;
	const handle = withServerSpan(SERVICE, async () => {
		body = await next();
		return body instanceof Response ? body : new Response(null, { status: status() });
	});
	await handle(request);
	return body;
}
