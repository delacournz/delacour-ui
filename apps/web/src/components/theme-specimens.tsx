import type { DesignSystemConfig } from "@delacour/design-system/config";
import { type ResolvedMode, resolveTokens } from "@delacour/design-system/resolve";
import type { ReactElement } from "react";

/**
 * What an axis looks like, drawn rather than named.
 *
 * One file because two surfaces draw the same things: the builder's option tiles
 * and the axis summary underneath them. A second `Disc` that resolved its colour
 * even slightly differently would put a swatch on the tile that does not match
 * the swatch on the row it sets — which is precisely the comparison someone is
 * making when they look at both at once.
 *
 * Every specimen here takes a whole `DesignSystemConfig` and resolves it, never
 * an option's own values. A base colour's `primary` is not what `primary` becomes
 * once an accent is spread over it, so a tile painted from the option in
 * isolation promises a colour the click does not deliver.
 *
 * Nothing here imports `delacour-react-native-ui`. These are `div`s wearing
 * resolved values, which is a different thing from the live component previews
 * `AGENTS.md` rules out — those would need React Native's runtime in a browser.
 */

/** A colour value from the resolved palette, for a specimen that draws it directly. */
export function swatch(mode: ResolvedMode, token: string): string {
	return String(mode[token] ?? "transparent");
}

/** A geometry value, in px, for a specimen drawing the Style axis at life size. */
export function length(mode: ResolvedMode, token: string, fallback: number): number {
	const value = mode[token];
	return typeof value === "number" ? value : fallback;
}

/**
 * A specimen drawn in both themes at once, with CSS choosing.
 *
 * The page follows the reader's own light/dark, and a light-ramp swatch on a
 * dark page is worse than no swatch — but a hook that reads the active theme
 * costs a mounted guard and a hydration flash. Rendering both and hiding one is
 * what `apps/web` already does for captured media, for the same reason.
 */
export function BothThemes({ light, dark }: { light: ReactElement; dark: ReactElement }): ReactElement {
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

const CHART_HEIGHTS = [10, 16, 12, 20, 14];

function Charts({ mode }: { mode: ResolvedMode }): ReactElement {
	return (
		<span className="flex h-5 items-end gap-0.5">
			{CHART_HEIGHTS.map((height, index) => (
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

/** The accent, as the one disc the Theme axis moves. */
export function PrimarySpecimen({ config }: { config: DesignSystemConfig }): ReactElement {
	const { light, dark } = resolveTokens(config);

	return (
		<BothThemes dark={<Disc color={swatch(dark, "primary")} />} light={<Disc color={swatch(light, "primary")} />} />
	);
}

/** The five chart hues, which are the only thing the Chart Color axis moves. */
export function ChartsSpecimen({ config }: { config: DesignSystemConfig }): ReactElement {
	const { light, dark } = resolveTokens(config);

	return <BothThemes dark={<Charts mode={dark} />} light={<Charts mode={light} />} />;
}

/** A card on the page, which is what a base colour actually decides. */
export function SurfaceSpecimen({ config }: { config: DesignSystemConfig }): ReactElement {
	const { light, dark } = resolveTokens(config);

	return <BothThemes dark={<Surface mode={dark} />} light={<Surface mode={light} />} />;
}

/**
 * The corner, resolved rather than read off the axis.
 *
 * `default` carries no value of its own — it means "whatever the style chose" —
 * so the only honest way to draw this row is to resolve the whole configuration
 * and read `--radius` back out of it.
 */
export function CornerSpecimen({ config }: { config: DesignSystemConfig }): ReactElement {
	const { light } = resolveTokens(config);

	return (
		<span
			className="block size-5 border border-fd-foreground/40"
			style={{ borderRadius: length(light, "radius", 10) }}
		/>
	);
}

/** The miniature's own height. The control inside it is drawn at life size. */
const STYLE_BOX_HEIGHT = 44;

/**
 * A style, drawn as the shape it makes.
 *
 * A swatch would say nothing here: the eight styles differ in geometry, not
 * colour. So the tile renders the style's own numbers instead of naming them —
 * the surface at its `radius`, a control inside at its small button height and
 * corner — and Lyra's square edges next to Rhea's capsule become a comparison
 * rather than a description. Ported from the playground's `StyleTile`, which
 * makes the same argument at the same life size: halving a 32pt control and a
 * 40pt one halves the only signal the tile carries.
 *
 * It resolves the option's whole config, which means an explicit Radius flattens
 * every tile's corner to the same value — because that is what an explicit Radius
 * does. Drawing `style.geometry.radius` instead would show eight corners the page
 * would not actually take.
 */
export function StyleSpecimen({
	config,
	isSelected,
}: {
	config: DesignSystemConfig;
	isSelected: boolean;
}): ReactElement {
	const { light } = resolveTokens(config);
	const radius = length(light, "radius", 10);

	return (
		<span
			className="flex items-center justify-center border border-fd-border bg-fd-muted"
			style={{ borderRadius: radius, height: STYLE_BOX_HEIGHT, width: "100%" }}
		>
			<span
				className={isSelected ? "bg-fd-primary" : "bg-fd-muted-foreground/55"}
				style={{
					borderRadius: length(light, "radius-button-sm", radius),
					height: length(light, "spacing-button-sm", 32),
					width: "60%",
				}}
			/>
		</span>
	);
}
