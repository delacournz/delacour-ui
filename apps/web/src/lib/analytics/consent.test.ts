import { describe, expect, test } from "bun:test";
import { CONSENT_KEY, gaBootstrap, gaScriptUrl, parseConsent } from "./consent";

describe("gaBootstrap", () => {
	const script = gaBootstrap("G-2REDJ2XPJZ");
	const loader = script.indexOf("googletagmanager.com/gtag/js");
	const config = script.indexOf("'config'");

	test("denies every consent type before gtag.js loads or GA is configured", () => {
		const defaults = script.indexOf("'consent','default'");

		expect(defaults).toBeGreaterThan(-1);
		expect(loader).toBeGreaterThan(defaults);
		expect(config).toBeGreaterThan(defaults);
		for (const type of ["ad_storage", "ad_user_data", "ad_personalization", "analytics_storage"]) {
			expect(script).toContain(`${type}:'denied'`);
		}
	});

	test("replays a stored grant before GA is configured, and only analytics", () => {
		const update = script.indexOf("'consent','update'");

		expect(script).toContain(`localStorage.getItem('${CONSENT_KEY}')`);
		expect(update).toBeGreaterThan(-1);
		expect(update).toBeLessThan(config);
		expect(script).not.toContain("ad_storage:'granted'");
	});

	test("configures the measurement id it was given", () => {
		expect(script).toContain("gtag('config','G-2REDJ2XPJZ')");
		expect(script).toContain(gaScriptUrl("G-2REDJ2XPJZ"));
	});

	/**
	 * Basic Consent Mode: without a stored grant, `gtag.js` is never requested,
	 * so Google receives nothing at all — not even the cookieless pings advanced
	 * mode sends. The privacy policy says exactly that.
	 */
	test("requests gtag.js only inside the stored-grant branch", () => {
		const grantBranch = /==='granted'\)\{(.*?)\}catch/.exec(script)?.[1] ?? "";

		const calls = /(?<!function )loadGa\(\);/g;

		expect(grantBranch).toMatch(calls);
		expect(script.replace(grantBranch, "")).not.toMatch(calls);
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
