import type { ReactElement, ReactNode } from "react";
import type { AccessibilityActionEvent } from "react-native";
import Animated, { FadeOut, LinearTransition, ZoomIn } from "react-native-reanimated";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { Chip } from "../chip";
import { useTagInputPart } from "./tag-input.context";
import type { TagInputTagState } from "./tag-input.types";
import { resolveTagInputChip } from "./tag-input.variants";

const LAYOUT = LinearTransition.duration(150);
const ENTERING = ZoomIn.duration(120);
const EXITING = FadeOut.duration(120);

const REMOVE_ACTION = "remove";

export type TagInputChipProps = {
	tag: string;
	index: number;
	renderTag?: (tag: string, state: TagInputTagState) => ReactNode;
};

/**
 * One tag in the box: a static `Chip` with a remove control, or whatever
 * `renderTag` draws for it.
 *
 * The chip is one accessibility element named by its text, with removal as a
 * `remove` action — VoiceOver's Actions rotor, TalkBack's actions menu — so a
 * list of tags reads as a list of tags rather than as text interleaved with
 * buttons. The visible close glyph still takes a tap.
 *
 * Wrapped in an `Animated.View` so the row reflows with a short layout
 * transition as tags come and go, and a new tag lands with a zoom. Calm motion
 * drops all three.
 */
export function TagInputChip({ tag, index, renderTag }: TagInputChipProps): ReactElement {
	const context = useTagInputPart("TagInput.Chip");
	const isCalm = useCalmMotion();

	const isPendingRemove = context.pendingRemoveIndex === index;
	const isRemovable = !context.isDisabled && !context.isReadOnly;
	const remove = () => {
		if (isRemovable) context.remove(index);
	};
	const removeLabel = context.removeAccessibilityLabel(tag);
	const chip = resolveTagInputChip({ isPendingRemove, size: context.size, variant: context.chipVariant });
	const testID = context.testID ? `${context.testID}-tag-${index}` : undefined;

	const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
		if (event.nativeEvent.actionName === REMOVE_ACTION) remove();
	};

	// A custom tag still gets the wrapper, so it reflows with the rest.
	const content = renderTag ? (
		renderTag(tag, { index, isPendingRemove, isRemovable, remove })
	) : (
		<Chip
			accessibilityActions={isRemovable ? [{ label: removeLabel, name: REMOVE_ACTION }] : undefined}
			accessibilityLabel={tag}
			accessible
			closeAccessibilityLabel={removeLabel}
			closeTestID={testID ? `${testID}-remove` : undefined}
			color={chip.color}
			onAccessibilityAction={handleAccessibilityAction}
			onClose={isRemovable ? remove : undefined}
			size={chip.size}
			testID={testID}
			variant={chip.variant}
		>
			{tag}
		</Chip>
	);

	return (
		<Animated.View
			entering={isCalm ? undefined : ENTERING}
			exiting={isCalm ? undefined : EXITING}
			layout={isCalm ? undefined : LAYOUT}
		>
			{content}
		</Animated.View>
	);
}
TagInputChip.displayName = "DelacourUI.TagInput.Chip";
