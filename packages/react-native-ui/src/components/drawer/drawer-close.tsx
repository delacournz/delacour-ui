import { type ReactElement, useCallback } from "react";
import { IconCrossSmall } from "../../icons/central";
import { Slot } from "../../lib/slot";
import { Icon } from "../icon";
import { Pressable, type PressableProps } from "../pressable";
import { useDrawerPart } from "./drawer.context";
import { DRAWER_CLOSE_HIT_SLOP, drawerVariants } from "./drawer.variants";

export type DrawerCloseProps =
	/** Donates the close to the single child — a `Button` in the footer, a navigation row. */
	| ({ asChild: true; children: ReactElement } & Omit<PressableProps, "asChild" | "children">)
	/** The ✕ glyph. */
	| ({ asChild?: false; accessibilityLabel?: string } & Omit<PressableProps, "asChild" | "children">);

/**
 * Closes the drawer.
 *
 * Without children it is a ✕: this library's `Pressable` with `fade` feedback
 * — a scale on a glyph this small reads as a jitter — 8pt of slop because a
 * bare glyph has no capsule to bring it toward 44pt, and `"Close"` as its
 * label. `Drawer.Header` writes one at its trailing edge unless told not to.
 *
 * With `asChild` it donates the close to its child, chained ahead of the
 * child's own `onPress` — a navigation row that should also shut the menu.
 * Either way it is the same `setOpen(false)` the scrim, the swipe and the back
 * button take, and it closes even a non-dismissible drawer: it is one of the
 * drawer's own actions.
 *
 * @example
 * <Drawer.Close asChild>
 *   <Button variant="secondary">Done</Button>
 * </Drawer.Close>
 */
export function DrawerClose(props: DrawerCloseProps): ReactElement {
	const { close } = useDrawerPart("Drawer.Close");
	const { onPress } = props;

	const handlePress = useCallback(() => {
		close();
		onPress?.();
	}, [close, onPress]);

	if (props.asChild) {
		const { asChild: _asChild, children, onPress: _onPress, ...rest } = props;
		return (
			<Slot onPress={handlePress} {...rest}>
				{children}
			</Slot>
		);
	}

	const {
		asChild: _asChild,
		accessibilityLabel = "Close",
		className,
		feedback = "fade",
		hitSlop = DRAWER_CLOSE_HIT_SLOP,
		onPress: _onPress,
		...rest
	} = props;

	return (
		<Pressable
			accessibilityLabel={accessibilityLabel}
			accessibilityRole="button"
			className={drawerVariants().close({ className })}
			feedback={feedback}
			hitSlop={hitSlop}
			onPress={handlePress}
			{...rest}
		>
			<Icon color="muted-foreground" icon={IconCrossSmall} />
		</Pressable>
	);
}
DrawerClose.displayName = "DelacourUI.Drawer.Close";
