import { describe, expect, test } from "bun:test";
import { analyticsConfig } from "./config";

const UMAMI = {
	VITE_UMAMI_HOST: "https://analytics.example.com",
	VITE_UMAMI_WEBSITE_ID: "0f8c6c1a-7d3b-4d0e-9a2b-3c4d5e6f7a8b",
};

describe("analyticsConfig", () => {
	test("is off for both providers when nothing is set", () => {
		expect(analyticsConfig({})).toEqual({ umami: { kind: "off" }, ga: { kind: "off" } });
	});

	test("is off for empty strings", () => {
		expect(analyticsConfig({ VITE_UMAMI_HOST: "", VITE_UMAMI_WEBSITE_ID: "", VITE_GA_ID: "" })).toEqual({
			umami: { kind: "off" },
			ga: { kind: "off" },
		});
	});

	test("turns Umami on with an https origin and a website id", () => {
		expect(analyticsConfig(UMAMI).umami).toEqual({
			kind: "on",
			host: "https://analytics.example.com",
			websiteId: UMAMI.VITE_UMAMI_WEBSITE_ID,
		});
	});

	test("reduces the Umami host to its origin", () => {
		const config = analyticsConfig({ ...UMAMI, VITE_UMAMI_HOST: "https://analytics.example.com/" });

		expect(config.umami).toMatchObject({ kind: "on", host: "https://analytics.example.com" });
	});

	test("keeps Umami off without both halves", () => {
		expect(analyticsConfig({ VITE_UMAMI_HOST: UMAMI.VITE_UMAMI_HOST }).umami).toEqual({ kind: "off" });
		expect(analyticsConfig({ VITE_UMAMI_WEBSITE_ID: UMAMI.VITE_UMAMI_WEBSITE_ID }).umami).toEqual({ kind: "off" });
	});

	test("refuses a host that is not https, or not a URL", () => {
		expect(analyticsConfig({ ...UMAMI, VITE_UMAMI_HOST: "http://analytics.example.com" }).umami).toEqual({
			kind: "off",
		});
		expect(analyticsConfig({ ...UMAMI, VITE_UMAMI_HOST: "analytics.example.com" }).umami).toEqual({ kind: "off" });
	});

	test("refuses a website id that could break out of an attribute", () => {
		expect(analyticsConfig({ ...UMAMI, VITE_UMAMI_WEBSITE_ID: 'abc"><script>' }).umami).toEqual({ kind: "off" });
	});

	test("turns GA on for a well-formed measurement id", () => {
		expect(analyticsConfig({ VITE_GA_ID: "G-2REDJ2XPJZ" }).ga).toEqual({ kind: "on", id: "G-2REDJ2XPJZ" });
	});

	test("refuses a malformed measurement id, since it is written into an inline script", () => {
		expect(analyticsConfig({ VITE_GA_ID: "GTM-AB12CD3" }).ga).toEqual({ kind: "off" });
		expect(analyticsConfig({ VITE_GA_ID: "UA-1234-1" }).ga).toEqual({ kind: "off" });
		expect(analyticsConfig({ VITE_GA_ID: "G-AB');alert(1);//" }).ga).toEqual({ kind: "off" });
	});
});

/**
 * Railway builds through `turbo build`, and turbo's strict env mode strips any
 * variable its task config does not list. Unlisted, every id above arrived as
 * `undefined` and production shipped with analytics off and no error anywhere.
 */
describe("turbo passes the analytics env through to the build", () => {
	test("the build task lists VITE_*", async () => {
		const turbo = Bun.JSONC.parse(await Bun.file(new URL("../../../../../turbo.jsonc", import.meta.url)).text()) as {
			tasks: { build: { env?: string[] } };
		};
		expect(turbo.tasks.build.env).toContain("VITE_*");
	});
});
