import { isValidElement, type ReactElement, type ReactNode, useMemo } from "react";
import { View, type ViewProps } from "react-native";
import { type ListGroupContextValue, ListGroupProvider } from "../list-group/list-group.context";
import { listGroupVariants } from "../list-group/list-group.variants";
import { FrameTrayDividedProvider, useFramePart } from "./frame.context";
import { resolveFrameTraySize, resolveFrameTrayVariant } from "./frame.variants";
import { withFrameDividers } from "./frame-dividers";
import { FrameSection } from "./frame-section";

export type FrameTrayProps = ViewProps & {
	/** Draw a rule between adjacent children. Default true. */
	isDivided?: boolean;
	className?: string;
	children?: ReactNode;
};

function isFrameSection(node: ReactNode): boolean {
	return isValidElement(node) && node.type === FrameSection;
}

/**
 * The card of rows — a `ListGroup` in everything but its dividers.
 *
 * It publishes the ListGroup context through the `list-group.context` leaf and
 * paints the ListGroup root, so an `Item` or a `ListGroup.Item` placed in it
 * becomes a grouped row with nothing said at the call site: the group's size,
 * fade feedback, and no card drawn inside the card.
 *
 * It does not render `ListGroup` itself because a section needs a different
 * rule from a row. Two rows are divided inset, the ListGroup way; a
 * `Frame.Section` is ruled off full-bleed on either side.
 */
export function FrameTray({ isDivided = true, className, children, ...props }: FrameTrayProps): ReactElement {
	const { variant, size } = useFramePart("Frame.Tray");
	const groupSize = resolveFrameTraySize(size);
	const groupVariant = resolveFrameTrayVariant(variant);
	const context = useMemo<ListGroupContextValue>(
		() => ({ size: groupSize, variant: groupVariant }),
		[groupSize, groupVariant]
	);

	const slots = listGroupVariants({ size: groupSize, variant: groupVariant });
	const insetClassName = slots.divider();
	const content = useMemo(
		() => (isDivided ? withFrameDividers(children, insetClassName, isFrameSection) : children),
		[children, isDivided, insetClassName]
	);

	return (
		<ListGroupProvider value={context}>
			<FrameTrayDividedProvider value={isDivided}>
				<View accessibilityRole="list" className={slots.root({ className })} {...props}>
					{content}
				</View>
			</FrameTrayDividedProvider>
		</ListGroupProvider>
	);
}
FrameTray.displayName = "DelacourUI.Frame.Tray";
