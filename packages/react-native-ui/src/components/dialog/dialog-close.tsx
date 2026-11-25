import { type ReactElement, useCallback } from "react";
import { useMinimumHitSlop, useThemeLength } from "../../hooks/use-minimum-hit-target";
import { IconCrossSmall } from "../../icons/central";
import { Slot } from "../../lib/slot";
import { Icon } from "../icon";
import { Pressable, type PressableProps } from "../pressable";
import { useDialogPart } from "./dialog.context";
import { DIALOG_CLOSE_SIZE, DIALOG_CLOSE_SIZE_VARIABLE, dialogVariants } from "./dialog.variants";

export type DialogCloseProps =
	/** Donates the close to the single child — a `Button` in the footer, say. */
	| ({ asChild: true; children: ReactElement } & Omit<PressableProps, "asChild" | "children">)
	/** The ✕ glyph in the card's top-right corner. */
	| ({ asChild?: false; accessibilityLabel?: string } & Omit<PressableProps, "asChild" | "children">);

/**
 * Closes the dialog.
 *
 * Without children it is the ✕ in the card's corner: this library's
 * `Pressable` with `fade` feedback — a scale on a glyph this small reads as a
 * jitter — slop sized from the theme's `--spacing-icon-lg` (12pt by default,
 * 13 under a denser style) because a bare glyph has no capsule to bring it toward
 * 44pt, and the catalog's `close` as its label (`labels` on the root; an own
 * `accessibilityLabel` wins). It sits out of the flow; `Dialog.Title`
 * reserves the clearance.
 *
 * With `asChild` it donates the close to its child, chained ahead of the
 * child's own `onPress`, the way `Dialog.Trigger` donates the open. Either way
 * the close is the same `setOpen(false)` the scrim and the back button take, so
 * `onOpenChange` is the one thing to watch.
 *
 * It closes even an alert dialog: `isDismissible={false}` turns off the ways
 * out the user did not choose, not the ones the dialog offers.
 *
 * @example
 * <Dialog.Close />
 *
 * @example
 * <Dialog.Close asChild>
 *   <Button variant="secondary">Cancel</Button>
 * </Dialog.Close>
 */
export function DialogClose(props: DialogCloseProps): ReactElement {
	const { close, labels } = useDialogPart("Dialog.Close");
	const slop = useMinimumHitSlop(useThemeLength(DIALOG_CLOSE_SIZE_VARIABLE, DIALOG_CLOSE_SIZE));
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
		accessibilityLabel,
		className,
		feedback = "fade",
		hitSlop = slop,
		onPress: _onPress,
		...rest
	} = props;

	return (
		<Pressable
			accessibilityLabel={accessibilityLabel ?? labels.close}
			accessibilityRole="button"
			className={dialogVariants().close({ className })}
			feedback={feedback}
			hitSlop={hitSlop}
			onPress={handlePress}
			{...rest}
		>
			<Icon color="muted-foreground" icon={IconCrossSmall} />
		</Pressable>
	);
}
DialogClose.displayName = "DelacourUI.Dialog.Close";
