import { describe, expect, test } from "bun:test";
import { DEFAULT_CONFIG, type DesignSystemConfig } from "@delacour/design-system/config";
import { decodePreset, encodePreset, PRESET_CODE_LENGTH } from "@delacour/design-system/preset";
import {
	AXIS_KEYS,
	type AxisKey,
	axisOptions,
	fontOptionGroups,
	inheritOption,
	presetCss,
	resolvePreset,
	themeSummary,
	themeTitle,
} from "./theme-preset";

const config = (overrides: Partial<DesignSystemConfig>): DesignSystemConfig => ({
	...DEFAULT_CONFIG,
	...overrides,
});

describe("resolvePreset", () => {
	test("no parameter is the default theme, not an error", () => {
		expect(resolvePreset(undefined)).toEqual({ status: "default", config: DEFAULT_CONFIG });
	});

	test("a code for the default config round-trips", () => {
		const code = encodePreset(DEFAULT_CONFIG);

		expect(resolvePreset(code)).toEqual({ status: "resolved", config: DEFAULT_CONFIG, code });
	});

	/**
	 * Without this, an encoder that returned a constant would pass the test
	 * above — and every link would render the default theme.
	 */
	test("a code for a non-default config round-trips too", () => {
		const original = config({ style: "rhea", baseColor: "stone", theme: "blue", chartColor: "blue", radius: "none" });
		const resolved = resolvePreset(encodePreset(original));

		expect(resolved.status).toBe("resolved");
		expect(resolved.config).toEqual(original);
	});

	describe("a code it cannot read still renders", () => {
		const BAD = [
			["empty", ""],
			["nonsense", "!!!!!!!!!!!"],
			["truncated", encodePreset(DEFAULT_CONFIG).slice(0, -1)],
			["one character too many", `${encodePreset(DEFAULT_CONFIG)}A`],
			["corrupted", `Z${encodePreset(DEFAULT_CONFIG).slice(1)}`],
		];

		for (const [label, code] of BAD) {
			test(label, () => {
				const resolved = resolvePreset(code);

				expect(resolved.config).toEqual(DEFAULT_CONFIG);
				expect(presetCss(resolved.config)).toContain("--primary:");
			});
		}
	});

	/**
	 * The whole safety claim of the route: `validateSearch` lets any string
	 * through, so this is what stands between a pasted URL and an error boundary.
	 */
	test("never throws, whatever the query string carried", () => {
		const hostile = [
			"",
			" ",
			"%00",
			"../../etc/passwd",
			"__proto__",
			"constructor",
			"a".repeat(10_000),
			"👋👋👋👋👋👋👋👋👋👋👋👋",
			"<script>alert(1)</script>",
		];

		for (const input of hostile) {
			expect(() => resolvePreset(input)).not.toThrow();
			expect(() => presetCss(resolvePreset(input).config)).not.toThrow();
		}
	});
});

describe("themeSummary", () => {
	test("names all seven axes, in the customizer's order", () => {
		const rows = themeSummary(DEFAULT_CONFIG);

		expect(rows.map((row) => row.label)).toEqual([
			"Style",
			"Radius",
			"Base Color",
			"Theme",
			"Chart Color",
			"Heading",
			"Font",
		]);
	});

	test("every row carries a value", () => {
		for (const row of themeSummary(config({ style: "rhea", baseColor: "mist", theme: "violet" }))) {
			expect(row.value.length).toBeGreaterThan(0);
		}
	});

	test("reads titles off the shared data rather than the config's ids", () => {
		const rows = themeSummary(config({ style: "rhea", baseColor: "stone", theme: "blue", radius: "large" }));
		const value = (label: string) => rows.find((row) => row.label === label)?.value;

		expect(value("Style")).toBe("Rhea");
		expect(value("Base Color")).toBe("Stone");
		expect(value("Theme")).toBe("Blue");
		expect(value("Radius")).toBe("Large");
	});

	test("an inherited heading says what it inherited", () => {
		const rows = themeSummary(config({ font: "lora", fontHeading: "inherit" }));

		expect(rows.find((row) => row.label === "Heading")?.value).toBe("Inherit (Lora)");
	});

	test("a chosen heading is named outright", () => {
		const rows = themeSummary(config({ fontHeading: "playfair-display" }));

		expect(rows.find((row) => row.label === "Heading")?.value).toBe("Playfair Display");
	});
});

describe("themeTitle", () => {
	test("names the style and the base colour", () => {
		expect(themeTitle(DEFAULT_CONFIG)).toBe("Vega · Neutral");
	});

	test("adds the accent when there is one", () => {
		expect(themeTitle(config({ theme: "blue" }))).toBe("Vega · Neutral · Blue");
	});

	test("two themes do not share a title", () => {
		expect(themeTitle(config({ style: "rhea" }))).not.toBe(themeTitle(DEFAULT_CONFIG));
	});
});

describe("presetCss", () => {
	test("carries both modes and the radius", () => {
		const css = presetCss(DEFAULT_CONFIG);

		expect(css).toContain(":root {");
		expect(css).toContain(".dark {");
		expect(css).toContain("--radius: 0.625rem;");
	});

	test("a different config gives different CSS", () => {
		expect(presetCss(config({ theme: "blue" }))).not.toBe(presetCss(DEFAULT_CONFIG));
	});
});

/**
 * The builder holds no state — every control is a link carrying the code for the
 * configuration it would produce. So these are not tests of a UI: they are tests
 * that each of those 109 destinations is the one the tile is drawing.
 */
describe("axisOptions", () => {
	const STARTS: readonly [string, DesignSystemConfig][] = [
		["the default", DEFAULT_CONFIG],
		["a stone theme", config({ baseColor: "stone", theme: "stone", chartColor: "stone" })],
		["an accented one", config({ style: "rhea", baseColor: "zinc", theme: "violet", chartColor: "amber" })],
		["one with a heading font", config({ font: "lora", fontHeading: "playfair-display", radius: "none" })],
	];

	for (const [label, start] of STARTS) {
		describe(label, () => {
			/**
			 * The one that catches a value with no ordinal in `preset.ts`. The codec
			 * falls back per axis rather than throwing, so a font the table has not
			 * been told about gives a tile that renders, links, and silently does
			 * nothing when clicked.
			 */
			test("every option's code decodes back to the configuration it drew", () => {
				for (const axis of AXIS_KEYS) {
					for (const option of axisOptions(start, axis)) {
						expect({ axis, option: option.value, config: decodePreset(option.code) }).toEqual({
							axis,
							option: option.value,
							config: option.config,
						});
					}
				}
			});

			test("every option sets its own axis", () => {
				for (const axis of AXIS_KEYS) {
					for (const option of axisOptions(start, axis)) {
						expect(option.config[axis]).toBe(option.value);
					}
				}
			});

			test("exactly one option per axis is selected", () => {
				for (const axis of AXIS_KEYS) {
					const selected = axisOptions(start, axis).filter((option) => option.isSelected);

					expect({ axis, count: selected.length, value: selected[0]?.value }).toEqual({
						axis,
						count: 1,
						value: start[axis],
					});
				}
			});

			test("an option changes its own axis and nothing else", () => {
				for (const axis of AXIS_KEYS) {
					// Base Color is the one axis allowed to move others — see below.
					if (axis === "baseColor") continue;

					for (const option of axisOptions(start, axis)) {
						expect({ axis, ...option.config, [axis]: start[axis] }).toEqual({ axis, ...start });
					}
				}
			});

			test("every code is one the router can carry", () => {
				for (const axis of AXIS_KEYS) {
					for (const option of axisOptions(start, axis)) {
						expect(option.code).toHaveLength(PRESET_CODE_LENGTH);
					}
				}
			});
		});
	}

	/**
	 * `palettesForBaseColor` offers the selected base as the way to say "no
	 * accent" and hides the other six. Left unnormalised, switching base would
	 * leave the old one in the URL as an accent its own row no longer lists —
	 * which is `withAxis`'s whole reason for existing.
	 */
	test("choosing a base colour re-homes an accent that was the old base", () => {
		const start = config({ baseColor: "stone", theme: "stone", chartColor: "stone" });
		const zinc = axisOptions(start, "baseColor").find((option) => option.value === "zinc");

		expect(zinc?.config).toEqual(config({ baseColor: "zinc", theme: "zinc", chartColor: "zinc" }));
	});

	test("choosing a base colour keeps a real accent", () => {
		const start = config({ baseColor: "stone", theme: "violet", chartColor: "amber" });
		const zinc = axisOptions(start, "baseColor").find((option) => option.value === "zinc");

		expect(zinc?.config).toEqual(config({ baseColor: "zinc", theme: "violet", chartColor: "amber" }));
	});

	test("the palette axes offer the base colour and the seventeen accents", () => {
		for (const axis of ["theme", "chartColor"] as const) {
			const options = axisOptions(DEFAULT_CONFIG, axis);

			expect(options).toHaveLength(18);
			expect(options[0]?.value).toBe("neutral");
			expect(options.map((option) => option.value)).not.toContain("stone");
		}
	});

	test("the selected option links to where it already is", () => {
		for (const axis of AXIS_KEYS) {
			const selected = axisOptions(DEFAULT_CONFIG, axis).find((option) => option.isSelected);

			expect({ axis, code: selected?.code }).toEqual({ axis, code: encodePreset(DEFAULT_CONFIG) });
		}
	});

	test("only the heading offers inherit", () => {
		const values = (axis: AxisKey) => axisOptions(DEFAULT_CONFIG, axis).map((option) => option.value);

		expect(values("fontHeading")).toContain("inherit");
		expect(values("font")).not.toContain("inherit");
	});
});

describe("fontOptionGroups", () => {
	test("the three rails together are the whole catalogue, minus inherit", () => {
		for (const axis of ["font", "fontHeading"] as const) {
			const grouped = fontOptionGroups(DEFAULT_CONFIG, axis).flatMap((group) => group.options);
			const flat = axisOptions(DEFAULT_CONFIG, axis).filter((option) => option.value !== "inherit");

			expect(grouped).toEqual(flat);
		}
	});

	test("the rails are Sans, Mono and Serif, none of them empty", () => {
		const groups = fontOptionGroups(DEFAULT_CONFIG, "font");

		expect(groups.map((group) => group.type)).toEqual(["sans", "mono", "serif"]);
		for (const group of groups) expect(group.options.length).toBeGreaterThan(0);
	});
});

describe("inheritOption", () => {
	test("is selected only while the heading follows the body", () => {
		expect(inheritOption(DEFAULT_CONFIG)?.isSelected).toBe(true);
		expect(inheritOption(config({ fontHeading: "lora" }))?.isSelected).toBe(false);
	});

	test("clears an explicit heading", () => {
		expect(inheritOption(config({ fontHeading: "lora" }))?.config.fontHeading).toBe("inherit");
	});
});
