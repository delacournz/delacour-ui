import { RADII, type RadiusName } from "@delacour/design-system/radii";
import { styleByName } from "@delacour/design-system/styles";
import { Pressable } from "@delacour/native-ui/pressable";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import { AxisStrip } from "@/components/theme/axis-strip";
import { setAxis, useDesignSystem } from "@/design-system/store";

const SPECIMEN_HEIGHT = 56;

/**
 * One corner, at the size it would actually draw.
 *
 * The whole axis is a single number, so the specimen is the shape itself rather
 * than a shape with something inside it — an outlined box at the candidate's
 * radius, and nothing else to read. Radius writes `--radius` and touches no
 * other token, so anything else in the tile would be describing a different
 * axis's work.
 *
 * `default` has no number of its own and resolves to whatever Style chose,
 * which is why this strip sits directly under Style's: the first tile only
 * means anything against the row above it.
 */
function RadiusTile({
	name,
	title,
	radius,
	isSelected,
}: {
	name: RadiusName;
	title: string;
	radius: number;
	isSelected: boolean;
}): ReactElement {
	return (
		<Pressable
			accessibilityLabel={title}
			className="w-20 gap-2"
			haptic="selection"
			onPress={() => setAxis("radius", name)}
			testID={`theme-radius-${name}`}
		>
			<View
				className={`border-2 bg-muted ${isSelected ? "border-primary" : "border-border"}`}
				style={{ borderRadius: radius, height: SPECIMEN_HEIGHT }}
			/>
			<Text.Caption color={isSelected ? "default" : "muted"}>{title}</Text.Caption>
		</Pressable>
	);
}
RadiusTile.displayName = "Playground.Theme.RadiusTile";

/** The five corners, the first of them borrowed from the current style. */
export function RadiusStrip(): ReactElement {
	const config = useDesignSystem();
	const styleRadius = styleByName(config.style)?.geometry.radius ?? 0;

	return (
		<AxisStrip label="Radius" selectedIndex={RADII.findIndex((candidate) => candidate.name === config.radius)}>
			{RADII.map((candidate) => (
				<RadiusTile
					isSelected={candidate.name === config.radius}
					key={candidate.name}
					name={candidate.name}
					radius={candidate.value ?? styleRadius}
					title={candidate.title}
				/>
			))}
		</AxisStrip>
	);
}
RadiusStrip.displayName = "Playground.RadiusStrip";
