import type { DesignSystemConfig } from "@delacour/design-system/config";
import { auditContrast, type ContrastMode, type ContrastRequirement } from "@delacour/design-system/contrast-audit";
import { resolveTokens } from "@delacour/design-system/resolve";

/** One failing pair, labelled for display. */
export type ContrastFailureRow = {
	mode: ContrastMode;
	foreground: string;
	background: string;
	kind: "text" | "non-text";
	label: string;
	ratio: number;
	minimum: number;
	ratioLabel: string;
	minimumLabel: string;
};

export type ThemeContrastReport = {
	/** Every pair checked, in both modes. */
	total: number;
	/** Failing pairs, furthest below their minimum first. */
	failures: readonly ContrastFailureRow[];
};

const KIND: Record<ContrastRequirement, ContrastFailureRow["kind"]> = {
	text: "text",
	"large-text": "text",
	"non-text": "non-text",
};

const ratioText = (value: number): string => `${value.toFixed(2)}:1`;
const minimumText = (value: number): string => `${Number.isInteger(value) ? value : value.toFixed(1)}:1`;

/**
 * The WCAG AA audit of the theme a config resolves to, as a view model.
 *
 * Pure, so the whole matrix is reachable from `bun test`. Sorted by how far each
 * pair falls short (ratio over minimum), then by name, so the order is stable.
 */
export function themeContrast(config: DesignSystemConfig): ThemeContrastReport {
	const findings = auditContrast(resolveTokens(config));
	const failures = findings
		.filter((finding) => !finding.passes)
		.map(
			(finding): ContrastFailureRow => ({
				mode: finding.mode,
				foreground: finding.pair.foreground,
				background: finding.pair.background,
				kind: KIND[finding.pair.requirement],
				label: `--${finding.pair.foreground} on --${finding.pair.background}`,
				ratio: finding.ratio,
				minimum: finding.minimum,
				ratioLabel: ratioText(finding.ratio),
				minimumLabel: minimumText(finding.minimum),
			})
		)
		.sort(
			(a, b) =>
				a.ratio / a.minimum - b.ratio / b.minimum || a.label.localeCompare(b.label) || a.mode.localeCompare(b.mode)
		);

	return { total: findings.length, failures };
}
