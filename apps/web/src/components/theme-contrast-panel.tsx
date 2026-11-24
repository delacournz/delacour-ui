import type { DesignSystemConfig } from "@delacour/design-system/config";
import { CircleCheck, TriangleAlert } from "lucide-react";
import type { ReactElement } from "react";
import { type ContrastFailureRow, themeContrast } from "@/lib/theme-contrast";

const KIND_LABEL: Record<ContrastFailureRow["kind"], string> = {
	text: "text",
	"non-text": "non-text",
};

function FailureItem({ row }: { row: ContrastFailureRow }): ReactElement {
	return (
		<li className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-4 py-2 text-xs">
			<span className="kicker w-10 shrink-0">{row.mode}</span>
			<code className="min-w-0 font-mono text-[11px]">{row.label}</code>
			<span className="ms-auto tabular-nums">
				{row.ratioLabel}{" "}
				<span className="text-fd-muted-foreground">
					of {row.minimumLabel} · {KIND_LABEL[row.kind]}
				</span>
			</span>
		</li>
	);
}

/**
 * Which pairs of the theme on screen fall below WCAG 2.2 AA.
 *
 * Computed on the server from the same resolved tokens the CSS is emitted from,
 * so it can never disagree with the file below it, and it needs no JavaScript.
 * The default and house themes are held to AA by the design system; most other
 * base and accent combinations are not, and this is where the reader finds out
 * before they paste. Status is an icon plus a sentence, never colour alone, and
 * the failing pairs are a real list inside a region labelled by its heading.
 * The list is never scroll-capped: a capped region would need focus to be
 * reachable by keyboard, and it is at most one row per pair.
 */
export function ThemeContrastPanel({ config }: { config: DesignSystemConfig }): ReactElement {
	const { total, failures } = themeContrast(config);

	if (failures.length === 0) {
		return (
			<section
				aria-labelledby="theme-contrast-heading"
				className="flex items-center gap-2 text-fd-muted-foreground text-xs"
			>
				<CircleCheck aria-hidden="true" className="size-4 shrink-0" />
				<h2 className="font-normal" id="theme-contrast-heading">
					All {total} pairs clear WCAG AA in light and dark
				</h2>
			</section>
		);
	}

	return (
		<section
			aria-labelledby="theme-contrast-heading"
			className="overflow-hidden rounded-xl border border-fd-warning/40 bg-fd-warning/10"
		>
			<div className="flex items-start gap-2 px-4 py-3 text-sm">
				<TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
				<div>
					<h2 className="font-medium" id="theme-contrast-heading">
						{failures.length} contrast {failures.length === 1 ? "pair" : "pairs"} below WCAG AA
					</h2>
					<p className="mt-0.5 text-fd-muted-foreground text-xs">
						Of {total} checked in light and dark. Text needs 4.5:1; an input border or focus ring needs 3:1.
					</p>
				</div>
			</div>
			<ul
				aria-labelledby="theme-contrast-heading"
				className="divide-y divide-fd-border/60 border-fd-border/60 border-t"
			>
				{failures.map((row) => (
					<FailureItem key={`${row.mode}-${row.label}`} row={row} />
				))}
			</ul>
		</section>
	);
}
