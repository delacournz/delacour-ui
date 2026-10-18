import { type Context, context, propagation, type Span, SpanKind, SpanStatusCode, trace } from "@opentelemetry/api";

const tracer = trace.getTracer("delacour-ui-web");

const headerGetter = {
	get: (carrier: Headers, key: string): string | undefined => carrier.get(key) ?? undefined,
	keys: (carrier: Headers): string[] => [...carrier.keys()],
};

/** The parent context a request carries in `traceparent` / `tracestate`, or the active one. */
export function extractContext(headers: Headers): Context {
	return propagation.extract(context.active(), headers, headerGetter);
}

function startServerSpan(request: Request): Span {
	const url = new URL(request.url);
	return tracer.startSpan(
		`${request.method} ${url.pathname}`,
		{
			kind: SpanKind.SERVER,
			attributes: {
				"http.request.method": request.method,
				"url.path": url.pathname,
				"url.scheme": url.protocol.replace(":", ""),
				"server.address": url.hostname,
				"user_agent.original": request.headers.get("user-agent") ?? undefined,
			},
		},
		extractContext(request.headers)
	);
}

/**
 * Runs `handle` inside a SERVER span for `request`, continuing an incoming W3C trace.
 * Bun's `Bun.serve` is invisible to the SDK's HTTP instrumentation, so this is the one place a
 * request span is made. A no-op tracer (no provider registered) makes this free.
 */
export async function withServerSpan<T extends { response: Response }>(
	request: Request,
	handle: () => T | Promise<T>
): Promise<T> {
	const span = startServerSpan(request);
	try {
		const result = await context.with(trace.setSpan(context.active(), span), handle);
		const status = result.response.status;
		span.setAttribute("http.response.status_code", status);
		if (status >= 500) span.setStatus({ code: SpanStatusCode.ERROR });
		return result;
	} catch (error) {
		if (error instanceof Response) {
			span.setAttribute("http.response.status_code", error.status);
		} else if (error instanceof Error) {
			span.recordException(error);
			span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
		}
		throw error;
	} finally {
		span.end();
	}
}
