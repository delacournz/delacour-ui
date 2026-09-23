import { describe, expect, test } from "bun:test";
import { type AnalyticsConfig, analyticsConfig, isCountedHost } from "./config";

const OFF: AnalyticsConfig = { ga: { kind: "off" }, posthog: { kind: "off" } };
const TOKEN = "phc_nTbUu3Em4hExmfg5kD5LMchEAGB3SLV5Yfi4WFnzWvrQ";

describe("analyticsConfig", () => {
	test("is off when nothing is set", () => {
		expect(analyticsConfig({})).toEqual(OFF);
	});

	test("is off for an empty string", () => {
		expect(analyticsConfig({ VITE_GA_ID: "", VITE_POSTHOG_TOKEN: "", VITE_POSTHOG_HOST: "" })).toEqual(OFF);
	});

	test("turns GA on for a well-formed measurement id", () => {
		expect(analyticsConfig({ VITE_GA_ID: "G-2REDJ2XPJZ" }).ga).toEqual({ kind: "on", id: "G-2REDJ2XPJZ" });
	});

	test("refuses a malformed measurement id, since it is written into an inline script", () => {
		expect(analyticsConfig({ VITE_GA_ID: "GTM-AB12CD3" }).ga).toEqual({ kind: "off" });
		expect(analyticsConfig({ VITE_GA_ID: "UA-1234-1" }).ga).toEqual({ kind: "off" });
		expect(analyticsConfig({ VITE_GA_ID: "G-AB');alert(1);//" }).ga).toEqual({ kind: "off" });
	});

	test("turns PostHog on for a project token and an https host, keeping only the host's origin", () => {
		expect(
			analyticsConfig({ VITE_POSTHOG_TOKEN: TOKEN, VITE_POSTHOG_HOST: "https://i.delacour.co.nz/" }).posthog
		).toEqual({
			kind: "on",
			token: TOKEN,
			host: "https://i.delacour.co.nz",
		});
	});

	test("needs both PostHog values", () => {
		expect(analyticsConfig({ VITE_POSTHOG_TOKEN: TOKEN }).posthog).toEqual({ kind: "off" });
		expect(analyticsConfig({ VITE_POSTHOG_HOST: "https://i.delacour.co.nz" }).posthog).toEqual({ kind: "off" });
	});

	test("refuses a PostHog token that is not a public project token", () => {
		const host = "https://i.delacour.co.nz";

		for (const token of ["phx_personalApiKey123", "phc_", "phc_abc-def", 'phc_abc"});alert(1);//']) {
			expect(analyticsConfig({ VITE_POSTHOG_TOKEN: token, VITE_POSTHOG_HOST: host }).posthog).toEqual({ kind: "off" });
		}
	});

	test("refuses a PostHog host that is not an https URL", () => {
		for (const host of ["http://i.delacour.co.nz", "i.delacour.co.nz", "javascript:alert(1)"]) {
			expect(analyticsConfig({ VITE_POSTHOG_TOKEN: TOKEN, VITE_POSTHOG_HOST: host }).posthog).toEqual({ kind: "off" });
		}
	});
});

describe("isCountedHost", () => {
	test("counts production and staging", () => {
		expect(isCountedHost("ui.delacour.co.nz")).toBe(true);
		expect(isCountedHost("ui.staging.delacour.co.nz")).toBe(true);
	});

	test("never counts a build run anywhere else", () => {
		expect(isCountedHost("localhost:3000")).toBe(false);
		expect(isCountedHost("127.0.0.1:3000")).toBe(false);
		expect(isCountedHost("delacour-ui-web.up.railway.app")).toBe(false);
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
