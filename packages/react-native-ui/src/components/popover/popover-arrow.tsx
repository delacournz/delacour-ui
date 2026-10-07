import type { ReactElement } from "react";
import { View } from "react-native";
import { useOptionalPopoverContent } from "./popover.context";
import { type AnchoredSize, type PopoverPlacement, resolveArrowFrame } from "./popover.position";
import { POPOVER_ARROW_SIZE, popoverVariants } from "./popover.variants";

export type AnchoredArrowProps = {
	/** The side the panel was placed on — the arrow sits on the edge facing the anchor. */
	placement: PopoverPlacement;
	/** From `resolveAnchoredPosition`: along that edge, toward the anchor's centre. */
	arrowOffset: number;
	/** The panel's measured size. */
	size: AnchoredSize;
	/** Strips the arrow's fill and border, for a panel drawn with its own `background`. */
	isUnstyled?: boolean;
	className?: string;
};

/**
 * A square turned 45°, half of it past the panel's edge, pointing at the anchor.
 *
 * It wears the panel's fill and the panel's border on its two outer edges, and
 * its inner half lies over the panel — covering the panel's own border where
 * the two meet, so the arrow reads as part of the panel rather than a tab stuck
 * to it. `resolveArrowFrame` turns it per placement.
 *
 * Hidden from assistive technology: it is decoration.
 *
 * **A leaf.** Tooltip imports it with its own placement; it imports nothing
 * from `./popover` or `./index`.
 */
export function AnchoredArrow({
	placement,
	arrowOffset,
	size,
	isUnstyled = false,
	className,
}: AnchoredArrowProps): ReactElement {
	const frame = resolveArrowFrame(placement, arrowOffset, size, POPOVER_ARROW_SIZE);

	return (
		<View
			accessibilityElementsHidden
			accessible={false}
			className={popoverVariants({ isUnstyled }).arrow({ className })}
			importantForAccessibility="no-hide-descendants"
			pointerEvents="none"
			style={{
				left: frame.left,
				top: frame.top,
				width: POPOVER_ARROW_SIZE,
				height: POPOVER_ARROW_SIZE,
				transform: [{ rotate: `${frame.rotate}deg` }],
			}}
		/>
	);
}
AnchoredArrow.displayName = "DelacourUI.Popover.AnchoredArrow";

export type PopoverArrowProps = {
	className?: string;
};

/**
 * The panel's arrow. Write it anywhere inside `Popover.Content` — it reads the
 * resolved placement and offset from the panel, follows a flip, and is lifted
 * out of a scrollable body so it is never scrolled or clipped.
 *
 * @example
 * <Popover.Content>
 *   <Popover.Arrow />
 *   <Popover.Title>Rename</Popover.Title>
 * </Popover.Content>
 */
export function PopoverArrow({ className }: PopoverArrowProps): ReactElement | null {
	const content = useOptionalPopoverContent();
	if (content === null) return null;

	return (
		<AnchoredArrow
			arrowOffset={content.arrowOffset}
			className={className}
			isUnstyled={content.isUnstyled}
			placement={content.placement}
			size={content.size}
		/>
	);
}
PopoverArrow.displayName = "DelacourUI.Popover.Arrow";
