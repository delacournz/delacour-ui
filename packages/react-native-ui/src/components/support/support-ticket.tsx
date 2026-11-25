import type { ReactElement } from "react";
import type { SupportLabels } from "../../lib/labels";
import { Badge } from "../badge";
import { Item, type ItemProps } from "../item";
import { useSupportLabels } from "./support.context";
import type { SupportTicketStatus } from "./support.types";
import { resolveTicketStatus } from "./support.utils";
import { SUPPORT_TICKET_BADGE_VARIANT } from "./support.variants";

export type SupportTicketProps = Omit<ItemProps, "asChild" | "children" | "isSelected" | "orientation" | "variant"> & {
	title: string;
	/** The request's reference — `"#4821"`. */
	reference?: string;
	status: SupportTicketStatus;
	/**
	 * The spoken strings, laid over `DelacourProvider`'s `labels`, which sit over English.
	 */
	labels?: Partial<SupportLabels>;
	className?: string;
};

/**
 * The request a thread belongs to, pinned at the top of it: the title, its reference and a soft
 * status badge on an outlined `Item`. Give it an `onPress` to open the request's details.
 */
export function SupportTicket({
	title,
	reference,
	status,
	size = "sm",
	labels: labelsProp,
	...props
}: SupportTicketProps): ReactElement {
	const labels = useSupportLabels(labelsProp);
	const ticket = resolveTicketStatus(status, labels);

	return (
		<Item size={size} variant="outline" {...props}>
			<Item.Content>
				<Item.Title numberOfLines={1}>{title}</Item.Title>
				{reference ? <Item.Description numberOfLines={1}>{reference}</Item.Description> : null}
			</Item.Content>
			<Item.Actions>
				<Badge color={ticket.color} size="sm" variant={SUPPORT_TICKET_BADGE_VARIANT}>
					{ticket.label}
				</Badge>
			</Item.Actions>
		</Item>
	);
}
SupportTicket.displayName = "DelacourUI.Support.Ticket";
