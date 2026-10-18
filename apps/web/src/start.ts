import { redirect } from "@tanstack/react-router";
import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";
import { isMarkdownPreferred } from "fumadocs-core/negotiation";
import { reportAgentFetch } from "@/lib/analytics/server";
import { compressResponse } from "@/lib/compress";
import { blockCrawlerResponse, isBlockedCrawler } from "@/lib/crawler-block";
import { createPresetLimiter, presetLimitedResponse } from "@/lib/preset-rate-limit";
import { docsRoute, encodeMarkdownUrl } from "@/lib/shared";
import { withServerSpan } from "@/lib/tracing";

const csrfMiddleware = createCsrfMiddleware({
	filter: (ctx) => ctx.handlerType === "serverFn",
});

const llmMiddleware = createMiddleware().server(({ next, request }) => {
	const url = new URL(request.url);

	if (url.pathname.startsWith(docsRoute) && !url.pathname.endsWith(".md") && isMarkdownPreferred(request)) {
		const slugs = url.pathname
			.slice(docsRoute.length)
			.split("/")
			.filter((v) => v.length > 0);
		url.pathname = encodeMarkdownUrl(slugs);

		// this URL has two representations, selected by `Accept`
		throw redirect({ href: url.href, headers: { Vary: "Accept" } });
	}

	return next();
});

const presetLimiter = createPresetLimiter();

/**
 * Outermost, so the SERVER span covers everything below it, including a refused crawler. See
 * `src/lib/tracing.ts`; `otel/register.mjs` supplies the provider.
 */
const tracingMiddleware = createMiddleware().server(({ next, request }) => withServerSpan(request, () => next()));

/**
 * Just inside the span: a refused crawler costs one tiny 403, never a render. A request the
 * edge cache answers does not reach this process — see `src/lib/crawler-block.ts`.
 * An IP loading `/theme?preset=` pages faster than a reader can gets a 429 — see
 * `src/lib/preset-rate-limit.ts`.
 */
const crawlerBlockMiddleware = createMiddleware().server(({ next, request }) => {
	if (isBlockedCrawler(request)) return blockCrawlerResponse();
	if (presetLimiter.isLimited(request)) return presetLimitedResponse(presetLimiter.retryAfterSeconds());
	return next();
});

/**
 * Just inside the block, so it wraps whatever the rest of the chain renders. See
 * `src/lib/compress.ts`.
 */
const compressionMiddleware = createMiddleware().server(async ({ next, request }) => {
	const result = await next();
	return compressResponse(request, result.response);
});

/**
 * Counts reads of the Markdown the site serves to agents — see
 * `src/lib/analytics/server.ts`. `llmMiddleware`'s `Accept: text/markdown` redirect is
 * not counted here; the `.md` request it redirects to is.
 */
const analyticsMiddleware = createMiddleware().server(({ next, request }) => {
	reportAgentFetch(request);
	return next();
});

export const startInstance = createStart(() => {
	return {
		requestMiddleware: [
			tracingMiddleware,
			crawlerBlockMiddleware,
			compressionMiddleware,
			csrfMiddleware,
			analyticsMiddleware,
			llmMiddleware,
		],
	};
});
