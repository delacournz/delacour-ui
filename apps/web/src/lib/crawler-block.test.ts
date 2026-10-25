import { describe, expect, test } from "bun:test";
import { BLOCKED_CRAWLERS, blockCrawlerResponse, clientIp, inCidr, isBlockedCrawler } from "./crawler-block";

function req(path: string, headers: Record<string, string> = {}): Request {
	return new Request(`https://ui.delacour.co.nz${path}`, { headers });
}

describe("inCidr", () => {
	test("matches addresses inside the /16", () => {
		expect(inCidr("57.141.0.1", "57.141.0.0/16")).toBe(true);
		expect(inCidr("57.141.255.254", "57.141.0.0/16")).toBe(true);
	});

	test("rejects neighbours and malformed input", () => {
		expect(inCidr("57.142.0.1", "57.141.0.0/16")).toBe(false);
		expect(inCidr("57.140.255.255", "57.141.0.0/16")).toBe(false);
		expect(inCidr("not-an-ip", "57.141.0.0/16")).toBe(false);
		expect(inCidr("57.141.0.256", "57.141.0.0/16")).toBe(false);
		expect(inCidr("2a03:2880::1", "57.141.0.0/16")).toBe(false);
	});

	test("matches IPv6 addresses inside a /32, compressed or not", () => {
		expect(inCidr("2a03:2880:f812:6a::", "2a03:2880::/32")).toBe(true);
		expect(inCidr("2a03:2880:0000:0000:0000:0000:0000:0001", "2a03:2880::/32")).toBe(true);
		expect(inCidr("2a03:2881::1", "2a03:2880::/32")).toBe(false);
		expect(inCidr("57.141.0.1", "2a03:2880::/32")).toBe(false);
		expect(inCidr("2a03:2880:::1", "2a03:2880::/32")).toBe(false);
		expect(inCidr("2a03:2880::1", "2a03:2880::/129")).toBe(false);
	});

	test("matches the Alibaba /19 the 2026-10-25 fleet came from", () => {
		expect(inCidr("47.79.201.185", "47.79.192.0/19")).toBe(true);
		expect(inCidr("47.79.218.3", "47.79.192.0/19")).toBe(true);
		expect(inCidr("47.79.224.1", "47.79.192.0/19")).toBe(false);
	});
});

describe("clientIp", () => {
	test("reads Railway's X-Real-IP", () => {
		expect(clientIp(req("/", { "X-Real-IP": "203.0.113.9" }))).toBe("203.0.113.9");
	});

	test("ignores X-Forwarded-For, which a client can prepend to", () => {
		expect(clientIp(req("/", { "X-Forwarded-For": "57.141.0.1" }))).toBeNull();
	});

	test("is null without the header", () => {
		expect(clientIp(req("/"))).toBeNull();
	});
});

describe("isBlockedCrawler", () => {
	test("blocks the Meta range by IP", () => {
		expect(isBlockedCrawler(req("/theme", { "X-Real-IP": "57.141.3.4" }))).toBe(true);
	});

	test("blocks Meta's IPv6 fleet and the Alibaba fleet by IP", () => {
		expect(isBlockedCrawler(req("/theme", { "X-Real-IP": "2a03:2880:f812:6a::" }))).toBe(true);
		expect(isBlockedCrawler(req("/theme?preset=AQAAAAAAAAAA", { "X-Real-IP": "47.79.206.17" }))).toBe(true);
	});

	test("blocks Meta user agents case-insensitively", () => {
		for (const ua of [
			"meta-externalagent/1.1 (+https://developers.facebook.com)",
			"Meta-ExternalFetcher/1.0",
			"facebookexternalhit/1.1",
			"Mozilla/5.0 (compatible; FacebookBot/1.0)",
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 (compatible; meta-webindexer/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler))",
		]) {
			expect(isBlockedCrawler(req("/", { "User-Agent": ua }))).toBe(true);
		}
	});

	test("lets ordinary traffic through", () => {
		expect(isBlockedCrawler(req("/", { "User-Agent": "Mozilla/5.0 Chrome/130", "X-Real-IP": "203.0.113.9" }))).toBe(
			false
		);
		expect(isBlockedCrawler(req("/"))).toBe(false);
	});

	test("always lets /robots.txt through so the crawler can read its Disallow", () => {
		expect(
			isBlockedCrawler(req("/robots.txt", { "X-Real-IP": "57.141.3.4", "User-Agent": "meta-externalagent/1.1" }))
		).toBe(false);
	});

	test("constant covers the documented agents", () => {
		expect(BLOCKED_CRAWLERS.cidrs).toContain("57.141.0.0/16");
		expect(BLOCKED_CRAWLERS.cidrs).toContain("2a03:2880::/32");
		expect(BLOCKED_CRAWLERS.cidrs).toContain("47.79.192.0/19");
		expect(BLOCKED_CRAWLERS.userAgents.length).toBeGreaterThanOrEqual(5);
	});
});

describe("blockCrawlerResponse", () => {
	test("is a tiny uncacheable 403", async () => {
		const res = blockCrawlerResponse();

		expect(res.status).toBe(403);
		expect(res.headers.get("Cache-Control")).toBe("no-store");
		expect(res.headers.get("Content-Encoding")).toBeNull();
		expect((await res.text()).length).toBeLessThan(32);
	});
});
