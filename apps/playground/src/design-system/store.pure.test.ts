import { describe, expect, test } from "bun:test";
import { DEFAULT_CONFIG } from "@delacour/design-system/config";
import { DELACOUR_AMBER_CONFIG, HOUSE_CONFIG, PRESET_SHORTCUTS } from "@delacour/design-system/house";
import {
	configEquals,
	DEFAULT_THEME_MODE,
	isThemeMode,
	migrateStoredConfig,
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
		expect(resetTarget("amber")).toBe(DELACOUR_AMBER_CONFIG);
		expect(resetTarget("library")).toBe(DEFAULT_CONFIG);
	});

	test("the targets are the preset shortcuts, in the same order", () => {
		expect(RESET_TARGETS.map((target) => target.config)).toEqual(PRESET_SHORTCUTS.map((preset) => preset.config));
		expect(RESET_TARGETS.map((target) => target.name)).toEqual(["house", "amber", "library"]);
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

describe("migrateStoredConfig", () => {
	// The studio's look was amber until the Devl house replaced it. A stored
	// amber config on a build that has never migrated is the old default, not a
	// choice, so it moves to the new house.
	test("an unmigrated stored amber config moves to the new house", () => {
		expect(migrateStoredConfig(DELACOUR_AMBER_CONFIG, false)).toEqual(HOUSE_CONFIG);
	});

	// Once migrated, amber can only have been picked from the preset strip.
	test("a migrated amber config is a deliberate choice and stays", () => {
		expect(migrateStoredConfig(DELACOUR_AMBER_CONFIG, true)).toEqual(DELACOUR_AMBER_CONFIG);
	});

	test("a customised config is never touched", () => {
		const custom = { ...DELACOUR_AMBER_CONFIG, radius: "large" } as const;
		expect(migrateStoredConfig(custom, false)).toEqual(custom);
		expect(migrateStoredConfig(DEFAULT_CONFIG, false)).toEqual(DEFAULT_CONFIG);
	});

	test("the new house is left alone", () => {
		expect(migrateStoredConfig(HOUSE_CONFIG, false)).toEqual(HOUSE_CONFIG);
	});
});
