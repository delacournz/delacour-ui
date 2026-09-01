import { BASE_COLORS, type BaseColorName } from "@delacour/design-system/base-colors";
import { Pressable } from "@delacour/native-ui/pressable";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useMemo } from "react";
import { View } from "react-native";
import { AxisStrip } from "@/components/theme/axis-strip";
import { paintable } from "@/components/theme/previews";
import { useAxisPreview } from "@/components/theme/use-axis-preview";
import { setAxis } from "@/design-system/store";

/** The specimen box, matching the Style strip's so the two rows share a rhythm. */
const SPECIMEN_HEIGHT = 56;

type Specimen = {
	name: BaseColorName;
	title: string;
	card: string | undefined;
	border: string | undefined;
	foreground: string | undefined;
	mutedForeground: string | undefined;
};

/**
 * One neutral, drawn as the surface it makes.
 *
 * A disc is the wrong specimen for this axis, and it is worth saying why: seven
 * neutrals are seven near-blacks in dark and seven near-whites in light, so
 * seven discs would be one disc repeated. What separates stone from zinc from
 * olive is the *tint* carried across a surface and the type on it — which needs
 * area to be visible at all, and two foreground weights to be comparable.
 *
 * So the tile is a miniature of the thing a ramp is for: an elevated surface at
 * `card`, edged in `border`, carrying a `foreground` bar and a
 * `muted-foreground` one. At tile size those two bars are where a warm ramp
 * separates from a cool one.
 */
function BaseColorTile({
	specimen,
	isSelected,
	selectedBorderColor,
}: {
	specimen: Specimen;
	isSelected: boolean;
	/** The live `primary`, already painted. See the border note in the strip below. */
	selectedBorderColor: string | undefined;
}): ReactElement {
	return (
		<Pressable
			accessibilityLabel={specimen.title}
			className="w-20 gap-2"
			haptic="selection"
			onPress={() => setAxis("baseColor", specimen.name)}
			testID={`theme-base-color-${specimen.name}`}
		>
			<View
				className="justify-center gap-1.5 rounded-lg border px-2.5"
				style={{
					backgroundColor: specimen.card,
					borderColor: isSelected ? selectedBorderColor : specimen.border,
					height: SPECIMEN_HEIGHT,
				}}
			>
				<View className="h-1.5 w-full rounded-full" style={{ backgroundColor: specimen.foreground }} />
				<View className="h-1.5 w-2/3 rounded-full" style={{ backgroundColor: specimen.mutedForeground }} />
			</View>
			<Text.Caption color={isSelected ? "default" : "muted"}>{specimen.title}</Text.Caption>
		</Pressable>
	);
}
BaseColorTile.displayName = "Playground.Theme.BaseColorTile";

/**
 * The seven neutral ramps, each showing the surface and the type it would give you.
 *
 * The selected tile's border is painted inline rather than set with a
 * `border-primary` class, because every other edge on this tile is already an
 * inline colour — the candidate's own `border` token — and an inline
 * `borderColor` of `undefined` sitting beside the class wins and erases it. One
 * writer for the property, as the sheet's scroll inset has one writer for the
 * bottom padding.
 */
export function BaseColorStrip(): ReactElement {
	const { config, preview, resolved } = useAxisPreview();

	const specimens = useMemo(
		() =>
			BASE_COLORS.map((base) => {
				const values = preview({ baseColor: base.name });
				return {
					border: paintable(values.border),
					card: paintable(values.card),
					foreground: paintable(values.foreground),
					mutedForeground: paintable(values["muted-foreground"]),
					name: base.name,
					title: base.title,
				};
			}),
		[preview]
	);

	return (
		<AxisStrip label="Base Color" selectedIndex={specimens.findIndex((specimen) => specimen.name === config.baseColor)}>
			{specimens.map((specimen) => (
				<BaseColorTile
					isSelected={specimen.name === config.baseColor}
					key={specimen.name}
					selectedBorderColor={paintable(resolved.primary)}
					specimen={specimen}
				/>
			))}
		</AxisStrip>
	);
}
BaseColorStrip.displayName = "Playground.BaseColorStrip";
