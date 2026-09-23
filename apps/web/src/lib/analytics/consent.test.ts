import { describe, expect, test } from "bun:test";
import { CONSENT_KEY, gtmBootstrap, parseConsent } from "./consent";

describe("gtmBootstrap", () => {
	const script = gtmBootstrap("GTM-AB12CD3");

	test("denies every consent type before GTM loads", () => {
		const defaults = script.indexOf("'consent','default'");
		const loader = script.indexOf("googletagmanager.com/gtm.js");

		expect(defaults).toBeGreaterThan(-1);
		expect(loader).toBeGreaterThan(defaults);
		for (const type of ["ad_storage", "ad_user_data", "ad_personalization", "analytics_storage"]) {
			expect(script).toContain(`${type}:'denied'`);
		}
	});

	test("replays a stored grant before GTM loads, and only analytics", () => {
		const update = script.indexOf("'consent','update'");

		expect(script).toContain(`localStorage.getItem('${CONSENT_KEY}')`);
		expect(update).toBeGreaterThan(-1);
		expect(update).toBeLessThan(script.indexOf("googletagmanager.com/gtm.js"));
		expect(script).not.toContain("ad_storage:'granted'");
	});

	test("loads the container it was given", () => {
		expect(script).toContain("'GTM-AB12CD3'");
	});
});

describe("parseConsent", () => {
	test("reads the two stored choices and nothing else", () => {
		expect(parseConsent("granted")).toBe("granted");
		expect(parseConsent("denied")).toBe("denied");
		expect(parseConsent(null)).toBeNull();
		expect(parseConsent("yes")).toBeNull();
	});
});
