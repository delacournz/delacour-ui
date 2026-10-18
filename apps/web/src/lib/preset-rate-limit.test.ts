import { describe, expect, test } from "bun:test";
import { createPresetLimiter, isPresetPageRequest, presetLimitedResponse } from "./preset-rate-limit";

function req(path: string, headers: Record<string, string> = {}, method = "GET"): Request {
	return new Request(`https://ui.delacour.co.nz${path}`, { headers, method });
}

const fromIp = (ip: string, path = "/theme?preset=AQAAAAAAAAAA") => req(path, { "X-Real-IP": ip });

describe("isPresetPageRequest", () => {
	test("is a GET of /theme carrying a preset", () => {
		expect(isPresetPageRequest(req("/theme?preset=AQIEFAcCCgK3"))).toBe(true);
	});

	test("leaves the bare page, other paths and other methods alone", () => {
		expect(isPresetPageRequest(req("/theme"))).toBe(false);
		expect(isPresetPageRequest(req("/docs?preset=x"))).toBe(false);
		expect(isPresetPageRequest(req("/theme?preset=x", {}, "HEAD"))).toBe(false);
	});
});

describe("createPresetLimiter", () => {
	test("lets an IP through up to the ceiling, then refuses it", () => {
		const limiter = createPresetLimiter({ max: 3, windowMs: 60_000 }, () => 0);
		expect([1, 2, 3].map(() => limiter.isLimited(fromIp("203.0.113.9")))).toEqual([false, false, false]);
		expect(limiter.isLimited(fromIp("203.0.113.9"))).toBe(true);
	});

	test("counts each IP on its own", () => {
		const limiter = createPresetLimiter({ max: 1, windowMs: 60_000 }, () => 0);
		expect(limiter.isLimited(fromIp("203.0.113.9"))).toBe(false);
		expect(limiter.isLimited(fromIp("198.51.100.7"))).toBe(false);
		expect(limiter.isLimited(fromIp("203.0.113.9"))).toBe(true);
	});

	test("starts again when the window ends", () => {
		let t = 0;
		const limiter = createPresetLimiter({ max: 1, windowMs: 60_000 }, () => t);
		limiter.isLimited(fromIp("203.0.113.9"));
		expect(limiter.isLimited(fromIp("203.0.113.9"))).toBe(true);
		t = 60_000;
		expect(limiter.isLimited(fromIp("203.0.113.9"))).toBe(false);
	});

	test("never counts other pages, or a request with no X-Real-IP", () => {
		const limiter = createPresetLimiter({ max: 1, windowMs: 60_000 }, () => 0);
		for (let i = 0; i < 5; i++) {
			expect(limiter.isLimited(fromIp("203.0.113.9", "/theme"))).toBe(false);
			expect(limiter.isLimited(req("/theme?preset=x"))).toBe(false);
		}
		expect(limiter.isLimited(fromIp("203.0.113.9"))).toBe(false);
	});

	test("reports the seconds left in the window", () => {
		let t = 0;
		const limiter = createPresetLimiter({ max: 1, windowMs: 60_000 }, () => t);
		t = 45_500;
		expect(limiter.retryAfterSeconds()).toBe(15);
	});
});

describe("presetLimitedResponse", () => {
	test("is an uncacheable 429 with Retry-After", () => {
		const response = presetLimitedResponse(42);
		expect(response.status).toBe(429);
		expect(response.headers.get("Cache-Control")).toBe("no-store");
		expect(response.headers.get("Retry-After")).toBe("42");
	});
});
