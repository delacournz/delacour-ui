import type { PaletteName } from "@delacour/design-system/config";
import { Pressable } from "@delacour/native-ui/pressable";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import { AxisStrip } from "@/components/theme/axis-strip";
import { paintable } from "@/components/theme/previews";
import { usePaletteOptions } from "@/components/theme/use-palette-options";
import { setAxis, useDesignSystem } from "@/design-system/store";

/**
 * One accent, drawn as the single colour it is.
 *
 * The disc that would have been wrong for Base Color is exactly right here: an
 * accent writes one hue across `primary`, the five chart slots and the sidebar,
 * and every one of those is the same colour. Drawing a surface for it would be
 * drawing the base ramp underneath, which this axis does not touch.
 *
 * The ring is a separate circle rather than a border on the swatch, so the
 * selected hue keeps its full diameter instead of losing two points to its own
 * marker — eighteen discs read as a row of sizes otherwise.
 */
function ThemeTile({
	name,
	title,
	color,
	isSelected,
}: {
	name: PaletteName;
	title: string;
	color: string | undefined;
	isSelected: boolean;
}): ReactElement {
	return (
		<Pressable
			accessibilityLabel={title}
			className="w-16 items-center gap-2"
			haptic="selection"
			onPress={() => setAxis("theme", name)}
			testID={`theme-accent-${name}`}
		>
			<View
				className={`size-14 items-center justify-center rounded-full border-2 ${isSelected ? "border-primary" : "border-transparent"}`}
			>
				<View className="size-11 rounded-full" style={{ backgroundColor: color }} />
			</View>
			<Text.Caption color={isSelected ? "default" : "muted"}>{title}</Text.Caption>
		</Pressable>
	);
}
ThemeTile.displayName = "Playground.Theme.ThemeTile";

/** The base colour itself, then every accent that can be spread over it. */
export function ThemeStrip(): ReactElement {
	const config = useDesignSystem();
	const options = usePaletteOptions("theme");

	return (
		<AxisStrip itemWidth={64} label="Theme" selectedIndex={options.findIndex((option) => option.name === config.theme)}>
			{options.map((option) => (
				<ThemeTile
					color={paintable(option.values.primary)}
					isSelected={option.name === config.theme}
					key={option.name}
					name={option.name}
					title={option.title}
				/>
			))}
		</AxisStrip>
	);
}
ThemeStrip.displayName = "Playground.ThemeStrip";
