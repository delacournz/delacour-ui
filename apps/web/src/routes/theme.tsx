import { createFileRoute, Link } from "@tanstack/react-router";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { ReactElement } from "react";
import { ResetThemeLink, ThemeBuilder } from "@/components/theme-builder";
import { CopyThemeButton, PresetNotice, ThemeCssPanel, ThemeSummary } from "@/components/theme-css";
import { ThemePreview } from "@/components/theme-preview";
import { themeFontLinks } from "@/lib/google-fonts";
import { baseOptions } from "@/lib/layout.shared";
import { appName } from "@/lib/shared";
import { presetCss, resolvePreset, themeTitle } from "@/lib/theme-preset";

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
	const css = presetCss(resolved.config);

	return (
		<HomeLayout {...baseOptions()}>
			<main className="mx-auto w-full max-w-4xl px-6 py-16">
				{resolved.status === "invalid" ? (
					<div className="mb-8">
						<PresetNotice code={resolved.code} />
					</div>
				) : null}

				<header className="mb-8">
					<h1 className="font-semibold text-3xl tracking-tight">Your theme</h1>
					<p className="mt-2 text-fd-muted-foreground">
						{resolved.status === "resolved"
							? "Change any axis below, or copy the CSS variables straight into your project's stylesheet."
							: "Build a theme by picking an option on any axis. The file at the bottom is the result, ready to paste."}
					</p>
					{resolved.status === "resolved" ? (
						<p className="mt-3 text-fd-muted-foreground text-sm">
							Preset code <code className="rounded bg-fd-muted px-1.5 py-0.5 font-mono text-xs">{resolved.code}</code>
						</p>
					) : null}
				</header>

				<section className="mb-8">
					<ThemePreview config={resolved.config} />
				</section>

				<section className="mb-8">
					<div className="mb-4 flex items-center justify-between gap-4">
						<h2 className="font-medium text-sm">Axes</h2>
						<ResetThemeLink />
					</div>
					<ThemeBuilder config={resolved.config} />
				</section>

				<section className="mb-8">
					<h2 className="mb-3 font-medium text-sm">What that adds up to</h2>
					<ThemeSummary config={resolved.config} />
				</section>

				<section className="mb-4">
					<h2 className="mb-3 font-medium text-sm">Theme tokens</h2>
					<ThemeCssPanel css={css} />
				</section>

				<CopyThemeButton css={css} />

				<section className="mt-12 border-t pt-8">
					<h2 className="font-medium text-sm">Using it in React Native</h2>
					<p className="mt-2 text-fd-muted-foreground text-sm">
						Uniwind reads a theme only from <code className="font-mono text-xs">@variant light</code> and{" "}
						<code className="font-mono text-xs">@variant dark</code>, so the file above needs its wrapper rewritten
						before <code className="font-mono text-xs">delacour-react-native-ui</code> can paint from it. The CLI does
						that, and fills in the tokens shadcn has no name for:
					</p>
					<div className="mt-3">
						<DynamicCodeBlock code="bunx delacour theme ./globals.css" lang="bash" />
					</div>
					<p className="mt-3 text-fd-muted-foreground text-sm">
						<Link
							className="underline underline-offset-4"
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
