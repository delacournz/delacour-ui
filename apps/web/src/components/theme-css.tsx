import type { DesignSystemConfig } from "@delacour/design-system/config";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { useCopyButton } from "fumadocs-ui/utils/use-copy-button";
import type { ReactElement } from "react";
import { ChartsSpecimen, CornerSpecimen, PrimarySpecimen, SurfaceSpecimen } from "@/components/theme-specimens";
import { type ThemeSummaryRow, themeSummary } from "@/lib/theme-preset";

/**
 * The pieces of `/theme`: what the theme is, the two files it produces, and one
 * button that puts the React Native one on the clipboard.
 *
 * All of it renders on the server. The decode and the emit are pure and the
 * preset is in the URL, so the CSS is in the first paint — which is what makes
 * the link worth pasting into a chat, and what keeps the page useful with no
 * JavaScript at all.
 *
 * The specimens live in `theme-specimens.tsx` because the builder above draws
 * the same ones on its option tiles, and a swatch on a tile that disagreed with
 * the swatch on the row it sets would be wrong in exactly the place someone is
 * comparing the two.
 */

function Specimen({ row, config }: { row: ThemeSummaryRow; config: DesignSystemConfig }): ReactElement | null {
	if (row.specimen === "radius") return <CornerSpecimen config={config} />;
	if (row.specimen === "primary") return <PrimarySpecimen config={config} />;
	if (row.specimen === "charts") return <ChartsSpecimen config={config} />;
	if (row.specimen === "surface") return <SurfaceSpecimen config={config} />;

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

/** The two files a theme is, keyed by the tab that shows each. */
export type ThemeCssFiles = {
	/** `theme.css`, in the `@variant light` / `@variant dark` shape `native-ui` reads. */
	native: string;
	/** `globals.css`, in shadcn's `:root` / `.dark` shape, for a web app sharing the theme. */
	web: string;
};

const FILE_TAB_CLASS = "max-h-[28rem]";

/**
 * The file itself — as two files, and the React Native one first.
 *
 * The same configuration is two stylesheets because Uniwind and the browser
 * disagree about where a theme lives. Uniwind reads a palette only from
 * `@variant light` / `@variant dark`; hand it shadcn's `.dark { … }` and it
 * stores the block as a utility class named `dark`, and the dark palette never
 * arrives. So the first tab is `theme.css`, the one-file contract of a
 * `delacour init` project: replace the whole of `src/styles/theme.css` with it
 * and there is nothing to run. The second tab is shadcn's `globals.css`, for a
 * web app that shares the theme — a real need, but the secondary one on a site
 * about a React Native library.
 *
 * Both blocks are in the server HTML. `DynamicCodeBlock`'s placeholder is the
 * raw text inside the same block, so the first paint carries the CSS and Shiki
 * only swaps highlighting in after hydration, with nothing moving. `Tabs` keeps
 * which tab is open as its own client state, and that is presentation rather
 * than page input: `?preset=` stays the only thing that decides what the CSS
 * says — see `apps/web/AGENTS.md`.
 *
 * `items` gives fumadocs' simple mode, which draws the trigger strip itself;
 * each `Tab` names its `value` outright rather than relying on render order,
 * so a reordering above cannot silently swap the files under their labels.
 * `keepMounted` is what puts the *second* file in the server HTML: Base UI
 * unmounts an inactive panel by default, and fumadocs hides a kept one with
 * `data-[inactive]:hidden` — so `curl … | grep ".dark {"` finds `globals.css`
 * too, and the panel switch after hydration moves nothing.
 */
export function ThemeCssPanel({ native, web }: ThemeCssFiles): ReactElement {
	return (
		<Tabs items={["theme.css", "globals.css"]}>
			<Tab keepMounted value="theme.css">
				<DynamicCodeBlock
					code={native}
					codeblock={{ title: "theme.css", viewportProps: { className: FILE_TAB_CLASS } }}
					lang="css"
				/>
			</Tab>
			<Tab keepMounted value="globals.css">
				<DynamicCodeBlock
					code={web}
					codeblock={{ title: "globals.css", viewportProps: { className: FILE_TAB_CLASS } }}
					lang="css"
				/>
			</Tab>
		</Tabs>
	);
}

/**
 * The second copy affordance, and deliberately a second one.
 *
 * The block's own icon is fourteen pixels in a header bar and covers muscle
 * memory; this covers the person who arrived from a phone to do exactly one
 * thing — and that one thing is `theme.css`, so this copies the native file and
 * says so. The web tab relies on its block's own icon. It is fed the CSS string
 * rather than scraping the DOM, so it cannot go stale against what is rendered.
 */
export function CopyThemeButton({ css }: { css: string }): ReactElement {
	const [copied, onClick] = useCopyButton(() => navigator.clipboard.writeText(css));

	return (
		<button
			className="w-full rounded-lg bg-fd-primary px-4 py-2.5 font-medium text-fd-primary-foreground text-sm transition-opacity hover:opacity-90"
			onClick={onClick}
			type="button"
		>
			{copied ? "Copied" : "Copy theme.css"}
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
