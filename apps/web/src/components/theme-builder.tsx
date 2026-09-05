import type { DesignSystemConfig } from "@delacour/design-system/config";
import { fontByName } from "@delacour/design-system/fonts";
import { styleByName } from "@delacour/design-system/styles";
import { Link } from "@tanstack/react-router";
import type { ReactElement, ReactNode } from "react";
import {
	ChartsSpecimen,
	CornerSpecimen,
	PrimarySpecimen,
	StyleSpecimen,
	SurfaceSpecimen,
} from "@/components/theme-specimens";
import { fontSpecimen } from "@/lib/google-fonts";
import { AXIS_LABELS, type AxisOption, axisOptions, fontOptionGroups, inheritOption } from "@/lib/theme-preset";

/**
 * The customizer, as seven rows of links.
 *
 * **There is no state in this file.** Every option is a `<Link>` to this same
 * route carrying the code for the configuration that option would produce, so
 * the whole control surface is a pure function of `?preset=`. That is not a
 * stylistic choice — it is what keeps the three claims `apps/web/AGENTS.md`
 * makes about this route true once it became interactive: the emit below stays
 * on the server and in the first paint, the page still works with JavaScript
 * off, and every intermediate state is a URL someone can share or bookmark.
 * Back and forward then walk the edit history for nothing.
 *
 * Grids, where the playground uses horizontal strips. A strip exists because a
 * phone has one screen-width to spend; a laptop can show all eighteen accents at
 * once, and seeing them at once is the comparison the axis is asking for. The
 * two font axes are the exception at twenty-six and twenty-seven options, and
 * are capped and scrolled rather than allowed to become the page.
 *
 * One component per *kind* of axis rather than one component with a switch, so
 * each stays under Biome's cognitive-complexity cap — the same split the
 * playground's strips make.
 */

const TILE =
	"flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2 text-center text-xs transition-colors hover:bg-fd-accent";
const TILE_SELECTED = "border-fd-primary ring-1 ring-fd-primary";
const TILE_IDLE = "border-fd-border";

/** A row's frame: its name, the options, and an optional line describing the current one. */
function Axis({ label, caption, children }: { label: string; caption?: string; children: ReactNode }): ReactElement {
	return (
		<div className="flex flex-col gap-2">
			<h3 className="font-medium text-fd-muted-foreground text-xs uppercase tracking-wide">{label}</h3>
			{children}
			{caption ? <p className="text-fd-muted-foreground text-xs">{caption}</p> : null}
		</div>
	);
}

/**
 * One option, as somewhere to go.
 *
 * `aria-current` is set from the code in the URL rather than from anything the
 * client works out, so a screen reader and the ring agree in the server HTML —
 * and the tile is a link rather than a button so it survives with scripting off.
 */
function OptionLink({
	option,
	className,
	children,
}: {
	option: AxisOption;
	className?: string;
	children: ReactNode;
}): ReactElement {
	return (
		<Link
			aria-current={option.isSelected ? "true" : undefined}
			className={`${className ?? TILE} ${option.isSelected ? TILE_SELECTED : TILE_IDLE}`}
			search={{ preset: option.code }}
			to="/theme"
		>
			{children}
		</Link>
	);
}

/** Geometry, drawn at life size — eight shapes to compare rather than eight words. */
function StyleAxis({ config }: { config: DesignSystemConfig }): ReactElement {
	const options = axisOptions(config, "style");
	const selected = styleByName(config.style);

	return (
		<Axis caption={selected?.description} label={AXIS_LABELS.style}>
			<div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
				{options.map((option) => (
					<OptionLink key={option.value} option={option}>
						<StyleSpecimen config={option.config} isSelected={option.isSelected} />
						<span>{option.title}</span>
					</OptionLink>
				))}
			</div>
		</Axis>
	);
}

/**
 * The corner, and the whole configuration behind each one.
 *
 * `Default` carries no value of its own — it means "whatever the style chose" —
 * so its tile has to be resolved rather than drawn from the axis, and it changes
 * shape when the Style row above it moves.
 */
function RadiusAxis({ config }: { config: DesignSystemConfig }): ReactElement {
	return (
		<Axis label={AXIS_LABELS.radius}>
			<div className="flex flex-wrap gap-2">
				{axisOptions(config, "radius").map((option) => (
					<OptionLink className={`${TILE} w-20`} key={option.value} option={option}>
						<CornerSpecimen config={option.config} />
						<span>{option.title}</span>
					</OptionLink>
				))}
			</div>
		</Axis>
	);
}

/** The page itself: seven greys, each drawn as the card it makes. */
function BaseColorAxis({ config }: { config: DesignSystemConfig }): ReactElement {
	return (
		<Axis
			caption="Changing this re-homes an accent that was the old base colour, the way the picker does on a device."
			label={AXIS_LABELS.baseColor}
		>
			<div className="flex flex-wrap gap-2">
				{axisOptions(config, "baseColor").map((option) => (
					<OptionLink className={`${TILE} w-20`} key={option.value} option={option}>
						<SurfaceSpecimen config={option.config} />
						<span>{option.title}</span>
					</OptionLink>
				))}
			</div>
		</Axis>
	);
}

/**
 * Theme and Chart Color, which range over the same eighteen palettes.
 *
 * They differ only in which key they write and which tokens their specimen
 * draws, which is why this is one component with a prop rather than two files —
 * the same argument `usePaletteOptions` makes in the playground.
 */
function PaletteAxis({ config, axis }: { config: DesignSystemConfig; axis: "theme" | "chartColor" }): ReactElement {
	return (
		<Axis label={AXIS_LABELS[axis]}>
			<div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
				{axisOptions(config, axis).map((option) => (
					<OptionLink key={option.value} option={option}>
						{axis === "theme" ? <PrimarySpecimen config={option.config} /> : <ChartsSpecimen config={option.config} />}
						<span>{option.title}</span>
					</OptionLink>
				))}
			</div>
		</Axis>
	);
}

/** A family, set in itself. `Ag` rather than the name, so the webfont stays two glyphs. */
function FontTile({ option }: { option: AxisOption }): ReactElement {
	const family = fontByName(option.value)?.family;

	return (
		<OptionLink className={`${TILE} w-24`} option={option}>
			<span className="text-lg leading-none" style={family ? { fontFamily: fontSpecimen(family) } : undefined}>
				Ag
			</span>
			<span className="truncate w-full">{option.title}</span>
		</OptionLink>
	);
}

/**
 * Twenty-six families, on their three rails.
 *
 * The group is the first thing anyone picking a typeface decides, so Sans, Mono
 * and Serif are headings rather than a flat wall — and `Inherit` sits above all
 * three, because it belongs to none of them and is the Heading axis's way of
 * saying "no separate decision".
 *
 * Uncapped, unlike an obvious first instinct to put twenty-six tiles in a
 * scroller. A scroll area inside a scrolling page is a nested gesture, and it
 * would contradict the one thing the grids are for: every option visible, so the
 * axis is a comparison rather than a search.
 */
function FontAxis({ config, axis }: { config: DesignSystemConfig; axis: "font" | "fontHeading" }): ReactElement {
	const inherit = axis === "fontHeading" ? inheritOption(config) : undefined;

	return (
		<Axis label={AXIS_LABELS[axis]}>
			{inherit ? (
				<OptionLink className={`${TILE} w-fit flex-row items-center px-3`} option={inherit}>
					<span>Inherit — follows the body font</span>
				</OptionLink>
			) : null}
			<div className="rounded-lg border border-fd-border p-3">
				{fontOptionGroups(config, axis).map((group) => (
					<div className="mb-3 flex flex-col gap-2 last:mb-0" key={group.type}>
						<h4 className="font-medium text-fd-muted-foreground text-xs">{group.label}</h4>
						<div className="flex flex-wrap gap-2">
							{group.options.map((option) => (
								<FontTile key={option.value} option={option} />
							))}
						</div>
					</div>
				))}
			</div>
		</Axis>
	);
}

export function ThemeBuilder({ config }: { config: DesignSystemConfig }): ReactElement {
	return (
		<div className="flex flex-col gap-6">
			<StyleAxis config={config} />
			<RadiusAxis config={config} />
			<BaseColorAxis config={config} />
			<PaletteAxis axis="theme" config={config} />
			<PaletteAxis axis="chartColor" config={config} />
			<FontAxis axis="fontHeading" config={config} />
			<FontAxis axis="font" config={config} />
		</div>
	);
}

/**
 * Back to the defaults, as the one link with no code on it.
 *
 * `/theme` with no `?preset=` is `DEFAULT_CONFIG`, which is exactly what the
 * library ships — so reset is a plain link to this route rather than a control
 * that has to know what "default" means a second time.
 */
export function ResetThemeLink(): ReactElement {
	return (
		<Link
			className="rounded-md border border-fd-border px-3 py-1.5 font-medium text-sm transition-colors hover:bg-fd-accent"
			search={{}}
			to="/theme"
		>
			Reset
		</Link>
	);
}
