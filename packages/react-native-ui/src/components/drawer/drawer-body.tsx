import type { ReactElement } from "react";
import { ScrollView, type ScrollViewProps, View, type ViewProps } from "react-native";
import { cn } from "../../lib/cn";
import { drawerVariants } from "./drawer.variants";

export type DrawerBodyProps =
	/** Scrolls when its content is taller than the panel. The default. */
	| ({ isScrollable?: true; className?: string; contentContainerClassName?: string } & ScrollViewProps)
	/** A plain column, for content that fits — a few chips and a slider. */
	| ({ isScrollable: false; className?: string } & ViewProps);

/**
 * The panel's content, between the header and the footer, taking the height
 * left over.
 *
 * Scrolls by default. The panel's pan waits for travel along its own axis and
 * fails on travel across it, so a vertical scroll in a start or end drawer
 * never moves the drawer. A top or bottom drawer's pan runs along the same axis
 * as a vertical scroll — keep their content short, or reach for a `BottomSheet`.
 *
 * @example
 * <Drawer.Body>
 *   <ListGroup>…</ListGroup>
 * </Drawer.Body>
 *
 * @example
 * <Drawer.Body isScrollable={false}>…</Drawer.Body>
 */
export function DrawerBody(props: DrawerBodyProps): ReactElement {
	const slots = drawerVariants();

	if (props.isScrollable === false) {
		const { isScrollable: _isScrollable, className, ...rest } = props;
		return <View className={cn(slots.body(), slots.bodyContent(), className)} {...rest} />;
	}

	const { isScrollable: _isScrollable, className, contentContainerClassName, ...rest } = props;
	return (
		<ScrollView
			className={slots.body({ className })}
			contentContainerClassName={slots.bodyContent({ className: contentContainerClassName })}
			{...rest}
		/>
	);
}
DrawerBody.displayName = "DelacourUI.Drawer.Body";
