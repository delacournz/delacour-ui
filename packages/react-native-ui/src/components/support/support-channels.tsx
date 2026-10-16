import type { ReactElement } from "react";
import { ListGroup } from "../list-group";
import type { SupportSectionProps } from "./support.types";
import { SupportSection } from "./support-section";

export type SupportChannelsProps = SupportSectionProps;

/**
 * The ways to reach a person — chat, email, phone — as rows in one card.
 *
 * A titled `ListGroup`, so the rows inside — `Item`s — take the group's metrics, its dividers and
 * its card corner without restating any of them.
 */
export function SupportChannels({ children, ...props }: SupportChannelsProps): ReactElement {
	return (
		<SupportSection {...props}>
			<ListGroup>{children}</ListGroup>
		</SupportSection>
	);
}
SupportChannels.displayName = "DelacourUI.Support.Channels";
