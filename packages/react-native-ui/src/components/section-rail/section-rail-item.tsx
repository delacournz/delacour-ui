import { type ComponentRef, type ReactElement, useEffect, useRef } from "react";
import type Animated from "react-native-reanimated";
import { composeRefs } from "../../lib/compose-refs";
import { Pressable, type PressableProps } from "../pressable";
import { Text } from "../text";
import { useSectionRailPart } from "./section-rail.context";
import { resolveItemIndent, sectionRailVariants } from "./section-rail.variants";

export type SectionRailItemProps = Omit<PressableProps, "children"> & {
	/** The section this row jumps to — the same value as its `SectionRail.Bar`. */
	value: string;
	/** Nesting depth. Each level indents one step; 2 and deeper share the deepest. */
	level?: number;
	/** The section's title. Also what the trigger speaks while this section is active. */
	children: string;
	className?: string;
};

/**
 * One row of the panel: a section's title, indented by its level.
 *
 * A tap picks the section; the panel then lingers for the rail's `closeDelay`.
 * The active row — the committed section, or the one under a scrubbing finger —
 * is drawn in the foreground at medium weight and announced `selected`. Titles
 * wrap to two lines and then truncate.
 *
 * When the panel opens, VoiceOver focus moves to the committed row (the first
 * row when none is committed), so the reader starts where they are rather than
 * at the top of the outline. The panel does that, through the rail; the row only
 * offers its node.
 */
export function SectionRailItem({
	value,
	level = 0,
	children,
	className,
	onPress,
	accessibilityState,
	ref,
	...props
}: SectionRailItemProps): ReactElement {
	const {
		activeValue,
		committedRowRef,
		firstRowRef,
		pick,
		registerItem,
		value: committed,
	} = useSectionRailPart("SectionRail.Item");
	const isActive = activeValue === value;
	const slots = sectionRailVariants({ isActive });
	const node = useRef<ComponentRef<typeof Animated.View>>(null);

	useEffect(() => registerItem(value, children), [children, registerItem, value]);

	const isCommitted = committed === value;
	useEffect(() => {
		const row = node.current;
		if (row === null) return;
		if (firstRowRef.current === null) firstRowRef.current = row;
		if (isCommitted) committedRowRef.current = row;
		return () => {
			if (firstRowRef.current === row) firstRowRef.current = null;
			if (committedRowRef.current === row) committedRowRef.current = null;
		};
	}, [committedRowRef, firstRowRef, isCommitted]);

	return (
		<Pressable
			accessibilityRole="button"
			accessibilityState={{ ...accessibilityState, selected: isActive }}
			className={slots.item({ className: [resolveItemIndent(level), className] })}
			feedback="fade"
			onPress={() => {
				pick(value);
				onPress?.();
			}}
			ref={composeRefs(node, ref)}
			{...props}
		>
			<Text className={slots.itemLabel()} numberOfLines={2}>
				{children}
			</Text>
		</Pressable>
	);
}
SectionRailItem.displayName = "DelacourUI.SectionRail.Item";
