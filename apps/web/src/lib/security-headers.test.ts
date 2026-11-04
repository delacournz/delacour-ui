import { describe, expect, test } from "bun:test";
import { SECURITY_HEADERS, withSecurityHeaders } from "./security-headers";

describe("withSecurityHeaders", () => {
	test("adds every header to a response that has none", () => {
		const response = withSecurityHeaders(new Response("ok"));

		for (const [name, value] of Object.entries(SECURITY_HEADERS)) expect(response.headers.get(name)).toBe(value);
	});

	test("never overrides a header a route set itself", () => {
		const response = withSecurityHeaders(new Response("ok", { headers: { "Referrer-Policy": "no-referrer" } }));

		expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
	});

	test("keeps status and body", async () => {
		const response = withSecurityHeaders(new Response("gone", { status: 404 }));

		expect(response.status).toBe(404);
		expect(await response.text()).toBe("gone");
	});

	test("HSTS is long-lived and covers subdomains", () => {
		expect(SECURITY_HEADERS["Strict-Transport-Security"]).toMatch(/max-age=31536000; includeSubDomains/);
	});
});
