import type { ReactElement } from "react";
import { Text } from "../text";
import { useTabsPart, useTabsTriggerPart } from "./tabs.context";
import type { TabsLabelProps } from "./tabs.types";
import { TABS_LABEL_TEXT_SIZE, tabsVariants } from "./tabs.variants";

export type { TabsLabelProps };

/**
 * A trigger's text, inside the trigger's own tap target.
 *
 * Renders `Text.Label` and names a size, never a scale of its own — the weight
 * belongs to the preset, and restating it here would be a second definition of
 * `Text.Label` that could drift from it. Naming the size is what lets the label
 * still track the bar's own axis, since `Text`'s size axis is built to beat its
 * preset.
 *
 * The colour *is* a class here, unlike `Radio.Label`'s, and that is deliberate:
 * `primary`'s selected label is drawn on the capsule, so it takes
 * `elevated-foreground`, and `Text`'s colour axis is page-level only with no
 * `-foreground` family — mapping a surface to the content on it is each surface
 * component's own job.
 *
 * **It reads the visual selection, not the settled one.** Halfway through a drag
 * the capsule is already mostly over the next tab, and a label still wearing the
 * unselected token there is dark text on a dark fill. See `resolveVisualIndex`.
 *
 * **`numberOfLines` defaults to one.** A label that wrapped would change the row's
 * height, which changes every measured frame, which moves the indicator — so the
 * bar would reflow around its own longest word. It is an ordinary prop, so
 * `numberOfLines={undefined}` opts out.
 */
export function TabsLabel({ className, size, numberOfLines = 1, ...props }: TabsLabelProps): ReactElement {
	const { size: barSize, variant } = useTabsPart("Tabs.Label");
	const { isVisuallySelected, isDisabled } = useTabsTriggerPart("Tabs.Label");

	return (
		<Text.Label
			className={tabsVariants({ isDisabled, isSelected: isVisuallySelected, size: barSize, variant }).label({
				className,
			})}
			numberOfLines={numberOfLines}
			size={size ?? TABS_LABEL_TEXT_SIZE[barSize]}
			{...props}
		/>
	);
}
TabsLabel.displayName = "DelacourUI.Tabs.Label";
