import { type ComponentRef, type ReactElement, useCallback } from "react";
import { View } from "react-native";
import type Animated from "react-native-reanimated";
import { composeRefs } from "../../lib/compose-refs";
import { Pressable, type PressableProps } from "../pressable";
import { Text } from "../text";
import { useSectionProgressPart } from "./section-progress.context";
import { type SectionProgressColor, sectionProgressVariants } from "./section-progress.variants";

export type SectionProgressItemProps = Omit<PressableProps, "asChild" | "children"> & {
	/** The section's id — the one `useScrollSections().register` was given. */
	value: string;
	/** The marker's colour, and the ring's while this section is active. Default `foreground`. */
	color?: SectionProgressColor;
	/** The section's title. Also the pill's label while it is active. */
	children: string;
	className?: string;
};

/**
 * One section in the panel: a coloured marker and its title. Pressing it emits
 * the section through the root's `onValueChange` — wire that to
 * `useScrollSections().scrollTo` — and closes the panel.
 *
 * The active section is `selected` and tinted; when the panel opens,
 * screen-reader focus lands on it.
 */
export function SectionProgressItem({
	value,
	color,
	children,
	className,
	feedback = "fade",
	accessibilityState,
	onPress,
	ref,
	...props
}: SectionProgressItemProps): ReactElement {
	const root = useSectionProgressPart("SectionProgress.Item");
	const isActive = root.value === value;
	const slots = sectionProgressVariants({ color, isActive });

	const handlePress = useCallback(() => {
		root.select(value);
		onPress?.();
	}, [onPress, root.select, value]);

	const activeRef = isActive
		? (node: ComponentRef<typeof Animated.View> | null) => {
				root.activeItemRef.current = node;
			}
		: undefined;

	return (
		<Pressable
			accessibilityState={{ ...accessibilityState, selected: isActive }}
			className={slots.item({ className })}
			feedback={feedback}
			onPress={handlePress}
			ref={composeRefs(ref, activeRef)}
			{...props}
		>
			<View className={slots.itemMarker()} />
			<Text.Label className={slots.itemLabel()} numberOfLines={1}>
				{children}
			</Text.Label>
		</Pressable>
	);
}
SectionProgressItem.displayName = "DelacourUI.SectionProgress.Item";
