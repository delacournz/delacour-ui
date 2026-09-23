/**
 * Content types worth compressing. Images, video and fonts are already
 * compressed formats — gzipping them costs CPU and saves nothing.
 */
const COMPRESSIBLE = /^(text\/|application\/(json|javascript|xml|manifest\+json)|image\/svg\+xml)/;

/** Whether `Accept-Encoding` admits gzip — `gzip;q=0` is an explicit refusal. */
function acceptsGzip(request: Request): boolean {
	const header = request.headers.get("Accept-Encoding") ?? "";

	return header.split(",").some((part) => {
		const [coding, ...params] = part.trim().split(";");
		if (coding?.trim().toLowerCase() !== "gzip") return false;
		const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
		return q === undefined || Number(q.slice(2)) > 0;
	});
}

/**
 * Gzip a server-rendered response on the way out.
 *
 * Railway's edge passes responses through as the process wrote them, and Nitro's
 * Bun preset writes them raw — so every page went over the wire uncompressed,
 * a `/theme` page at ~134 KB where gzip makes it ~20 KB. Static files under
 * `/assets` are precompressed at build instead (`compressPublicAssets` in
 * `vite.config.ts`); this covers everything the router renders.
 *
 * Gzip rather than Brotli because `CompressionStream` only standardises gzip and
 * deflate. Streaming is preserved: the body is piped, never buffered.
 */
export function gzipResponse(request: Request, response: Response): Response {
	if (request.method === "HEAD" || response.body === null) return response;
	if (response.headers.has("Content-Encoding")) return response;
	if (!COMPRESSIBLE.test(response.headers.get("Content-Type") ?? "")) return response;
	if (!acceptsGzip(request)) return response;

	const headers = new Headers(response.headers);
	headers.set("Content-Encoding", "gzip");
	headers.delete("Content-Length");
	const vary = headers.get("Vary");
	headers.set("Vary", vary ? `${vary}, Accept-Encoding` : "Accept-Encoding");

	return new Response(response.body.pipeThrough(new CompressionStream("gzip")), {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}
