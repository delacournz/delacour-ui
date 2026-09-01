import { Pressable } from "@delacour/native-ui/pressable";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import { AxisStrip } from "@/components/theme/axis-strip";
import { setAxis, useDesignSystem } from "@/design-system/store";
import { STYLES, type Style } from "@/design-system/styles";

/** The miniature's own height. The specimen inside it is drawn at life size. */
const SPECIMEN_BOX_HEIGHT = 56;
const SPECIMEN_WIDTH = 46;

/**
 * One style, drawn as the shape it makes.
 *
 * A swatch would say nothing here: these eight differ in geometry, not colour,
 * so the tile renders the style's own numbers instead of naming them — the
 * surface corner at its `radius`, and a control inside at its small button
 * height and corner. Lyra's square edges and Rhea's capsule are then a
 * comparison rather than a description, which is the entire reason this is a
 * strip and not a list of words.
 *
 * The specimen is drawn at **life size**, not scaled. A 32pt control next to a
 * 40pt one is the difference the axis actually makes, and halving both would
 * halve the only signal the tile carries.
 *
 * The accent marks the current selection and nothing else on this row, which is
 * the one job it has in a settings surface. An unselected specimen still has to
 * be read, though — the shape is the whole of what the tile says — so it sits
 * well above the hairline weight an inactive control would normally take.
 */
function StyleTile({ style, isSelected }: { style: Style; isSelected: boolean }): ReactElement {
	return (
		<Pressable
			accessibilityLabel={`${style.title}. ${style.description}`}
			className="w-20 gap-2"
			haptic="selection"
			onPress={() => setAxis("style", style.name)}
			testID={`theme-style-${style.name}`}
		>
			<View
				className={`items-center justify-center border bg-muted ${isSelected ? "border-primary" : "border-border"}`}
				style={{ borderRadius: style.geometry.radius, height: SPECIMEN_BOX_HEIGHT }}
			>
				<View
					className={isSelected ? "bg-primary" : "bg-muted-foreground/55"}
					style={{
						borderRadius: style.geometry.radius,
						height: style.geometry["spacing-button-sm"],
						width: SPECIMEN_WIDTH,
					}}
				/>
			</View>
			<Text.Caption color={isSelected ? "default" : "muted"}>{style.title}</Text.Caption>
		</Pressable>
	);
}
StyleTile.displayName = "Playground.Theme.StyleTile";

/**
 * The geometry axis, inline and one tap deep.
 *
 * It was a row that opened a sheet, like the seven axes below it still are, and
 * that was the wrong trade for this one: choosing a style is comparing eight
 * shapes against each other, and a sheet shows them one screen at a time with
 * the app it is restyling hidden behind it. Inline, a tap repaints the whole
 * screen underneath — including the preview further down — so the axis can be
 * walked end to end without anything opening or closing.
 *
 * The description belongs to the selected tile rather than to every tile. Eight
 * captions in a horizontal strip is a wall of type at the size a strip can
 * afford; one below it is legible, and it is the only one that is being read.

 */
export function StyleStrip(): ReactElement {
	const config = useDesignSystem();
	const selected = STYLES.find((style) => style.name === config.style);

	return (
		<AxisStrip
			caption={selected?.description ?? ""}
			label="Style"
			selectedIndex={STYLES.findIndex((style) => style.name === config.style)}
		>
			{STYLES.map((style) => (
				<StyleTile isSelected={style.name === config.style} key={style.name} style={style} />
			))}
		</AxisStrip>
	);
}
StyleStrip.displayName = "Playground.StyleStrip";
