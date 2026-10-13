import type { ReactElement } from "react";
import { View } from "react-native";
import { IconCircleX } from "../../icons/central";
import { Icon } from "../icon";
import { INPUT_DECORATOR_ICON_TOKEN } from "../input/input.variants";
import { Pressable } from "../pressable";
import { Text } from "../text";
import { useTagInputPart } from "./tag-input.context";
import { resolveCounterText } from "./tag-input.logic";
import { resolveTagInputClearIconClass, resolveTagInputCounterColor, tagInputVariants } from "./tag-input.variants";

/** Hit slop for the clear glyph — it is 16–20 points, and its slop reaches only the box's own padding. */
const CLEAR_HIT_SLOP = 10;

export type TagInputSuffixProps = {
	isClearable: boolean;
	showCount: boolean;
	clearAccessibilityLabel: string;
};

/**
 * The trailing end of the box: a tag counter and a clear-all control.
 *
 * Sits at the end of the last row, a chip's height tall, so it lines up with
 * the tags beside it however many rows they wrap to. The counter reads `3/10`
 * with a `max` and turns destructive past it; the clear control appears only
 * while there is something to clear and the field can be edited. Renders
 * nothing when neither is on.
 */
export function TagInputSuffix({
	isClearable,
	showCount,
	clearAccessibilityLabel,
}: TagInputSuffixProps): ReactElement | null {
	const context = useTagInputPart("TagInput.Suffix");
	const canClear =
		isClearable && !context.isDisabled && !context.isReadOnly && (context.tags.length > 0 || context.draft.length > 0);

	if (!showCount && !canClear) return null;

	const slots = tagInputVariants({ size: context.size });

	return (
		<View className={slots.suffix()}>
			{showCount ? (
				<Text.Caption
					className={slots.counter()}
					color={resolveTagInputCounterColor(context.isOverflowing)}
					testID={context.testID ? `${context.testID}-count` : undefined}
				>
					{resolveCounterText(context.tags.length, context.max)}
				</Text.Caption>
			) : null}
			{canClear ? (
				<Pressable
					accessibilityLabel={clearAccessibilityLabel}
					accessibilityRole="button"
					className={slots.clear()}
					feedback="fade"
					haptic="light"
					hitSlop={CLEAR_HIT_SLOP}
					onPress={context.clear}
					testID={context.testID ? `${context.testID}-clear` : undefined}
				>
					<Icon
						className={resolveTagInputClearIconClass(context.size)}
						color={INPUT_DECORATOR_ICON_TOKEN}
						icon={IconCircleX}
					/>
				</Pressable>
			) : null}
		</View>
	);
}
TagInputSuffix.displayName = "DelacourUI.TagInput.Suffix";
