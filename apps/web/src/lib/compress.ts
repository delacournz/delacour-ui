import { constants, createBrotliCompress } from "node:zlib";

/**
 * Content types worth compressing. Images, video and fonts are already
 * compressed formats — compressing them costs CPU and saves nothing.
 */
const COMPRESSIBLE = /^(text\/|application\/(json|javascript|xml|manifest\+json)|image\/svg\+xml)/;

/**
 * Brotli quality for dynamic responses. 4 is roughly gzip-6 speed with a
 * markedly better ratio; 11 would stall a streamed SSR response on CPU.
 */
const BROTLI_QUALITY = 4;

type Encoding = "br" | "gzip";

/** Server preference when the client rates both equally. */
const PREFERENCE: readonly Encoding[] = ["br", "gzip"];

/** The q-value of every coding in `Accept-Encoding`; a missing `q` is 1. */
function parseAcceptEncoding(header: string): Map<string, number> {
	const weights = new Map<string, number>();

	for (const part of header.split(",")) {
		const [coding, ...params] = part.trim().split(";");
		const name = coding?.trim().toLowerCase();
		if (!name) continue;
		const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
		const weight = q === undefined ? 1 : Number(q.slice(2));
		weights.set(name, Number.isNaN(weight) ? 0 : weight);
	}

	return weights;
}

/**
 * The best encoding the client admits, or `null` for identity. Highest q wins, `br`
 * wins ties, `*` stands in for any coding not named, and `q=0` is a refusal.
 */
export function negotiateEncoding(request: Request): Encoding | null {
	const weights = parseAcceptEncoding(request.headers.get("Accept-Encoding") ?? "");
	const wildcard = weights.get("*") ?? 0;

	let best: Encoding | null = null;
	let bestWeight = 0;
	for (const encoding of PREFERENCE) {
		const weight = weights.get(encoding) ?? wildcard;
		if (weight > bestWeight) {
			best = encoding;
			bestWeight = weight;
		}
	}

	return best;
}

/** Brotli, flushed per chunk so a streamed SSR shell reaches the client as it is written. */
function brotliStream(body: ReadableStream<Uint8Array>, sizeHint: number | null): ReadableStream<Uint8Array> {
	const params: Record<number, number> = { [constants.BROTLI_PARAM_QUALITY]: BROTLI_QUALITY };
	if (sizeHint !== null) params[constants.BROTLI_PARAM_SIZE_HINT] = sizeHint;

	const compressor = createBrotliCompress({ params, flush: constants.BROTLI_OPERATION_FLUSH });
	const reader = body.getReader();
	const chunks = compressor[Symbol.asyncIterator]();

	const pump = async (): Promise<void> => {
		try {
			for (;;) {
				const { done, value } = await reader.read();
				if (done) break;
				if (!compressor.write(value)) await new Promise<void>((resolve) => compressor.once("drain", resolve));
			}
			compressor.end();
		} catch (error) {
			compressor.destroy(error instanceof Error ? error : new Error(String(error)));
		}
	};
	void pump();

	return new ReadableStream<Uint8Array>({
		async pull(controller) {
			const next = await chunks.next();
			if (next.done) controller.close();
			else controller.enqueue(new Uint8Array(next.value as Buffer));
		},
		async cancel() {
			await reader.cancel();
			compressor.destroy();
		},
	});
}

/**
 * Compress a server-rendered response on the way out: Brotli when the client
 * accepts it, gzip otherwise, identity if neither.
 *
 * Nitro's Bun preset writes responses raw, so every page used to go over the wire
 * uncompressed — a `/theme` page at ~145 KB. Static files under `/assets` are
 * precompressed at build instead (`compressPublicAssets` in `vite.config.ts`);
 * this covers everything the router renders. Railway's edge forwards a response
 * that already carries `Content-Encoding` as-is, and caches each encoding apart.
 *
 * Streaming is preserved: the body is piped, never buffered. Gzip uses
 * `CompressionStream`; Brotli has no web-standard equivalent, so it goes through
 * `node:zlib`, which Bun implements.
 */
export function compressResponse(request: Request, response: Response): Response {
	if (request.method === "HEAD" || response.body === null) return response;
	if (response.headers.has("Content-Encoding")) return response;
	if (!COMPRESSIBLE.test(response.headers.get("Content-Type") ?? "")) return response;

	const encoding = negotiateEncoding(request);
	if (encoding === null) return response;

	const length = Number(response.headers.get("Content-Length"));
	const sizeHint = Number.isFinite(length) && length > 0 ? length : null;

	const headers = new Headers(response.headers);
	headers.set("Content-Encoding", encoding);
	headers.delete("Content-Length");
	const vary = headers.get("Vary");
	headers.set("Vary", vary ? `${vary}, Accept-Encoding` : "Accept-Encoding");

	const body =
		encoding === "br"
			? brotliStream(response.body, sizeHint)
			: response.body.pipeThrough(new CompressionStream("gzip"));

	return new Response(body, { status: response.status, statusText: response.statusText, headers });
}
