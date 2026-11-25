/**
 * WCAG 2.2 AA over a resolved palette: which token pairs a theme draws on
 * each other, and whether each clears its minimum.
 *
 * Pure and dependency-free, like `contrast.ts` it builds on. The tests
 * cross-check it against culori, so a ratio here is the ratio culori — and
 * Uniwind, which parses colours with it — would compute.
 */

import { oklchToSrgb, type Rgb, relativeLuminance } from "./contrast";
import { extensionDefaults } from "./convert";
import type { ResolvedMode, ResolvedTokens } from "./resolve";

/** Which WCAG minimum a pair is held to. */
export type ContrastRequirement = "text" | "large-text" | "non-text";

/** SC 1.4.3 for text and large text, SC 1.4.11 for a control's boundary or a focus ring. */
export const CONTRAST_MINIMUMS: Readonly<Record<ContrastRequirement, number>> = {
	text: 4.5,
	"large-text": 3,
	"non-text": 3,
};

/** A token drawn on another, both named WITHOUT the leading `--`. */
export type ContrastPair = {
	readonly foreground: string;
	readonly background: string;
	readonly requirement: ContrastRequirement;
};

export type ContrastMode = "light" | "dark";

export type ContrastFinding = {
	readonly mode: ContrastMode;
	readonly pair: ContrastPair;
	readonly ratio: number;
	readonly minimum: number;
	readonly passes: boolean;
};

const text = (foreground: string, background: string): ContrastPair => ({
	foreground,
	background,
	requirement: "text",
});
const nonText = (foreground: string, background: string): ContrastPair => ({
	foreground,
	background,
	requirement: "non-text",
});

/**
 * Every pair the library actually draws.
 *
 * Text pairs are each surface with its own `-foreground`, plus `muted-foreground`
 * on the four surfaces captions and placeholders sit on, plus `destructive` as
 * the error text `Field` writes on the page and on a card.
 *
 * Non-text pairs are `input` — the edge of every Input, OTP cell, Checkbox,
 * Radio ring, SelectionMode mark and Slider thumb, and the Switch's off track —
 * and `ring`, the focus indicator. `border` is absent on
 * purpose: it is a decorative divider between surfaces, which SC 1.4.11 exempts,
 * and holding a card's hairline to 3:1 would draw every list as a grid.
 */
export const CONTRAST_PAIRS: readonly ContrastPair[] = [
	text("foreground", "background"),
	text("card-foreground", "card"),
	text("popover-foreground", "popover"),
	text("primary-foreground", "primary"),
	text("secondary-foreground", "secondary"),
	text("accent-foreground", "accent"),
	text("muted-foreground", "muted"),
	text("muted-foreground", "secondary"),
	text("muted-foreground", "background"),
	text("muted-foreground", "card"),
	text("elevated-foreground", "elevated"),
	text("tertiary-foreground", "tertiary"),
	text("destructive-foreground", "destructive"),
	text("destructive", "background"),
	text("destructive", "card"),
	text("success-foreground", "success"),
	text("warning-foreground", "warning"),
	text("info-foreground", "info"),
	text("destructive-soft-foreground", "destructive-soft"),
	text("success-soft-foreground", "success-soft"),
	text("warning-soft-foreground", "warning-soft"),
	text("info-soft-foreground", "info-soft"),
	text("sidebar-foreground", "sidebar"),
	text("sidebar-primary-foreground", "sidebar-primary"),
	text("sidebar-accent-foreground", "sidebar-accent"),
	nonText("input", "background"),
	nonText("input", "card"),
	nonText("ring", "background"),
	nonText("ring", "card"),
];

/** An OKLCH colour with its alpha, 0 to 1. */
export type Oklcha = { readonly l: number; readonly c: number; readonly h: number; readonly alpha: number };

const OKLCH = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)(%?)\s*)?\)$/;
const VAR = /^var\(\s*--([\w-]+)\s*\)$/;
const MIX = /^color-mix\(\s*in\s+oklch\s*,\s*(.+?)\s+([\d.]+)%\s*,\s*(.+?)(?:\s+([\d.]+)%)?\s*\)$/;

/** A colour expression, alone — a literal, a `var()`, or a `color-mix()` of two. */
function evaluate(expression: string, values: Readonly<Record<string, string | number>>, seen: Set<string>): Oklcha {
	const value = expression.trim();

	const literal = OKLCH.exec(value);
	if (literal) {
		const alpha = literal[4] === undefined ? 1 : Number(literal[4]) / (literal[5] === "%" ? 100 : 1);
		return { l: Number(literal[1]), c: Number(literal[2]), h: Number(literal[3]), alpha };
	}

	const alias = VAR.exec(value);
	if (alias) return lookup(alias[1] as string, values, seen);

	const mix = MIX.exec(value);
	if (mix) {
		const first = evaluate(mix[1] as string, values, seen);
		const second = evaluate(mix[3] as string, values, seen);
		const p = Number(mix[2]);
		const q = mix[4] === undefined ? 100 - p : Number(mix[4]);
		return mixOklch(first, second, p / (p + q));
	}

	throw new Error(`contrast audit: cannot read ${value}`);
}

function lookup(name: string, values: Readonly<Record<string, string | number>>, seen: Set<string>): Oklcha {
	if (seen.has(name)) throw new Error(`contrast audit: --${name} refers to itself`);
	const value = values[name];
	if (typeof value !== "string") throw new Error(`contrast audit: no colour named --${name}`);

	return evaluate(value, values, new Set([...seen, name]));
}

/**
 * CSS Color 4 `color-mix(in oklch, …)`: premultiplied lightness and chroma, the
 * shorter hue arc, and a powerless hue (zero chroma) taking the other side's —
 * which is what keeps a red tinted toward a grey page red.
 */
function mixOklch(first: Oklcha, second: Oklcha, weight: number): Oklcha {
	const other = 1 - weight;
	const alpha = first.alpha * weight + second.alpha * other;
	const premultiplied = (a: number, b: number) =>
		alpha === 0 ? 0 : (a * first.alpha * weight + b * second.alpha * other) / alpha;

	const firstHue = first.c === 0 ? second.h : first.h;
	const secondHue = second.c === 0 ? first.h : second.h;
	let delta = secondHue - firstHue;
	if (delta > 180) delta -= 360;
	if (delta < -180) delta += 360;
	const h = (((firstHue + delta * other) % 360) + 360) % 360;

	return { l: premultiplied(first.l, second.l), c: premultiplied(first.c, second.c), h, alpha };
}

/**
 * A token's colour, following `var()` and `color-mix()` to a literal.
 *
 * Throws on a name that is missing or refers to itself rather than guessing a
 * colour: a silent fallback would be an audit that reports a pass it never ran.
 */
export function resolveColor(name: string, values: Readonly<Record<string, string | number>>): Oklcha {
	return lookup(name, values, new Set());
}

/** `top` laid over `bottom` in gamma-encoded sRGB, which is how both platforms blend. */
function composite(top: Oklcha, bottom: Rgb): Rgb {
	const rgb = oklchToSrgb(top);
	const over = (a: number, b: number) => Math.round(a * top.alpha + b * (1 - top.alpha));

	return { r: over(rgb.r, bottom.r), g: over(rgb.g, bottom.g), b: over(rgb.b, bottom.b) };
}

function ratio(a: Rgb, b: Rgb): number {
	const la = relativeLuminance(a);
	const lb = relativeLuminance(b);
	const [hi, lo] = la > lb ? [la, lb] : [lb, la];

	return (hi + 0.05) / (lo + 0.05);
}

/** The opaque page everything else is ultimately laid over. */
function page(values: Readonly<Record<string, string | number>>): Rgb {
	const background = resolveColor("background", values);
	return composite(background, { r: 255, g: 255, b: 255 });
}

function auditMode(mode: ContrastMode, resolved: ResolvedMode): ContrastFinding[] {
	const values: Record<string, string | number> = { ...extensionDefaults(mode), ...resolved };
	const ground = page(values);

	return CONTRAST_PAIRS.map((pair) => {
		const surface = composite(resolveColor(pair.background, values), ground);
		const ink = composite(resolveColor(pair.foreground, values), surface);
		const value = ratio(ink, surface);
		const minimum = CONTRAST_MINIMUMS[pair.requirement];

		return { mode, pair, ratio: value, minimum, passes: value >= minimum };
	});
}

/**
 * Every pair in `CONTRAST_PAIRS`, in both modes, for one resolved theme.
 *
 * Tokens the resolver does not write — `success`, `info`, the `-soft` pairs —
 * take the values `theme.css` ships, exactly as `emitNativeCss` fills them, so
 * the audit reads the same palette a reader copies off `/theme`.
 */
export function auditContrast(tokens: ResolvedTokens): ContrastFinding[] {
	return [...auditMode("light", tokens.light), ...auditMode("dark", tokens.dark)];
}

/** Only the pairs that fall short. Empty for a theme that clears AA everywhere. */
export function contrastFailures(tokens: ResolvedTokens): ContrastFinding[] {
	return auditContrast(tokens).filter((finding) => !finding.passes);
}
