import type { PresetShortcut } from "@delacour/design-system/house";
import { type ResolvedMode, resolveFonts, resolveTokens } from "@delacour/design-system/resolve";
import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { THEME_TEASER_COPY } from "@/components/landing/copy";
import { ARROW_LINK } from "@/components/landing/pill";
import { Reveal } from "@/components/landing/reveal";
import { SectionHeading } from "@/components/landing/section-heading";
import { PAGE_SECTION } from "@/components/section";
import { length, swatch } from "@/components/theme-specimens";
import { fontSpecimen } from "@/lib/google-fonts";
import { PRESETS } from "@/lib/theme-preset";

/**
 * A real `/theme` moment on the landing page: four presets, each drawn in its
 * own resolved tokens — its page, its card, its primary, its heading face —
 * and each a link to the customiser with that code in the URL.
 *
 * Painted inline from `resolveTokens`, the way `theme-preview.tsx` paints its
 * mock interface, and rendered in both modes with CSS choosing, the way every
 * specimen on `/theme` does. Nothing here is a live component.
 */
export function ThemeTeaser(): ReactElement {
	return (
		<Reveal className={`${PAGE_SECTION} py-section`}>
			<SectionHeading eyebrow={THEME_TEASER_COPY.eyebrow} title={THEME_TEASER_COPY.title}>
				{THEME_TEASER_COPY.body}
			</SectionHeading>
			<ul className="mt-section-gap grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{PRESETS.map((preset) => (
					<li key={preset.name}>
						<PresetChip preset={preset} />
					</li>
				))}
			</ul>
			<Link className={`${ARROW_LINK} mt-8`} search={{}} to="/theme">
				{THEME_TEASER_COPY.link}
			</Link>
		</Reveal>
	);
}

function PresetChip({ preset }: { preset: PresetShortcut }): ReactElement {
	const { light, dark } = resolveTokens(preset.config);
	const fonts = resolveFonts(preset.config);

	return (
		<Link
			className="group/chip block rounded-card border border-fd-border transition-colors hover:border-fd-primary/50"
			search={{ preset: preset.code }}
			to="/theme"
		>
			<span className="block dark:hidden">
				<Swatch fonts={fonts} mode={light} preset={preset} />
			</span>
			<span className="hidden dark:block">
				<Swatch fonts={fonts} mode={dark} preset={preset} />
			</span>
		</Link>
	);
}

/** The preset, as the corner of a screen: page, card, a heading in its face, a primary pill. */
function Swatch({
	preset,
	mode,
	fonts,
}: {
	preset: PresetShortcut;
	mode: ResolvedMode;
	fonts: { sans?: string; heading?: string };
}): ReactElement {
	const radius = length(mode, "radius", 8);

	return (
		<span
			className="flex flex-col gap-3 rounded-[inherit] p-3"
			style={{ background: swatch(mode, "background"), color: swatch(mode, "foreground") }}
		>
			<span
				className="flex items-center justify-between gap-3 px-3 py-2.5"
				style={{
					background: swatch(mode, "card"),
					border: `1px solid ${swatch(mode, "border")}`,
					borderRadius: radius,
				}}
			>
				<span
					className="font-semibold text-sm"
					style={{ fontFamily: fonts.heading ? fontSpecimen(fonts.heading) : undefined }}
				>
					{preset.title}
				</span>
				<span
					className="h-6 w-10"
					style={{
						background: swatch(mode, "primary"),
						borderRadius: length(mode, "radius-button-sm", radius),
					}}
				/>
			</span>
			<span
				className="px-1 text-xs"
				style={{
					color: swatch(mode, "muted-foreground"),
					fontFamily: fonts.sans ? fontSpecimen(fonts.sans) : undefined,
				}}
			>
				{preset.blurb}
			</span>
		</span>
	);
}
