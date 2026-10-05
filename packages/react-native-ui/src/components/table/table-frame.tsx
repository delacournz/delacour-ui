import type { ReactElement, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Card, type CardProps } from "../card";

export type TableFrameProps = Omit<CardProps, "size"> & {
	/** The frame's heading. */
	title?: ReactNode;
	/** A muted line under the title. */
	description?: ReactNode;
	/** A control pinned to the top-right corner — a filter, an export button. */
	action?: ReactNode;
	/** Match the table's own size, so the title sits over the first column. */
	size?: "sm" | "md";
};

/**
 * A `Card` holding a table under a header tray — a title, a description and an
 * action — with the table set flush to the card's sides and bottom.
 *
 * The card clips, so a striped or selected last row takes the card's own
 * corners. Pass the table `variant="plain"`: the frame is the outline.
 */
export function TableFrame({
	title,
	description,
	action,
	size = "md",
	className,
	children,
	...props
}: TableFrameProps): ReactElement {
	const hasHeader = title !== undefined || description !== undefined || action !== undefined;

	return (
		<Card className={cn("pb-0", className)} size={size} {...props}>
			{hasHeader ? (
				<Card.Header>
					{title === undefined ? null : <Card.Title>{title}</Card.Title>}
					{description === undefined ? null : <Card.Description>{description}</Card.Description>}
					{action === undefined ? null : <Card.Action>{action}</Card.Action>}
				</Card.Header>
			) : null}
			{children}
		</Card>
	);
}
TableFrame.displayName = "DelacourUI.Table.Frame";
