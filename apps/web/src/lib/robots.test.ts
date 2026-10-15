import { describe, expect, test } from "bun:test";
import { BODY } from "../routes/robots[.]txt";

describe("robots.txt", () => {
	test("bars Meta's crawlers from /theme", () => {
		expect(BODY).toMatch(/User-agent: meta-externalagent[\s\S]*?Disallow: \/theme\n/);
	});

	test("keeps the generated preset space closed to everyone", () => {
		expect(BODY).toContain("Disallow: /theme?");
	});
});
