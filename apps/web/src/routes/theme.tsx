import { createFileRoute, Link } from "@tanstack/react-router";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { ReactElement } from "react";
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

function ThemePage(): ReactElement {
	const { preset } = Route.useSearch();
	const resolved = resolvePreset(preset);
	const native = presetNativeCss(resolved.config);
	const web = presetCss(resolved.config);

	return (
		<HomeLayout {...homeOptions()}>
			<main className="mx-auto flex w-full max-w-4xl flex-col gap-section-gap px-6 py-section-sm">
				{resolved.status === "invalid" ? (
					<div>
						<PresetNotice code={resolved.code} />
					</div>
				) : null}

				<header className="flex flex-col gap-3">
					<h1 className="text-4xl sm:text-5xl">Your theme</h1>
					<p className="text-fd-muted-foreground text-lg">
						{resolved.status === "resolved"
							? "Change any axis below, or copy theme.css straight into your project."
							: "Build a theme by picking an option on any axis. The theme.css at the bottom is the result, ready to paste."}
					</p>
					{resolved.status === "resolved" ? (
						<p className="text-fd-muted-foreground text-sm">
							Preset code <code className="rounded bg-fd-muted px-1.5 py-0.5 font-mono text-xs">{resolved.code}</code>
						</p>
					) : null}
				</header>

				<section className="flex flex-col gap-4">
					<h2 className="text-2xl">Presets</h2>
					<PresetsRow current={resolved.status === "resolved" ? resolved.code : undefined} />
				</section>

				<section className="flex flex-col gap-4">
					<ThemePreview config={resolved.config} />
				</section>

				<section className="flex flex-col gap-4">
					<div className="flex items-center justify-between gap-4">
						<h2 className="text-2xl">Axes</h2>
						<ResetThemeLink />
					</div>
					<ThemeBuilder config={resolved.config} />
				</section>

				<section className="flex flex-col gap-4">
					<h2 className="text-2xl">What that adds up to</h2>
					<ThemeSummary config={resolved.config} />
				</section>

				<section className="flex flex-col gap-4">
					<h2 className="text-2xl">Theme tokens</h2>
					<ThemeCssPanel native={native} web={web} />
				</section>

				<CopyThemeButton css={native} />

				<section className="flex flex-col gap-3 border-fd-border border-t pt-8">
					<h2 className="text-2xl">Using it</h2>
					<p className="text-fd-muted-foreground text-sm">
						Replace the whole of <code className="font-mono text-xs">src/styles/theme.css</code> with the first tab.
						There is nothing else to run — that file is the one a{" "}
						<code className="font-mono text-xs">delacour init</code> project edits, and the library reads it as it is.
					</p>
					<p className="text-fd-muted-foreground text-sm">
						The second tab is shadcn&apos;s <code className="font-mono text-xs">globals.css</code>, for a web app that
						shares the theme.
					</p>
					<p className="text-fd-muted-foreground text-sm">
						<Link
							className="underline decoration-fd-primary/60 underline-offset-4 hover:decoration-fd-primary"
							to="/docs/$"
							params={{ _splat: "native/getting-started/theming" }}
						>
							More on theming
						</Link>
					</p>
				</section>
			</main>
		</HomeLayout>
	);
}
