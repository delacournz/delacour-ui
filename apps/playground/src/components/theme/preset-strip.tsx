import { PRESET_SHORTCUTS, type PresetShortcut } from "@delacour/design-system/house";
import { resolveFonts, resolveTokens } from "@delacour/design-system/resolve";
import { Pressable } from "delacour-react-native-ui/pressable";
import { Text } from "delacour-react-native-ui/text";
import { type ReactElement, useMemo } from "react";
import { View } from "react-native";
import { AxisStrip } from "@/components/theme/axis-strip";
import { paintable } from "@/components/theme/previews";
import { useAxisPreview } from "@/components/theme/use-axis-preview";
import { resetConfig, useDesignSystem } from "@/design-system/store";
import { configEquals, type ResetTarget } from "@/design-system/store.pure";

/** The specimen box, matching the axis strips so the rows share a rhythm. */
const SPECIMEN_HEIGHT = 56;
/** How wide a preset tile is — `w-28`, wider than an axis tile, because it shows a whole theme. */
const TILE_WIDTH = 112;

type Specimen = {
	preset: PresetShortcut;
	target: ResetTarget;
	card: string | undefined;
	border: string | undefined;
	primary: string | undefined;
	foreground: string | undefined;
	mutedForeground: string | undefined;
	radius: number;
	headingFamily: string | undefined;
};

/** The reset target a preset shortcut lands on. Named here so the store never learns preset names. */
function targetFor(preset: PresetShortcut): ResetTarget {
	return preset.name === "library" ? "library" : "house";
}

/**
 * One preset, drawn as the whole theme it is.
 *
 * Every other strip on this screen varies one axis and draws only that axis's
 * work. A preset writes all seven at once, so its tile has to be a miniature
 * of the app: a surface at the preset's `card` and corner, edged in its
 * `border`, a line of type in its heading face, and one control filled with
 * its `primary`. That is enough for the two presets on offer to be told apart
 * at a glance — the house is a warm amber pill on near-black, the library is
 * a neutral one on grey — and enough that a third, if one is ever added,
 * would say what it changes without a caption.
 *
 * The specimen is resolved from the preset's own config, never from the live
 * theme with one axis swapped, because a preset is not a delta from what is on
 * screen — it replaces it.
 */
function PresetTile({ specimen, isSelected }: { specimen: Specimen; isSelected: boolean }): ReactElement {
	const { preset, target } = specimen;

	return (
		<Pressable
			accessibilityHint={`Replaces every axis with ${preset.title}`}
			accessibilityLabel={`${preset.title}. ${preset.blurb}`}
			accessibilityState={{ selected: isSelected }}
			className="w-28 gap-2"
			haptic="selection"
			onPress={() => resetConfig(target)}
			testID={`theme-preset-${preset.name}`}
		>
			<View
				className="justify-between border px-3 py-2.5"
				style={{
					backgroundColor: specimen.card,
					borderColor: isSelected ? specimen.primary : specimen.border,
					borderRadius: specimen.radius,
					height: SPECIMEN_HEIGHT,
				}}
			>
				<Text
					className="text-sm"
					numberOfLines={1}
					style={{
						color: specimen.foreground,
						fontFamily: specimen.headingFamily,
						fontWeight: "600",
					}}
				>
					Aa
				</Text>
				<View className="flex-row items-center gap-1.5">
					<View className="h-1.5 w-8 rounded-full" style={{ backgroundColor: specimen.primary }} />
					<View className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: specimen.mutedForeground }} />
				</View>
			</View>
			<Text.Caption color={isSelected ? "default" : "muted"}>{preset.title}</Text.Caption>
		</Pressable>
	);
}
PresetTile.displayName = "Playground.Theme.PresetTile";

/**
 * The presets both customisers offer, as one-tap starting points.
 *
 * It sits first on the Design tab because it is the coarsest control on the
 * screen: every strip below it changes one axis, this replaces all seven. It
 * is also the app's reset. The house is what a fresh install opens in and the
 * library default is what `delacour init` ships, so "back to the start" is a
 * choice between two starts rather than one button — and a tile that shows
 * which one is applied is a better reset than a ghost button at the bottom of
 * a scroll that says nothing about where it lands.
 *
 * The list is `PRESET_SHORTCUTS` from the design system, shared with the
 * documentation site's presets row, so the two cannot drift.
 *
 * No tile is marked while the theme is hand-built: a preset is a whole config,
 * and one changed axis is no longer it.
 */
export function PresetStrip(): ReactElement {
	const config = useDesignSystem();
	const { mode } = useAxisPreview();

	const specimens = useMemo<Specimen[]>(
		() =>
			PRESET_SHORTCUTS.map((preset) => {
				const values = resolveTokens(preset.config)[mode];
				const radius = Number(values.radius);

				return {
					preset,
					target: targetFor(preset),
					card: paintable(values.card),
					border: paintable(values.border),
					primary: paintable(values.primary),
					foreground: paintable(values.foreground),
					mutedForeground: paintable(values["muted-foreground"]),
					radius: Number.isFinite(radius) ? radius : 0,
					headingFamily: resolveFonts(preset.config).heading,
				};
			}),
		[mode]
	);

	const selectedIndex = specimens.findIndex((specimen) => configEquals(config, specimen.preset.config));

	return (
		<AxisStrip itemWidth={TILE_WIDTH} label="Presets" selectedIndex={selectedIndex}>
			{specimens.map((specimen, index) => (
				<PresetTile isSelected={index === selectedIndex} key={specimen.preset.name} specimen={specimen} />
			))}
		</AxisStrip>
	);
}
PresetStrip.displayName = "Playground.PresetStrip";
