import type { ReactElement } from "react";
import { ListGroup } from "../list-group";
import type { SupportSectionProps } from "./support.types";
import { SupportSection } from "./support-section";

export type SupportConversationsProps = SupportSectionProps;

/**
 * Past requests, newest first, as rows in one card.
 *
 * A titled `ListGroup`, so the rows inside — `Item`s — take the group's metrics, its dividers and
 * its card corner without restating any of them.
 */
export function SupportConversations({ children, ...props }: SupportConversationsProps): ReactElement {
	return (
		<SupportSection {...props}>
			<ListGroup>{children}</ListGroup>
		</SupportSection>
	);
}
SupportConversations.displayName = "DelacourUI.Support.Conversations";
