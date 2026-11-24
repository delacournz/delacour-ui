import type { ReactElement } from "react";
import { useMinimumHitSlop } from "../../hooks/use-minimum-hit-target";
import { IconCrossSmall } from "../../icons/central";
import { Slot } from "../../lib/slot";
import { Icon } from "../icon";
import { Pressable, type PressableProps } from "../pressable";
import { usePopoverContext } from "./popover.context";
import { POPOVER_CLOSE_SIZE, popoverVariants } from "./popover.variants";

export type PopoverCloseProps =
	| ({ asChild: true; children: ReactElement } & Omit<PressableProps, "asChild" | "children">)
	| ({
			asChild?: false;
			/** The ✕'s accessible name. Defaults to `labels.close`. */
			accessibilityLabel?: string;
	  } & Omit<PressableProps, "asChild" | "children">);

/**
 * Closes the popover.
 *
 * Without `asChild` it is the ✕ in the panel's top-right corner: out of the
 * flow, `fade` feedback and a 12pt slop for `BottomSheet.Close`'s reasons, and
 * `Popover.Title` reserves its clearance. With `asChild` it donates the close to
 * its child's `onPress` — a "Done" button in the panel's footer.
 *
 * @example
 * <Popover.Close />
 *
 * @example
 * <Popover.Close asChild>
 *   <Button size="sm">Save</Button>
 * </Popover.Close>
 */
export function PopoverClose(props: PopoverCloseProps): ReactElement {
	const { close, labels } = usePopoverContext();
	const slop = useMinimumHitSlop(POPOVER_CLOSE_SIZE);

	if (props.asChild) {
		const { asChild: _asChild, children, onPress, ...rest } = props;
		const press = () => {
			close();
			onPress?.();
		};
		return (
			<Slot {...rest} onPress={press}>
				{children}
			</Slot>
		);
	}

	const {
		asChild: _asChild,
		accessibilityLabel = labels.close,
		className,
		feedback = "fade",
		hitSlop = slop,
		onPress,
		...rest
	} = props;
	const press = () => {
		close();
		onPress?.();
	};

	return (
		<Pressable
			accessibilityLabel={accessibilityLabel}
			accessibilityRole="button"
			className={popoverVariants().close({ className })}
			feedback={feedback}
			hitSlop={hitSlop}
			onPress={press}
			{...rest}
		>
			<Icon color="muted-foreground" icon={IconCrossSmall} />
		</Pressable>
	);
}
PopoverClose.displayName = "DelacourUI.Popover.Close";
