import { createFileRoute, Link } from "@tanstack/react-router";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { ReactElement, ReactNode } from "react";
import { PresetsRow } from "@/components/presets-row";
import { ResetThemeLink, ThemeBuilder } from "@/components/theme-builder";
import { CopyThemeButton, PresetNotice, ThemeCssPanel, ThemeSummary } from "@/components/theme-css";
import { ThemePreview } from "@/components/theme-preview";
import { themeFontLinks } from "@/lib/google-fonts";
import { homeOptions } from "@/lib/layout.shared";
import { appName } from "@/lib/shared";
import { presetCss, presetNativeCss, resolvePreset, themeTitle } from "@/lib/theme-preset";

export type ThemeSearch = { preset?: string };

/**
 * A theme, built here or brought from a phone, as a file.
 *
 * The playground's `/theme` screen composes the same axes and its footer opens
 * this page with the configuration as a twelve-character code; the builder above
 * the file composes them here instead, for the reader who has no device in hand.
 * Everything is pure and synchronous — decode, resolve, emit — so there is no
 * loader and no server function, and the CSS is in the server-rendered HTML
 * rather than arriving after hydration. That is what makes the link worth pasting
 * into a chat, and what keeps the page useful with JavaScript off.
 *
 * **The builder is stateless, and that is what protects all of the above.** Every
 * control is a `<Link>` back to this route carrying the code for the theme it
 * would produce, so the page has exactly one input — `?preset=` — whether it was
 * typed, pasted, or arrived by clicking a swatch. See `theme-builder.tsx`.
 *
 * **`validateSearch` never throws.** A throw becomes a `SearchParamError` and
 * the router renders an error boundary — so a code that lost its last character
 * to a chat client's link detection would show a stack trace instead of a theme.
 * Its only job is "is there a non-empty string called `preset`"; whether that
 * string *decodes* is `resolvePreset`'s business, and it answers with a theme
 * either way.
 *
 * It returns `{}` rather than `{ preset: undefined }` so an internal
 * `<Link to="/theme">` lands on a clean URL with no empty parameter hanging off
 * it.
 */
export const Route = createFileRoute("/theme")({
	component: ThemePage,
	validateSearch: (search: Record<string, unknown>): ThemeSearch =>
		typeof search.preset === "string" && search.preset.length > 0 ? { preset: search.preset } : {},
	head: ({ match }) => {
		const { config } = resolvePreset(match.search.preset);
		const title = themeTitle(config);

		return {
			meta: [
				{ title: `${title} — ${appName}` },
				{
					name: "description",
					content: `The CSS variables for a ${title} theme, ready to paste into a project.`,
				},
			],
			// The Font axis is the one axis a name cannot carry, so the tiles are
			// set in the faces they choose. The order of these matters — see
			// `src/lib/google-fonts.ts`.
			links: [...themeFontLinks(config)],
		};
	},
});

/**
 * The customiser as an app shell: a frosted h-14 topbar under the site header
 * carrying the page's kicker, the preset code and the two actions; a
 * hairline-ruled sidebar of axes at 22rem on the left; and the work — presets,
 * the live specimen, the summary and the file — in nested trays on the right.
 *
 * Below `lg` the shell stacks and the sidebar moves under the work, because on
 * a phone the reader came to see the theme first and tune it second. The
 * sidebar scrolls itself from `lg` up, so the topbar and the axes stay in
 * reach while the files below scroll.
 */
function ThemePage(): ReactElement {
	const { preset } = Route.useSearch();
	const resolved = resolvePreset(preset);
	const native = presetNativeCss(resolved.config);
	const web = presetCss(resolved.config);

	return (
		<HomeLayout {...homeOptions()}>
			<div className="flex min-w-0 flex-1 flex-col lg:flex-row">
				<aside className="flex flex-col gap-5 border-fd-border/70 border-t bg-(--sidebar-fill) px-4 py-6 max-lg:order-last lg:sticky lg:top-14 lg:h-[calc(100dvh-3.5rem)] lg:w-[22rem] lg:shrink-0 lg:overflow-y-auto lg:border-e lg:border-t-0">
					<div className="flex items-center justify-between gap-4">
						<p className="kicker">Axes</p>
						<ResetThemeLink />
					</div>
					<ThemeBuilder config={resolved.config} />
				</aside>

				<div className="flex min-w-0 flex-1 flex-col">
					<div className="sticky top-14 z-10 flex h-14 items-center justify-between gap-4 border-fd-border/70 border-b bg-(--frost) px-4 backdrop-blur-lg lg:px-8">
						<div className="flex min-w-0 items-baseline gap-3">
							<h1 className="truncate text-base">Your theme</h1>
							{resolved.status === "resolved" ? (
								<span className="kicker hidden rounded-md border border-fd-border/70 px-1.5 tracking-widest sm:inline">
									{resolved.code}
								</span>
							) : null}
						</div>
						<CopyThemeButton css={native} />
					</div>

					<main className="flex flex-col gap-10 px-4 py-8 lg:px-8">
						{resolved.status === "invalid" ? <PresetNotice code={resolved.code} /> : null}

						<p className="max-w-reading text-fd-muted-foreground text-xs leading-relaxed">
							{resolved.status === "resolved"
								? "Change any axis, or copy theme.css straight into your project."
								: "Build a theme by picking an option on any axis. The theme.css further down is the result, ready to paste."}
						</p>

						<Panel kicker="Presets">
							<PresetsRow current={resolved.status === "resolved" ? resolved.code : undefined} />
						</Panel>

						<Panel kicker="Preview">
							<ThemePreview config={resolved.config} />
						</Panel>

						<Panel kicker="What that adds up to">
							<ThemeSummary config={resolved.config} />
						</Panel>

						<Panel kicker="Theme tokens">
							<ThemeCssPanel native={native} web={web} />
						</Panel>

						<section className="flex max-w-reading flex-col gap-3 border-fd-border/70 border-t pt-8">
							<p className="kicker">Using it</p>
							<p className="text-fd-muted-foreground text-xs leading-relaxed">
								Replace the whole of <code className="font-mono text-[11px]">src/styles/theme.css</code> with the first
								tab. There is nothing else to run — that file is the one a{" "}
								<code className="font-mono text-[11px]">delacour init</code> project edits, and the library reads it as
								it is.
							</p>
							<p className="text-fd-muted-foreground text-xs leading-relaxed">
								The second tab is shadcn&apos;s <code className="font-mono text-[11px]">globals.css</code>, for a web
								app that shares the theme.
							</p>
							<p className="text-xs">
								<Link
									className="underline decoration-fd-foreground/30 underline-offset-4 hover:decoration-fd-foreground"
									params={{ _splat: "native/getting-started/theming" }}
									to="/docs/$"
								>
									More on theming
								</Link>
							</p>
						</section>
					</main>
				</div>
			</div>
		</HomeLayout>
	);
}

/**
 * One block of the work: a kicker over a nested tray, so every panel on the
 * page is the same muted frame around a panel — the shell's one container.
 */
function Panel({ kicker, children }: { kicker: string; children: ReactNode }): ReactElement {
	return (
		<section className="flex flex-col gap-3">
			<p className="kicker">{kicker}</p>
			<div className="tray">
				<div className="min-w-0 rounded-xl bg-fd-card p-3">{children}</div>
			</div>
		</section>
	);
}
