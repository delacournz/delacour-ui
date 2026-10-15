import { describe, expect, test } from "bun:test";
import { compressResponse } from "./compress";

const HTML = "<p>hello</p>".repeat(500);

function request(acceptEncoding?: string, method = "GET"): Request {
	return new Request("https://ui.delacour.co.nz/theme", {
		method,
		headers: acceptEncoding ? { "Accept-Encoding": acceptEncoding } : {},
	});
}

function html(init?: ResponseInit): Response {
	return new Response(HTML, {
		...init,
		headers: { "Content-Type": "text/html; charset=utf-8", "Content-Length": String(HTML.length), ...init?.headers },
	});
}

async function gunzip(response: Response): Promise<string> {
	const body = response.body;
	if (!body) throw new Error("no body");
	return new Response(body.pipeThrough(new DecompressionStream("gzip"))).text();
}

describe("compressResponse", () => {
	test("gzips HTML for a client that accepts gzip", async () => {
		const out = compressResponse(request("gzip, deflate"), html());

		expect(out.headers.get("Content-Encoding")).toBe("gzip");
		expect(out.headers.get("Content-Length")).toBeNull();
		expect(out.headers.get("Vary")).toContain("Accept-Encoding");
		expect(await gunzip(out)).toBe(HTML);
	});

	test("keeps an existing Vary", () => {
		const out = compressResponse(request("gzip"), html({ headers: { Vary: "Accept" } }));

		expect(out.headers.get("Vary")).toBe("Accept, Accept-Encoding");
	});

	test("compresses text, JSON, JavaScript and SVG", () => {
		for (const type of ["text/plain", "text/markdown", "application/json", "text/javascript", "image/svg+xml"]) {
			const out = compressResponse(request("gzip"), new Response(HTML, { headers: { "Content-Type": type } }));
			expect(out.headers.get("Content-Encoding")).toBe("gzip");
		}
	});

	test("leaves the response alone when the client does not accept gzip", () => {
		const response = html();

		expect(compressResponse(request(), response)).toBe(response);
		expect(compressResponse(request("gzip;q=0"), response)).toBe(response);
	});

	test("leaves already-compressed and binary responses alone", () => {
		const encoded = html({ headers: { "Content-Encoding": "br" } });
		const png = new Response(HTML, { headers: { "Content-Type": "image/png" } });
		const mp4 = new Response(HTML, { headers: { "Content-Type": "video/mp4" } });

		expect(compressResponse(request("gzip"), encoded)).toBe(encoded);
		expect(compressResponse(request("gzip"), png)).toBe(png);
		expect(compressResponse(request("gzip"), mp4)).toBe(mp4);
	});

	test("leaves bodiless responses alone", () => {
		const notModified = new Response(null, { status: 304, headers: { "Content-Type": "text/html" } });
		const redirect = new Response(null, { status: 307, headers: { Location: "/docs" } });

		expect(compressResponse(request("gzip"), notModified)).toBe(notModified);
		expect(compressResponse(request("gzip"), redirect)).toBe(redirect);
		expect(compressResponse(request("gzip", "HEAD"), html()).headers.get("Content-Encoding")).toBeNull();
	});

	test("preserves status and other headers", () => {
		const out = compressResponse(request("gzip"), html({ status: 404, headers: { "X-Test": "1" } }));

		expect(out.status).toBe(404);
		expect(out.headers.get("X-Test")).toBe("1");
	});
});

describe("compressResponse encoding negotiation", () => {
	async function brotli(response: Response): Promise<string> {
		const body = response.body;
		if (!body) throw new Error("no body");
		const { brotliDecompressSync } = await import("node:zlib");
		return brotliDecompressSync(Buffer.from(await new Response(body).arrayBuffer())).toString();
	}

	test("prefers br when the client accepts both", async () => {
		const out = compressResponse(request("gzip, deflate, br"), html());

		expect(out.headers.get("Content-Encoding")).toBe("br");
		expect(out.headers.get("Content-Length")).toBeNull();
		expect(out.headers.get("Vary")).toContain("Accept-Encoding");
		expect(await brotli(out)).toBe(HTML);
	});

	test("falls back to gzip when br is absent or refused", async () => {
		expect(compressResponse(request("gzip"), html()).headers.get("Content-Encoding")).toBe("gzip");
		expect(compressResponse(request("gzip, br;q=0"), html()).headers.get("Content-Encoding")).toBe("gzip");
	});

	test("respects q-values", () => {
		expect(compressResponse(request("gzip;q=1.0, br;q=0.5"), html()).headers.get("Content-Encoding")).toBe("gzip");
		expect(compressResponse(request("gzip;q=0.5, br;q=0.9"), html()).headers.get("Content-Encoding")).toBe("br");
		expect(compressResponse(request("*;q=0.1, br"), html()).headers.get("Content-Encoding")).toBe("br");
	});

	test("identity when nothing usable is offered", () => {
		const response = html();

		expect(compressResponse(request("identity"), response)).toBe(response);
		expect(compressResponse(request("deflate"), response)).toBe(response);
		expect(compressResponse(request(), response)).toBe(response);
	});

	test("skips HEAD and already-encoded bodies", () => {
		const encoded = html({ headers: { "Content-Encoding": "gzip" } });

		expect(compressResponse(request("br", "HEAD"), html()).headers.get("Content-Encoding")).toBeNull();
		expect(compressResponse(request("br"), encoded)).toBe(encoded);
	});
});
