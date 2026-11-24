import { describe, expect, test } from "bun:test";
import { converter, interpolate, parse, wcagContrast } from "culori";
import { BASE_COLORS } from "./base-colors";
import { DEFAULT_CONFIG, palettesForBaseColor } from "./config";
import {
	auditContrast,
	CONTRAST_MINIMUMS,
	CONTRAST_PAIRS,
	type ContrastFinding,
	contrastFailures,
	resolveColor,
} from "./contrast-audit";
import { HOUSE_CONFIG, PRESET_SHORTCUTS } from "./house";
import { resolveTokens } from "./resolve";

const toRgb = converter("rgb");

/** culori's own reading of a literal, as 8-bit sRGB clipped to the gamut. */
function culoriRgb(value: string): { r: number; g: number; b: number } {
	const parsed = toRgb(parse(value));
	if (!parsed) throw new Error(`culori cannot parse ${value}`);
	const channel = (c: number) => Math.round(Math.min(1, Math.max(0, c)) * 255);

	return { r: channel(parsed.r), g: channel(parsed.g), b: channel(parsed.b) };
}

function describeFinding(finding: ContrastFinding): string {
	const { mode, pair, ratio, minimum } = finding;
	return `${mode} ${pair.foreground} on ${pair.background}: ${ratio.toFixed(2)} < ${minimum}`;
}

describe("CONTRAST_MINIMUMS", () => {
	test("are WCAG 2.2 AA's: 4.5 for text, 3 for large text and for non-text", () => {
		expect(CONTRAST_MINIMUMS).toEqual({ text: 4.5, "large-text": 3, "non-text": 3 });
	});
});

describe("resolveColor", () => {
	const values = {
		background: "oklch(0.985 0 0)",
		foreground: "oklch(0.145 0 0)",
		destructive: "oklch(0.577 0.245 27.325)",
		alias: "var(--foreground)",
		chain: "var(--alias)",
		tint: "color-mix(in oklch, var(--destructive) 8%, var(--background))",
		hairline: "oklch(0 0 0 / 12%)",
		loop: "var(--loop)",
	};

	test("reads a literal oklch() with and without alpha", () => {
		expect(resolveColor("background", values)).toEqual({ l: 0.985, c: 0, h: 0, alpha: 1 });
		expect(resolveColor("hairline", values)).toEqual({ l: 0, c: 0, h: 0, alpha: 0.12 });
	});

	test("follows var() through any number of aliases", () => {
		expect(resolveColor("chain", values)).toEqual(resolveColor("foreground", values));
	});

	test("mixes in oklch the way culori interpolates, taking the chromatic hue over a powerless one", () => {
		const mixed = resolveColor("tint", values);
		const expected = interpolate([values.destructive, values.background], "oklch")(0.92);

		expect(mixed.l).toBeCloseTo(expected.l, 4);
		expect(mixed.c).toBeCloseTo(expected.c, 4);
		expect(mixed.h).toBeCloseTo(27.325, 3);
	});

	test("throws on a name it cannot resolve, and on a cycle", () => {
		expect(() => resolveColor("missing", values)).toThrow();
		expect(() => resolveColor("loop", values)).toThrow();
	});
});

describe("the audit agrees with culori", () => {
	const neutral = resolveTokens(DEFAULT_CONFIG);

	test("every opaque pair's ratio matches culori's wcagContrast", () => {
		for (const finding of auditContrast(neutral)) {
			const fg = neutral[finding.mode][finding.pair.foreground];
			const bg = neutral[finding.mode][finding.pair.background];
			if (typeof fg !== "string" || typeof bg !== "string") continue;
			if (fg.includes("/") || bg.includes("/") || !fg.startsWith("oklch") || !bg.startsWith("oklch")) continue;

			const expected = wcagContrast({ mode: "rgb", ...scale(culoriRgb(fg)) }, { mode: "rgb", ...scale(culoriRgb(bg)) });
			expect(finding.ratio).toBeCloseTo(expected, 2);
		}
	});
});

function scale({ r, g, b }: { r: number; g: number; b: number }) {
	return { r: r / 255, g: g / 255, b: b / 255 };
}

describe("auditContrast", () => {
	test("reports every pair in both modes", () => {
		const findings = auditContrast(resolveTokens(DEFAULT_CONFIG));
		expect(findings).toHaveLength(CONTRAST_PAIRS.length * 2);
	});

	test("composites a translucent foreground over the surface it is drawn on", () => {
		const neutral = resolveTokens(DEFAULT_CONFIG);
		const withInput = (input: string) => ({ light: { ...neutral.light, input }, dark: { ...neutral.dark, input } });
		const inputOnCard = (findings: ContrastFinding[]) =>
			findings.find((finding) => finding.pair.foreground === "input" && finding.pair.background === "card");

		const solid = inputOnCard(auditContrast(withInput("oklch(0 0 0)")));
		const faint = inputOnCard(auditContrast(withInput("oklch(0 0 0 / 5%)")));

		expect(solid?.passes).toBe(true);
		expect(faint?.passes).toBe(false);
		expect(faint?.ratio).toBeLessThan(1.2);
	});

	test("fills the tokens the resolver does not write from the shipped defaults", () => {
		const findings = auditContrast(resolveTokens(DEFAULT_CONFIG));
		expect(findings.some((finding) => finding.pair.background === "success")).toBe(true);
		expect(findings.every((finding) => Number.isFinite(finding.ratio))).toBe(true);
	});
});

/**
 * What `delacour init` ships has to clear AA without anyone tuning it.
 *
 * Every failure is named in full, so a red run says which pair regressed and by
 * how much rather than that "something" did.
 */
describe("the default theme", () => {
	test("clears AA for every pair, in both modes", () => {
		expect(contrastFailures(resolveTokens(DEFAULT_CONFIG)).map(describeFinding)).toEqual([]);
	});
});

/**
 * The house preset is held to the default's bar: it is the theme the docs site
 * and the playground paint themselves in.
 *
 * The amber shortcut is not. It sits on shadcn's `zinc` ramp as transcribed, and
 * `/theme` flags its failing pairs like any other theme a reader builds.
 */
describe("the house preset", () => {
	test("clears AA for every pair, in both modes", () => {
		expect(contrastFailures(resolveTokens(HOUSE_CONFIG)).map(describeFinding)).toEqual([]);
	});
});

describe("every preset shortcut", () => {
	for (const preset of PRESET_SHORTCUTS) {
		test(`${preset.title} audits every pair in both modes`, () => {
			const findings = auditContrast(resolveTokens(preset.config));
			expect(findings).toHaveLength(CONTRAST_PAIRS.length * 2);
			expect(findings.every((finding) => Number.isFinite(finding.ratio))).toBe(true);
		});
	}
});

/**
 * Every theme the customiser can reach resolves to something the audit can read.
 *
 * They are not all held to AA — most accents are shadcn's, transcribed as they
 * ship — but an unreadable value would make `/theme` silently show no warning.
 */
describe("every reachable theme", () => {
	for (const base of BASE_COLORS) {
		for (const palette of palettesForBaseColor(base.name)) {
			test(`${base.name} × ${palette.name} audits without throwing`, () => {
				const findings = auditContrast(
					resolveTokens({ ...DEFAULT_CONFIG, baseColor: base.name, theme: palette.name, chartColor: base.name })
				);
				expect(findings.every((finding) => Number.isFinite(finding.ratio))).toBe(true);
			});
		}
	}
});
