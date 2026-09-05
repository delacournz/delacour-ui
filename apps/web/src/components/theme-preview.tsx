import type { DesignSystemConfig } from "@delacour/design-system/config";
import { type ResolvedFonts, type ResolvedMode, resolveFonts, resolveTokens } from "@delacour/design-system/resolve";
import type { ReactElement } from "react";
import { length, swatch } from "@/components/theme-specimens";
import { fontSpecimen } from "@/lib/google-fonts";

/**
 * The theme, wearing an interface.
 *
 * Seven swatches tell you what the palette is; they do not tell you whether the
 * Style axis did anything, because height, corner and type scale are most of what
 * separates Vega from Rhea and none of it is a colour. This draws a card, three
 * controls and a field out of the *resolved* tokens, so every axis on the page
 * visibly moves something.
 *
 * **It is not a live component preview.** `apps/web/AGENTS.md` rules those out
 * because rendering `delacour-react-native-ui` in a browser means React Native's
 * whole runtime; nothing here imports the library. These are `div`s painted with
 * values, the same trick the axis specimens have always used — so what it shows
 * is the tokens, honestly, and not a promise that this is what `Button` renders.
 *
 * Values are inline rather than custom properties on a wrapper. `--radius` is a
 * real variable on this page (`tokens.css` is imported by `app.css`), so a
 * wrapper redefining it would quietly restyle any Tailwind `rounded-*` that ever
 * ended up inside.
 *
 * Both modes are rendered and CSS picks one, for the reason every other specimen
 * here does it: reading the active theme in JavaScript costs a mounted guard and
 * a hydration flash. `BothThemes` is not reused because its wrappers are inline
 * spans, sized for a swatch beside a word rather than for a panel.
 */

const SAMPLE_HEADING = "Ship a theme, not a screenshot";
const SAMPLE_BODY =
	"Every token below comes from the axes above. Copy the file underneath into a project and the components paint from it.";

const CHART_HEIGHTS = [0.45, 0.75, 0.55, 1, 0.65];

function Button({
	mode,
	fonts,
	label,
	background,
	foreground,
	border,
}: {
	mode: ResolvedMode;
	fonts: ResolvedFonts;
	label: string;
	background: string;
	foreground: string;
	border?: string;
}): ReactElement {
	return (
		<span
			className="inline-flex items-center justify-center px-4 font-medium"
			style={{
				background,
				borderRadius: length(mode, "radius-button-md", 10),
				border: border ? `1px solid ${border}` : undefined,
				color: foreground,
				fontFamily: fonts.sans ? fontSpecimen(fonts.sans) : undefined,
				fontSize: length(mode, "text-button-md", 14),
				height: length(mode, "spacing-button-md", 36),
			}}
		>
			{label}
		</span>
	);
}

function Chart({ mode }: { mode: ResolvedMode }): ReactElement {
	return (
		<span className="flex h-12 items-end gap-1.5">
			{CHART_HEIGHTS.map((scale, index) => (
				<span
					className="w-4 rounded-t-sm"
					key={`chart-${index + 1}`}
					style={{ background: swatch(mode, `chart-${index + 1}`), height: `${scale * 100}%` }}
				/>
			))}
		</span>
	);
}

function Surface({ mode, fonts }: { mode: ResolvedMode; fonts: ResolvedFonts }): ReactElement {
	const radius = length(mode, "radius", 10);
	const gutter = length(mode, "spacing-screen-gutter", 16);

	return (
		<div style={{ background: swatch(mode, "background"), borderRadius: radius, padding: gutter }}>
			<div
				className="flex flex-col gap-4"
				style={{
					background: swatch(mode, "card"),
					border: `1px solid ${swatch(mode, "border")}`,
					borderRadius: radius,
					padding: gutter,
				}}
			>
				<div className="flex flex-col gap-1.5">
					<span
						className="font-semibold text-lg"
						style={{
							color: swatch(mode, "card-foreground"),
							fontFamily: fonts.heading ? fontSpecimen(fonts.heading) : undefined,
						}}
					>
						{SAMPLE_HEADING}
					</span>
					<span
						className="text-sm"
						style={{
							color: swatch(mode, "muted-foreground"),
							fontFamily: fonts.sans ? fontSpecimen(fonts.sans) : undefined,
						}}
					>
						{SAMPLE_BODY}
					</span>
				</div>

				<span
					className="flex items-center px-3 text-sm"
					style={{
						background: swatch(mode, "input"),
						border: `1px solid ${swatch(mode, "border")}`,
						borderRadius: length(mode, "radius-button-md", 10),
						color: swatch(mode, "muted-foreground"),
						fontFamily: fonts.sans ? fontSpecimen(fonts.sans) : undefined,
						fontSize: length(mode, "text-input-md", 14),
						height: length(mode, "spacing-input-md", 36),
					}}
				>
					name@example.com
				</span>

				<div className="flex flex-wrap items-center gap-2">
					<Button
						background={swatch(mode, "primary")}
						fonts={fonts}
						foreground={swatch(mode, "primary-foreground")}
						label="Primary"
						mode={mode}
					/>
					<Button
						background={swatch(mode, "secondary")}
						fonts={fonts}
						foreground={swatch(mode, "secondary-foreground")}
						label="Secondary"
						mode={mode}
					/>
					<Button
						background="transparent"
						border={swatch(mode, "border")}
						fonts={fonts}
						foreground={swatch(mode, "foreground")}
						label="Outline"
						mode={mode}
					/>
				</div>

				<Chart mode={mode} />
			</div>
		</div>
	);
}

export function ThemePreview({ config }: { config: DesignSystemConfig }): ReactElement {
	const { light, dark } = resolveTokens(config);
	const fonts = resolveFonts(config);

	return (
		<div className="overflow-hidden rounded-lg border border-fd-border">
			<div className="dark:hidden">
				<Surface fonts={fonts} mode={light} />
			</div>
			<div className="hidden dark:block">
				<Surface fonts={fonts} mode={dark} />
			</div>
		</div>
	);
}
