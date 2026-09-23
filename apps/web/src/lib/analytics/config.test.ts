import { describe, expect, test } from "bun:test";
import { analyticsConfig } from "./config";

describe("analyticsConfig", () => {
	test("is off when nothing is set", () => {
		expect(analyticsConfig({})).toEqual({ ga: { kind: "off" } });
	});

	test("is off for an empty string", () => {
		expect(analyticsConfig({ VITE_GA_ID: "" })).toEqual({ ga: { kind: "off" } });
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
