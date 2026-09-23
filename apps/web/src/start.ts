import { redirect } from "@tanstack/react-router";
import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";
import { isMarkdownPreferred } from "fumadocs-core/negotiation";
import { reportAgentFetch } from "@/lib/analytics/server";
import { gzipResponse } from "@/lib/compress";
import { docsRoute, encodeMarkdownUrl } from "@/lib/shared";

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

/**
 * Counts reads of the Markdown the site serves to agents — see
 * `src/lib/analytics/server.ts`. The `Accept: text/markdown` redirect below is
 * not counted here; the `.md` request it redirects to is.
 */
const analyticsMiddleware = createMiddleware().server(({ next, request }) => {
	reportAgentFetch(request);
	return next();
});

/**
 * Outermost, so it wraps whatever the rest of the chain renders. See
 * `src/lib/compress.ts`.
 */
const compressionMiddleware = createMiddleware().server(async ({ next, request }) => {
	const result = await next();
	return gzipResponse(request, result.response);
});

export const startInstance = createStart(() => {
	return {
		requestMiddleware: [compressionMiddleware, csrfMiddleware, analyticsMiddleware, llmMiddleware],
	};
});
