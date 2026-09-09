import { describe, expect, test } from "bun:test";
import { DEFAULT_CONFIG } from "@delacour/design-system/config";
import { HOUSE_CONFIG, PRESET_SHORTCUTS } from "@delacour/design-system/house";
import {
	configEquals,
	DEFAULT_THEME_MODE,
	isThemeMode,
	parseStoredConfig,
	parseStoredMode,
	RESET_TARGETS,
	resetTarget,
	THEME_MODES,
} from "./store.pure";

describe("parseStoredConfig", () => {
	test("nothing stored is the house", () => {
		expect(parseStoredConfig(undefined)).toEqual(HOUSE_CONFIG);
		expect(parseStoredConfig("")).toEqual(HOUSE_CONFIG);
	});

	test("unparseable JSON is the house, not the library default", () => {
		expect(parseStoredConfig("{not json")).toEqual(HOUSE_CONFIG);
	});

	test("a stored config comes back normalised", () => {
		const stored = JSON.stringify({ ...HOUSE_CONFIG, theme: "no-such-accent" });

		expect(parseStoredConfig(stored)).toEqual({ ...HOUSE_CONFIG, theme: HOUSE_CONFIG.baseColor });
	});

	test("a partial config fills its gaps from the house, so one stale axis costs nothing else", () => {
		expect(parseStoredConfig(JSON.stringify({ radius: "large" }))).toEqual({ ...HOUSE_CONFIG, radius: "large" });
	});

	test("a stored library default is still the library default", () => {
		expect(parseStoredConfig(JSON.stringify(DEFAULT_CONFIG))).toEqual(DEFAULT_CONFIG);
	});

	test("a stored non-object is the house", () => {
		expect(parseStoredConfig("null")).toEqual(HOUSE_CONFIG);
		expect(parseStoredConfig("42")).toEqual(HOUSE_CONFIG);
		expect(parseStoredConfig('"vega"')).toEqual(HOUSE_CONFIG);
	});
});

describe("reset targets", () => {
	test("house is the studio preset and library is the shipped default", () => {
		expect(resetTarget("house")).toBe(HOUSE_CONFIG);
		expect(resetTarget("library")).toBe(DEFAULT_CONFIG);
	});

	test("the two targets are the two preset shortcuts, in the same order", () => {
		expect(RESET_TARGETS.map((target) => target.config)).toEqual(PRESET_SHORTCUTS.map((preset) => preset.config));
		expect(RESET_TARGETS.map((target) => target.name)).toEqual(["house", "library"]);
	});
});

describe("theme mode", () => {
	test("a fresh install opens dark", () => {
		expect(DEFAULT_THEME_MODE).toBe("dark");
		expect(parseStoredMode(undefined)).toBe("dark");
	});

	test("a stored mode is kept", () => {
		for (const mode of THEME_MODES) expect(parseStoredMode(mode)).toBe(mode);
	});

	test("an unknown mode is dark, not thrown", () => {
		expect(parseStoredMode("sepia")).toBe("dark");
		expect(isThemeMode("sepia")).toBe(false);
	});
});

describe("configEquals", () => {
	test("a copy is equal, a changed axis is not", () => {
		expect(configEquals({ ...HOUSE_CONFIG }, HOUSE_CONFIG)).toBe(true);
		expect(configEquals({ ...HOUSE_CONFIG, radius: "large" }, HOUSE_CONFIG)).toBe(false);
		expect(configEquals(DEFAULT_CONFIG, HOUSE_CONFIG)).toBe(false);
	});
});
