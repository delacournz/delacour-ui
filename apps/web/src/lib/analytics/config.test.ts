import { describe, expect, test } from "bun:test";
import { analyticsConfig } from "./config";

const UMAMI = {
	VITE_UMAMI_HOST: "https://analytics.example.com",
	VITE_UMAMI_WEBSITE_ID: "0f8c6c1a-7d3b-4d0e-9a2b-3c4d5e6f7a8b",
};

describe("analyticsConfig", () => {
	test("is off for both providers when nothing is set", () => {
		expect(analyticsConfig({})).toEqual({ umami: { kind: "off" }, gtm: { kind: "off" } });
	});

	test("is off for empty strings", () => {
		expect(analyticsConfig({ VITE_UMAMI_HOST: "", VITE_UMAMI_WEBSITE_ID: "", VITE_GTM_ID: "" })).toEqual({
			umami: { kind: "off" },
			gtm: { kind: "off" },
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

	test("turns GTM on for a well-formed container id", () => {
		expect(analyticsConfig({ VITE_GTM_ID: "GTM-AB12CD3" }).gtm).toEqual({ kind: "on", id: "GTM-AB12CD3" });
	});

	test("refuses a malformed container id, since it is written into an inline script", () => {
		expect(analyticsConfig({ VITE_GTM_ID: "G-AB12CD3" }).gtm).toEqual({ kind: "off" });
		expect(analyticsConfig({ VITE_GTM_ID: "GTM-AB');alert(1);//" }).gtm).toEqual({ kind: "off" });
	});
});
