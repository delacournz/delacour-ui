import { contrastRatio, parseOklch } from "./contrast";
import type { ResolvedTokens } from "./resolve";

type ContrastPair = {
	label: string;
	foreground: string;
	background: string;
	minimum: number;
};

export type ThemeQualityResult = ContrastPair & {
	mode: "light" | "dark";
	foregroundValue: string | null;
	backgroundValue: string | null;
	ratio: number | null;
	status: "pass" | "fail" | "unknown";
};

export const QUALITY_STATUS = { pass: "Meets target", fail: "Below target", unknown: "Not measured" } as const;
export const QUALITY_LIMITS =
	"These estimates cover the listed opaque token pairs. Disabled states, opacity, gradients, custom overrides, and text size need visual review. This report does not certify accessibility.";

const PAIRS: readonly ContrastPair[] = [
	{ label: "Page text", foreground: "foreground", background: "background", minimum: 4.5 },
	{ label: "Card text", foreground: "card-foreground", background: "card", minimum: 4.5 },
	{ label: "Muted text", foreground: "muted-foreground", background: "card", minimum: 4.5 },
	{ label: "Primary button / Loading", foreground: "primary-foreground", background: "primary", minimum: 4.5 },
	{ label: "Secondary button", foreground: "secondary-foreground", background: "secondary", minimum: 4.5 },
	{ label: "Selected item", foreground: "accent-foreground", background: "accent", minimum: 4.5 },
	{ label: "Error text", foreground: "destructive", background: "card", minimum: 4.5 },
	{ label: "Focus indicator", foreground: "ring", background: "card", minimum: 3 },
	...[1, 2, 3, 4, 5].map((series) => ({
		label: `Chart series ${series}`,
		foreground: `chart-${series}`,
		background: "card",
		minimum: 3,
	})),
];

function isOpaqueColor(value: string | null): value is string {
	if (value === null) return false;
	const color = parseOklch(value);
	return (
		color !== undefined && Object.values(color).every(Number.isFinite) && color.l >= 0 && color.l <= 1 && color.c >= 0
	);
}

function measurePair(foreground: string | null, background: string | null): number | null {
	if (!isOpaqueColor(foreground) || !isOpaqueColor(background)) return null;
	return contrastRatio(foreground, background);
}

/** Measure known pairs without treating unsupported colors as passing. */
export function auditTheme(tokens: ResolvedTokens): ThemeQualityResult[] {
	return (["light", "dark"] as const).flatMap((mode) =>
		PAIRS.map((pair) => {
			const foreground = tokens[mode][pair.foreground];
			const background = tokens[mode][pair.background];
			const foregroundValue = typeof foreground === "string" ? foreground : null;
			const backgroundValue = typeof background === "string" ? background : null;
			const ratio = measurePair(foregroundValue, backgroundValue);
			return {
				...pair,
				mode,
				foregroundValue,
				backgroundValue,
				ratio,
				status: ratio === null ? "unknown" : ratio >= pair.minimum ? "pass" : "fail",
			};
		})
	);
}

/** Keep the exported results identical to the results on screen. */
export function formatThemeQualityReport(results: readonly ThemeQualityResult[], preset: string): string {
	return [
		"Theme quality report",
		`Preset: ${preset}`,
		"Targets: text 4.5:1; focus and chart indicators 3:1. Ratios use the existing sRGB estimate.",
		QUALITY_LIMITS,
		...results.map((row) =>
			[
				"",
				`${row.mode === "light" ? "Light" : "Dark"} / ${row.label}: ${QUALITY_STATUS[row.status]}`,
				`--${row.foreground}: ${row.foregroundValue ?? "missing"}`,
				`--${row.background}: ${row.backgroundValue ?? "missing"}`,
				`Contrast: ${row.ratio === null ? "unknown" : `${row.ratio.toFixed(2)}:1`}; target ${row.minimum}:1`,
			].join("\n")
		),
		"",
	].join("\n");
}
