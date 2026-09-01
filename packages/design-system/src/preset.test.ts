import { describe, expect, test } from "bun:test";
import { BASE_COLORS } from "./base-colors";
import { DEFAULT_CONFIG, type DesignSystemConfig, normalizeConfig, palettesForBaseColor } from "./config";
import { FONTS } from "./fonts";
import {
	BASE_COLOR_ORDINALS,
	decodePreset,
	encodePreset,
	FONT_ORDINALS,
	PALETTE_ORDINALS,
	PRESET_CODE_LENGTH,
	PRESET_VERSION,
	RADIUS_ORDINALS,
	STYLE_ORDINALS,
} from "./preset";
import { RADII } from "./radii";
import { STYLES } from "./styles";
import { ACCENT_THEMES } from "./themes";

const config = (overrides: Partial<DesignSystemConfig>): DesignSystemConfig => ({
	...DEFAULT_CONFIG,
	...overrides,
});

describe("the ordinal tables", () => {
	const TABLES: [string, Record<string, number>, readonly string[]][] = [
		["style", STYLE_ORDINALS, STYLES.map((style) => style.name)],
		["baseColor", BASE_COLOR_ORDINALS, BASE_COLORS.map((base) => base.name)],
		[
			"palette",
			PALETTE_ORDINALS,
			[...BASE_COLORS.map((base) => base.name), ...ACCENT_THEMES.map((theme) => theme.name)],
		],
		["font", FONT_ORDINALS, ["inherit", ...FONTS.map((font) => font.name)]],
		["radius", RADIUS_ORDINALS, RADII.map((radius) => radius.name)],
	];

	for (const [label, table, names] of TABLES) {
		test(`${label} covers every name the data declares`, () => {
			for (const name of names) expect(table[name]).toBeDefined();
		});

		test(`${label} assigns each name a distinct byte`, () => {
			const assigned = Object.values(table);
			expect(new Set(assigned).size).toBe(assigned.length);
			for (const ordinal of assigned) {
				expect(Number.isInteger(ordinal)).toBe(true);
				expect(ordinal).toBeGreaterThanOrEqual(0);
				expect(ordinal).toBeLessThanOrEqual(255);
			}
		});

		test(`${label} declares nothing the data does not`, () => {
			for (const name of Object.keys(table)) expect(names).toContain(name);
		});
	}

	/**
	 * The one that catches the real hazard.
	 *
	 * Every other test here would still pass if the tables were built from
	 * `STYLES.map((s, i) => …)`. This one pins the numbers themselves, so a
	 * reorder of the display lists — which is a plausible editorial change, they
	 * are in shadcn's own order — cannot silently repoint every shared link.
	 */
	test("the numbers are literal, not positional", () => {
		expect(STYLE_ORDINALS).toEqual({
			vega: 0,
			nova: 1,
			maia: 2,
			lyra: 3,
			mira: 4,
			luma: 5,
			sera: 6,
			rhea: 7,
		});
		expect(RADIUS_ORDINALS).toEqual({ default: 0, none: 1, small: 2, medium: 3, large: 4 });
		expect(FONT_ORDINALS.inherit).toBe(0);
		expect(FONT_ORDINALS.geist).toBe(1);
		expect(PALETTE_ORDINALS.neutral).toBe(0);
		expect(PALETTE_ORDINALS.blue).toBe(8);
	});
});

describe("encoding", () => {
	test("every code is the same length, in the base64url alphabet", () => {
		for (const style of STYLES) {
			for (const radius of RADII) {
				const code = encodePreset(config({ style: style.name, radius: radius.name }));
				expect(code).toHaveLength(PRESET_CODE_LENGTH);
				expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
			}
		}
	});

	test("a code survives a URL untouched", () => {
		const code = encodePreset(config({ style: "rhea", baseColor: "stone", theme: "blue" }));
		expect(encodeURIComponent(code)).toBe(code);
	});

	test("two different configs do not share a code", () => {
		const seen = new Map<string, string>();

		for (const style of STYLES) {
			for (const base of BASE_COLORS) {
				const code = encodePreset(config({ style: style.name, baseColor: base.name }));
				expect(seen.has(code)).toBe(false);
				seen.set(code, `${style.name}/${base.name}`);
			}
		}
	});
});

describe("the round trip", () => {
	test("every style, against the default", () => {
		for (const style of STYLES) {
			const original = config({ style: style.name });
			expect(decodePreset(encodePreset(original))).toEqual(original);
		}
	});

	test("every radius", () => {
		for (const radius of RADII) {
			const original = config({ radius: radius.name });
			expect(decodePreset(encodePreset(original))).toEqual(original);
		}
	});

	test("every base colour, with each palette it offers", () => {
		for (const base of BASE_COLORS) {
			for (const palette of palettesForBaseColor(base.name)) {
				const original = config({ baseColor: base.name, theme: palette.name, chartColor: palette.name });
				expect(decodePreset(encodePreset(original))).toEqual(original);
			}
		}
	});

	test("every font, and every heading including inherit", () => {
		for (const font of FONTS) {
			const body = config({ font: font.name });
			expect(decodePreset(encodePreset(body))).toEqual(body);

			const heading = config({ fontHeading: font.name });
			expect(decodePreset(encodePreset(heading))).toEqual(heading);
		}

		const inherited = config({ fontHeading: "inherit" });
		expect(decodePreset(encodePreset(inherited))).toEqual(inherited);
	});

	/**
	 * The expectation is `normalizeConfig(original)`, not `original`.
	 *
	 * Holding the default `neutral` accent while moving the base colour is not a
	 * config the app can be in: `normalizeConfig` falls an accent the base does
	 * not offer back to the base itself, and it runs on both sides of the wire.
	 * Asserting the raw input here would be asserting a state no store can hold.
	 */
	test("the whole style × base × radius cross product", () => {
		for (const style of STYLES) {
			for (const base of BASE_COLORS) {
				for (const radius of RADII) {
					const original = config({ style: style.name, baseColor: base.name, radius: radius.name });
					expect(decodePreset(encodePreset(original))).toEqual(normalizeConfig(original));
				}
			}
		}
	});
});

/**
 * These are published links.
 *
 * A failure here means every preset anyone has ever shared now resolves to a
 * different theme. The fix is a `PRESET_VERSION` bump and a new table — never a
 * re-baseline of this one.
 */
describe("the golden codes", () => {
	const GOLDEN: [DesignSystemConfig, string][] = [
		[DEFAULT_CONFIG, "AQAAAAABAACP"],
		[config({ style: "rhea" }), "AQcAAAABAAD-"],
		[config({ baseColor: "stone", theme: "stone", chartColor: "stone" }), "AQABAQEBAABA"],
		[config({ theme: "blue", chartColor: "blue" }), "AQAACAgBAADv"],
		[config({ radius: "none" }), "AQAAAAABAAH8"],
		[config({ radius: "large" }), "AQAAAAABAARD"],
		[config({ font: "inter", fontHeading: "playfair-display" }), "AQAAAAACGAAi"],
		[
			config({
				style: "sera",
				baseColor: "mist",
				theme: "violet",
				chartColor: "cyan",
				font: "geist-mono",
				fontHeading: "lora",
				radius: "medium",
			}),
			"AQYFFgkSFwN0",
		],
	];

	for (const [original, code] of GOLDEN) {
		test(`${JSON.stringify(original)} stays ${code}`, () => {
			expect(encodePreset(original)).toBe(code);
			expect(decodePreset(code)).toEqual(original);
		});
	}
});

describe("rejection", () => {
	const MALFORMED = [
		["empty", ""],
		["one short", "AQAAAAABAe"],
		["one long", "AQAAAAABAecA"],
		["standard base64 padding", "AQAAAAABAe=="],
		["standard base64 alphabet", "AQAAAAAB+/8"],
		["not base64 at all", "!!!!!!!!!!!"],
		["a path", "../../etc/p"],
		["a prototype key", "__proto__aa"],
	];

	for (const [label, code] of MALFORMED) {
		test(`rejects ${label}`, () => {
			expect(decodePreset(code as string)).toBeNull();
		});
	}

	test("rejects a version this build does not know", () => {
		const wrong = encodePreset(DEFAULT_CONFIG).replace(/^AQ/, "Ag");
		expect(decodePreset(wrong)).toBeNull();
	});

	test("rejects almost every single-character corruption", () => {
		const code = encodePreset(config({ style: "rhea", baseColor: "stone", theme: "blue" }));
		const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

		let mutations = 0;
		let rejected = 0;

		for (let index = 0; index < code.length; index += 1) {
			for (const character of alphabet) {
				if (character === code[index]) continue;
				mutations += 1;
				if (decodePreset(code.slice(0, index) + character + code.slice(index + 1)) === null) rejected += 1;
			}
		}

		expect(mutations).toBeGreaterThan(100);
		expect(rejected / mutations).toBeGreaterThan(0.9);
	});

	test("never throws, whatever it is handed", () => {
		const hostile = ["", " ", "%00", " ", "𝔘𝔫𝔦𝔠𝔬𝔡𝔢!!", "a".repeat(10_000), "null", "undefined"];

		for (const input of hostile) expect(() => decodePreset(input)).not.toThrow();
	});
});

describe("forgiveness", () => {
	/**
	 * A link outlives the build that wrote it, so one retired name must not cost
	 * the other six axes. Built by hand rather than through `encodePreset`,
	 * because the encoder cannot produce an ordinal no table declares.
	 */
	function handBuild(bytes: number[]): string {
		const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
		let checksum = 0x81_1c_9d_c5;
		for (const byte of bytes) {
			checksum = Math.imul(checksum ^ byte, 0x01_00_01_93) >>> 0;
		}

		const all = [...bytes, checksum & 0xff];
		let out = "";
		for (let index = 0; index < all.length; index += 3) {
			const chunk = ((all[index] ?? 0) << 16) | ((all[index + 1] ?? 0) << 8) | (all[index + 2] ?? 0);
			const take = Math.min(3, all.length - index) + 1;
			for (let step = 0; step < take; step += 1) {
				out += alphabet[(chunk >> (18 - step * 6)) & 0x3f];
			}
		}

		return out;
	}

	test("an unknown font ordinal costs only the font", () => {
		const code = handBuild([PRESET_VERSION, 7, 1, 1, 1, 250, 0, 4]);
		const decoded = decodePreset(code);

		expect(decoded).not.toBeNull();
		expect(decoded?.font).toBe(DEFAULT_CONFIG.font);
		expect(decoded?.style).toBe("rhea");
		expect(decoded?.baseColor).toBe("stone");
		expect(decoded?.radius).toBe("large");
	});

	test("an unknown style ordinal costs only the style", () => {
		const code = handBuild([PRESET_VERSION, 200, 1, 1, 1, 2, 0, 1]);
		const decoded = decodePreset(code);

		expect(decoded?.style).toBe(DEFAULT_CONFIG.style);
		expect(decoded?.baseColor).toBe("stone");
		expect(decoded?.font).toBe("inter");
	});

	/**
	 * `normalizeConfig` is the last step, so an accent that is not on offer for
	 * the decoded base colour falls back to the base — the same rule the store
	 * applies to a config read back out of MMKV.
	 */
	test("a palette the base colour does not offer falls back to the base", () => {
		const code = handBuild([PRESET_VERSION, 0, 1, 2, 2, 1, 0, 0]);
		const decoded = decodePreset(code);

		expect(decoded?.baseColor).toBe("stone");
		expect(decoded?.theme).toBe("stone");
		expect(decoded?.chartColor).toBe("stone");
	});
});
