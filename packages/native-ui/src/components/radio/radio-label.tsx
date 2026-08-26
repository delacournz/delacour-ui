import type { ReactElement } from "react";
import { Text, type TextPresetProps } from "../text";
import { useRadioPart } from "./radio.context";
import { RADIO_LABEL_TEXT_SIZE, radioVariants } from "./radio.variants";

export type RadioLabelProps = TextPresetProps;

/**
 * The radio's text, inside the radio's own tap target.
 *
 * Not a duplicate of `Field.Label`, and the distinction is the point: a
 * `Field.Label` names the whole control from outside it, while this sits *within*
 * one radio's press area, so tapping the word selects that option.
 *
 * Renders `Text.Label` and names a size, never a scale of its own. The weight and
 * the colour belong to the preset — restating them here would be a second
 * definition of `Text.Label` that could drift from it, the rule `Field` is built
 * on. Naming the size is what lets the label still track the radio's own axis,
 * since `Text`'s size axis is built to beat its preset.
 *
 * **It does not redden while invalid.** The ring already carries that, and a
 * `Field.Error` under the group says what is actually wrong; five labels turning
 * red would read as five wrong answers. Disabled needs nothing here either: the
 * `label` slot carries its own `opacity-50`, and the `indicator` slot carries a
 * matching one, so the ring and the label fade together as one control. Neither
 * fade may move to the `root` — see {@link radioVariants}.
 */
export function RadioLabel({ className, size, ...props }: RadioLabelProps): ReactElement {
	const { size: radioSize, variant, isSelected, isInvalid } = useRadioPart("Radio.Label");

	return (
		<Text.Label
			className={radioVariants({ isInvalid, isSelected, size: radioSize, variant }).label({ className })}
			size={size ?? RADIO_LABEL_TEXT_SIZE[radioSize]}
			{...props}
		/>
	);
}
RadioLabel.displayName = "DelacourUI.Radio.Label";
