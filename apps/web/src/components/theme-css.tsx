import type { DesignSystemConfig } from "@delacour/design-system/config";
import type { ResolvedMode } from "@delacour/design-system/resolve";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { useCopyButton } from "fumadocs-ui/utils/use-copy-button";
import type { ReactElement } from "react";
import { presetSwatches, type ThemeSummaryRow, themeSummary } from "@/lib/theme-preset";

/**
 * The pieces of `/theme`: what the theme is, the file it produces, and one
 * button that puts the file on the clipboard.
 *
 * All of it renders on the server. The decode and the emit are pure and the
 * preset is in the URL, so the CSS is in the first paint — which is what makes
 * the link worth pasting into a chat, and what keeps the page useful with no
 * JavaScript at all.
 */

/** A colour value from the resolved palette, for a specimen that draws it directly. */
function swatch(mode: ResolvedMode, token: string): string {
	return String(mode[token] ?? "transparent");
}

/**
 * A specimen drawn in both themes at once, with CSS choosing.
 *
 * The page follows the reader's own light/dark, and a light-ramp swatch on a
 * dark page is worse than no swatch — but a hook that reads the active theme
 * costs a mounted guard and a hydration flash. Rendering both and hiding one is
 * what `apps/web` already does for captured media, for the same reason.
 */
function BothThemes({ light, dark }: { light: ReactElement; dark: ReactElement }): ReactElement {
	return (
		<>
			<span className="dark:hidden">{light}</span>
			<span className="hidden dark:inline">{dark}</span>
		</>
	);
}

function Disc({ color }: { color: string }): ReactElement {
	return <span className="block size-5 rounded-full ring-1 ring-fd-border" style={{ background: color }} />;
}

function Charts({ mode }: { mode: ResolvedMode }): ReactElement {
	const HEIGHTS = [10, 16, 12, 20, 14];

	return (
		<span className="flex h-5 items-end gap-0.5">
			{HEIGHTS.map((height, index) => (
				<span
					className="w-1 rounded-sm"
					key={`chart-${index + 1}`}
					style={{ background: swatch(mode, `chart-${index + 1}`), height }}
				/>
			))}
		</span>
	);
}

function Surface({ mode }: { mode: ResolvedMode }): ReactElement {
	return (
		<span
			className="flex h-5 w-9 flex-col justify-center gap-1 rounded border px-1"
			style={{ background: swatch(mode, "card"), borderColor: swatch(mode, "border") }}
		>
			<span className="h-0.5 w-full rounded-full" style={{ background: swatch(mode, "foreground") }} />
			<span className="h-0.5 w-2/3 rounded-full" style={{ background: swatch(mode, "muted-foreground") }} />
		</span>
	);
}

function Corner({ radius }: { radius: string }): ReactElement {
	return <span className="block size-5 border border-fd-foreground/40" style={{ borderRadius: radius }} />;
}

function Specimen({ row, config }: { row: ThemeSummaryRow; config: DesignSystemConfig }): ReactElement | null {
	const { light, dark } = presetSwatches(config);

	if (row.specimen === "radius") {
		const value = light.radius;
		return <Corner radius={typeof value === "number" ? `${value}px` : "10px"} />;
	}

	if (row.specimen === "primary") {
		return (
			<BothThemes dark={<Disc color={swatch(dark, "primary")} />} light={<Disc color={swatch(light, "primary")} />} />
		);
	}

	if (row.specimen === "charts") {
		return <BothThemes dark={<Charts mode={dark} />} light={<Charts mode={light} />} />;
	}

	if (row.specimen === "surface") {
		return <BothThemes dark={<Surface mode={dark} />} light={<Surface mode={light} />} />;
	}

	return null;
}

/**
 * The axes, named back to the reader.
 *
 * They built this on a phone and are now looking at a wall of oklch. Without
 * this they have no way to tell whether the file on screen is the theme they
 * made — and the specimens are resolved from the whole configuration, never from
 * an option's own values, because a base colour's `primary` is not what
 * `primary` becomes once an accent is spread over it.
 */
export function ThemeSummary({ config }: { config: DesignSystemConfig }): ReactElement {
	return (
		<dl className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border bg-fd-border sm:grid-cols-2">
			{themeSummary(config).map((row) => (
				<div className="flex items-center justify-between gap-3 bg-fd-card px-4 py-3" key={row.label}>
					<dt className="text-fd-muted-foreground text-sm">{row.label}</dt>
					<dd className="flex items-center gap-2 font-medium text-sm">
						<span>{row.value}</span>
						<Specimen config={config} row={row} />
					</dd>
				</div>
			))}
		</dl>
	);
}

/**
 * The file itself.
 *
 * `DynamicCodeBlock`'s `title` renders the filename bar with its own copy button
 * inline, and its placeholder is the raw text inside the same block — so the
 * server-rendered page shows the CSS and Shiki only swaps highlighting in after
 * hydration, with nothing moving.
 */
export function ThemeCssPanel({ css }: { css: string }): ReactElement {
	return (
		<DynamicCodeBlock
			code={css}
			codeblock={{ title: "globals.css", viewportProps: { className: "max-h-[28rem]" } }}
			lang="css"
		/>
	);
}

/**
 * The second copy affordance, and deliberately a second one.
 *
 * The block's own icon is fourteen pixels in a header bar and covers muscle
 * memory; this covers the person who arrived from a phone to do exactly one
 * thing. It is fed the CSS string rather than scraping the DOM, so it cannot go
 * stale against what is rendered.
 */
export function CopyThemeButton({ css }: { css: string }): ReactElement {
	const [copied, onClick] = useCopyButton(() => navigator.clipboard.writeText(css));

	return (
		<button
			className="w-full rounded-lg bg-fd-primary px-4 py-2.5 font-medium text-fd-primary-foreground text-sm transition-opacity hover:opacity-90"
			onClick={onClick}
			type="button"
		>
			{copied ? "Copied" : "Copy theme"}
		</button>
	);
}

/**
 * Shown when a code could not be read.
 *
 * Never a redirect and never a 404 — the reader came from their own phone, and
 * the likeliest cause is a link a chat client truncated rather than anything
 * being broken. The page below it is a complete, usable default theme.
 */
export function PresetNotice({ code }: { code: string }): ReactElement {
	return (
		<div className="rounded-lg border border-fd-warning/40 bg-fd-warning/10 px-4 py-3 text-sm">
			<p>
				<span className="font-medium">That preset code could not be read.</span> Showing the default theme instead.
			</p>
			<p className="mt-1 text-fd-muted-foreground">
				Received <code className="font-mono text-xs">{code.slice(0, 64)}</code>
			</p>
		</div>
	);
}
