import { describe, expect, test } from "bun:test";
import { observeConfig } from "./observe";

describe("observeConfig", () => {
	test("turns the expo-router integration on, which is what records a metric per route", () => {
		expect(observeConfig(undefined).integrations?.["expo-router"]).toBe(true);
	});

	test("keeps a debug build's metrics off the dashboard by default", () => {
		expect(observeConfig(undefined).dispatchInDebug).toBe(false);
		expect(observeConfig("").dispatchInDebug).toBe(false);
	});

	test("dispatches from a debug build only when the flag is exactly 1", () => {
		expect(observeConfig("1").dispatchInDebug).toBe(true);
	});

	test("reads anything else as off, including the literal an unset EAS variable renders as", () => {
		for (const value of ["0", "true", "yes", "undefined", " 1"]) {
			expect(observeConfig(value).dispatchInDebug).toBe(false);
		}
	});
});
