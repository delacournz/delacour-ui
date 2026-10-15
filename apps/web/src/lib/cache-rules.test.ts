import { describe, expect, test } from "bun:test";
import { PAGE_CACHE_CONTROL, pageCacheRules } from "./cache-rules";

describe("pageCacheRules", () => {
	test("every rendered route gets the shared page policy", () => {
		for (const route of ["/", "/docs/**", "/theme", "/llms-full.txt", "/api/search"]) {
			expect(pageCacheRules[route]?.headers["cache-control"]).toBe(PAGE_CACHE_CONTROL);
		}
	});

	test("static prefixes are left to their own rules", () => {
		expect(pageCacheRules["/assets/**"]).toBeUndefined();
		expect(pageCacheRules["/previews/**"]).toBeUndefined();
	});

	test("the policy is cacheable and revalidates in the background", () => {
		expect(PAGE_CACHE_CONTROL).toContain("public");
		expect(PAGE_CACHE_CONTROL).toContain("stale-while-revalidate");
	});
});
