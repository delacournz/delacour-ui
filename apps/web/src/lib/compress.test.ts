import { describe, expect, test } from "bun:test";
import { gzipResponse } from "./compress";

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

describe("gzipResponse", () => {
	test("gzips HTML for a client that accepts gzip", async () => {
		const out = gzipResponse(request("gzip, deflate, br"), html());

		expect(out.headers.get("Content-Encoding")).toBe("gzip");
		expect(out.headers.get("Content-Length")).toBeNull();
		expect(out.headers.get("Vary")).toContain("Accept-Encoding");
		expect(await gunzip(out)).toBe(HTML);
	});

	test("keeps an existing Vary", () => {
		const out = gzipResponse(request("gzip"), html({ headers: { Vary: "Accept" } }));

		expect(out.headers.get("Vary")).toBe("Accept, Accept-Encoding");
	});

	test("compresses text, JSON, JavaScript and SVG", () => {
		for (const type of ["text/plain", "text/markdown", "application/json", "text/javascript", "image/svg+xml"]) {
			const out = gzipResponse(request("gzip"), new Response(HTML, { headers: { "Content-Type": type } }));
			expect(out.headers.get("Content-Encoding")).toBe("gzip");
		}
	});

	test("leaves the response alone when the client does not accept gzip", () => {
		const response = html();

		expect(gzipResponse(request(), response)).toBe(response);
		expect(gzipResponse(request("br"), response)).toBe(response);
		expect(gzipResponse(request("gzip;q=0"), response)).toBe(response);
	});

	test("leaves already-compressed and binary responses alone", () => {
		const encoded = html({ headers: { "Content-Encoding": "br" } });
		const png = new Response(HTML, { headers: { "Content-Type": "image/png" } });
		const mp4 = new Response(HTML, { headers: { "Content-Type": "video/mp4" } });

		expect(gzipResponse(request("gzip"), encoded)).toBe(encoded);
		expect(gzipResponse(request("gzip"), png)).toBe(png);
		expect(gzipResponse(request("gzip"), mp4)).toBe(mp4);
	});

	test("leaves bodiless responses alone", () => {
		const notModified = new Response(null, { status: 304, headers: { "Content-Type": "text/html" } });
		const redirect = new Response(null, { status: 307, headers: { Location: "/docs" } });

		expect(gzipResponse(request("gzip"), notModified)).toBe(notModified);
		expect(gzipResponse(request("gzip"), redirect)).toBe(redirect);
		expect(gzipResponse(request("gzip", "HEAD"), html()).headers.get("Content-Encoding")).toBeNull();
	});

	test("preserves status and other headers", () => {
		const out = gzipResponse(request("gzip"), html({ status: 404, headers: { "X-Test": "1" } }));

		expect(out.status).toBe(404);
		expect(out.headers.get("X-Test")).toBe("1");
	});
});
