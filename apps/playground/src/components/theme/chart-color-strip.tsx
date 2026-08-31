import { Pressable } from "@delacour/native-ui/pressable";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import { AxisStrip } from "@/components/theme/axis-strip";
import { CHART_TOKENS, paintable } from "@/components/theme/previews";
import { usePaletteOptions } from "@/components/theme/use-palette-options";
import type { PaletteName } from "@/design-system/config";
import type { ResolvedMode } from "@/design-system/resolve";
import { setAxis, useDesignSystem } from "@/design-system/store";

/** The box the bars stand in, matching the Base Color tile so the rows share a rhythm. */
const SPECIMEN_HEIGHT = 56;
/**
 * A fixed silhouette, so five palettes differ by hue and never by shape.
 *
 * Varying the heights per palette would read as data and invite a comparison
 * between two things that carry none.
 */
const BAR_SCALE = [0.5, 0.85, 0.35, 1, 0.65] as const;

/**
 * One chart palette, drawn as the five hues it actually writes.
 *
 * The box is chrome rather than a specimen — it is the live theme's `muted`,
 * and only the bars belong to the candidate — so its edge is a pair of classes
 * like Style's and Radius's. Base Color has to paint its border inline instead,
 * because there the box itself is the candidate's surface.
 *
 * Deliberately not Theme's single disc, even though the two strips offer the
 * identical list. This axis writes `--chart-1` through `--chart-5` and nothing
 * else, so a disc would show a colour it does not set and hide the four it
 * does — and the two strips would be indistinguishable sitting one above the
 * other. Five bars is also the shape the tokens are for.
 */
function ChartColorTile({
	name,
	title,
	values,
	isSelected,
}: {
	name: PaletteName;
	title: string;
	values: ResolvedMode;
	isSelected: boolean;
}): ReactElement {
	return (
		<Pressable
			accessibilityLabel={title}
			className="w-20 gap-2"
			haptic="selection"
			onPress={() => setAxis("chartColor", name)}
			testID={`theme-chart-color-${name}`}
		>
			<View
				className={`flex-row items-end justify-center gap-1 rounded-lg border bg-muted px-2 pb-2 ${isSelected ? "border-primary" : "border-border"}`}
				style={{ height: SPECIMEN_HEIGHT }}
			>
				{CHART_TOKENS.map((token, index) => (
					<View
						className="flex-1 rounded-full"
						key={token}
						style={{
							backgroundColor: paintable(values[token]),
							height: (SPECIMEN_HEIGHT - 16) * BAR_SCALE[index],
						}}
					/>
				))}
			</View>
			<Text.Caption color={isSelected ? "default" : "muted"}>{title}</Text.Caption>
		</Pressable>
	);
}
ChartColorTile.displayName = "Playground.Theme.ChartColorTile";

/** The same list Theme offers, taken for its five chart slots only. */
export function ChartColorStrip(): ReactElement {
	const config = useDesignSystem();
	const options = usePaletteOptions("chartColor");

	return (
		<AxisStrip label="Chart Color" selectedIndex={options.findIndex((option) => option.name === config.chartColor)}>
			{options.map((option) => (
				<ChartColorTile
					isSelected={option.name === config.chartColor}
					key={option.name}
					name={option.name}
					title={option.title}
					values={option.values}
				/>
			))}
		</AxisStrip>
	);
}
ChartColorStrip.displayName = "Playground.ChartColorStrip";
