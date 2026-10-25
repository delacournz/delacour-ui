import { describe, expect, test } from "bun:test";
import { createMemoryStore, createRateLimiter, type RateLimiter, tooManyRequests } from "@delacournz/rate-limit";
import { createPresetLimiter, isPresetPageRequest, PRESET_RATE_LIMIT } from "./preset-rate-limit";

function req(path: string, headers: Record<string, string> = {}, method = "GET"): Request {
	return new Request(`https://ui.delacour.co.nz${path}`, { headers, method });
}

const fromIp = (ip: string, path = "/theme?preset=AQAAAAAAAAAA") => req(path, { "X-Real-IP": ip });

function limiterAt(now: () => number): RateLimiter {
	return createRateLimiter({ store: createMemoryStore({ now }), prefix: "test", now });
}

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
	test("lets an address through up to its ceiling, then refuses it with the window's remaining time", async () => {
		let t = 0;
		const limiter = createPresetLimiter(
			limiterAt(() => t),
			{
				perAddress: { max: 3, windowMs: 60_000 },
				total: { max: 100, windowMs: 60_000 },
			}
		);
		for (let i = 0; i < 3; i++) expect(await limiter.check(fromIp("203.0.113.9"))).toBeNull();
		t = 15_000;
		const refused = await limiter.check(fromIp("203.0.113.9"));
		expect(refused).toMatchObject({ allowed: false, limit: 3, remaining: 0, retryAfterMs: 45_000 });
		expect(tooManyRequests(refused as NonNullable<typeof refused>).status).toBe(429);
	});

	test("counts each address on its own", async () => {
		const limiter = createPresetLimiter(
			limiterAt(() => 0),
			{
				perAddress: { max: 1, windowMs: 60_000 },
				total: { max: 100, windowMs: 60_000 },
			}
		);
		expect(await limiter.check(fromIp("203.0.113.9"))).toBeNull();
		expect(await limiter.check(fromIp("198.51.100.7"))).toBeNull();
		expect(await limiter.check(fromIp("203.0.113.9"))).not.toBeNull();
	});

	test("refuses everyone once the window's total ceiling is spent, however many addresses share it", async () => {
		const limiter = createPresetLimiter(
			limiterAt(() => 0),
			{
				perAddress: { max: 10, windowMs: 60_000 },
				total: { max: 3, windowMs: 60_000 },
			}
		);
		expect(await limiter.check(fromIp("203.0.113.1"))).toBeNull();
		expect(await limiter.check(fromIp("203.0.113.2"))).toBeNull();
		expect(await limiter.check(fromIp("203.0.113.3"))).toBeNull();
		const refused = await limiter.check(fromIp("203.0.113.4"));
		expect(refused).toMatchObject({ allowed: false, limit: 3, key: "test:preset:total:60000" });
		expect(await limiter.check(fromIp("203.0.113.1"))).not.toBeNull();
	});

	test("starts again when the window ends", async () => {
		let t = 0;
		const limiter = createPresetLimiter(
			limiterAt(() => t),
			{
				perAddress: { max: 1, windowMs: 60_000 },
				total: { max: 1, windowMs: 60_000 },
			}
		);
		expect(await limiter.check(fromIp("203.0.113.9"))).toBeNull();
		expect(await limiter.check(fromIp("203.0.113.9"))).not.toBeNull();
		t = 60_000;
		expect(await limiter.check(fromIp("203.0.113.9"))).toBeNull();
	});

	test("never counts other pages, or a request with no edge-reported address", async () => {
		const limiter = createPresetLimiter(
			limiterAt(() => 0),
			{
				perAddress: { max: 1, windowMs: 60_000 },
				total: { max: 1, windowMs: 60_000 },
			}
		);
		for (let i = 0; i < 5; i++) {
			expect(await limiter.check(fromIp("203.0.113.9", "/theme"))).toBeNull();
			expect(await limiter.check(req("/theme?preset=x"))).toBeNull();
			expect(await limiter.check(req("/theme?preset=x", { "X-Forwarded-For": "203.0.113.9" }))).toBeNull();
		}
		expect(await limiter.check(fromIp("203.0.113.9"))).toBeNull();
	});

	test("trusts Cloudflare's client header only when the hop is a Cloudflare address", async () => {
		const policies = {
			perAddress: { max: 1, windowMs: 60_000 },
			total: { max: 10, windowMs: 60_000 },
		};

		// The edge-reported hop (X-Real-IP) is a Cloudflare address, so CF-Connecting-IP is the client.
		const viaCloudflare = createPresetLimiter(
			limiterAt(() => 0),
			policies
		);
		const fronted = { "CF-Connecting-IP": "203.0.113.9", "X-Real-IP": "173.245.48.10" };
		expect(await viaCloudflare.check(req("/theme?preset=x", fronted))).toBeNull();
		expect((await viaCloudflare.check(req("/theme?preset=x", fronted)))?.key).toBe("test:preset:203.0.113.9:60000");

		// Anyone else writing CF-Connecting-IP is a client picking its own key; the hop is counted instead.
		const direct = createPresetLimiter(
			limiterAt(() => 0),
			policies
		);
		const spoofed = { "CF-Connecting-IP": "203.0.113.9", "X-Real-IP": "198.51.100.7" };
		expect(await direct.check(req("/theme?preset=x", spoofed))).toBeNull();
		expect((await direct.check(req("/theme?preset=x", spoofed)))?.key).toBe("test:preset:198.51.100.7:60000");
	});

	test("ships ceilings well above a reader and well below a fleet", () => {
		expect(PRESET_RATE_LIMIT.perAddress.max).toBeLessThan(PRESET_RATE_LIMIT.total.max);
		expect(PRESET_RATE_LIMIT.total.max).toBeGreaterThanOrEqual(100);
		expect(PRESET_RATE_LIMIT.total.max).toBeLessThan(1500);
		expect(PRESET_RATE_LIMIT.total.windowMs).toBe(PRESET_RATE_LIMIT.perAddress.windowMs);
	});
});
