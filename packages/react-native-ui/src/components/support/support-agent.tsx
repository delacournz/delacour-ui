import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";
import { useAnnouncement } from "../../hooks/use-announce";
import { Text } from "../text";
import { useSupport } from "./support.context";
import type { SupportAvailability } from "./support.types";
import { resolveAgentA11yLabel, resolveAgentStatusLine } from "./support.utils";
import { supportVariants } from "./support.variants";
import { SupportTyping } from "./support-typing";

export type SupportAgentProps = Omit<ViewProps, "children"> & {
	name: string;
	/**
	 * What they do — `"Support"`, `"Billing specialist"`. Not `role`: React Native's `role` is the
	 * ARIA role, so the name would collide with an accessibility prop every `View` takes.
	 */
	title?: string;
	/** The agent's face — an `<Avatar>`, with an `Avatar.Badge` for presence if wanted. */
	avatar?: ReactElement;
	/** Replaces the status line while true: the two answer the same question and the live one wins. */
	typing?: boolean;
	/** The agent's own availability. Absent ⇒ the root's, or `offline` with no root. */
	availability?: SupportAvailability;
	/** `testID` for the typing dots, so a test can wait on them. */
	typingTestID?: string;
	/**
	 * Announce "Omar Haddad is typing" when typing starts. Default `true` — pass `false` for an app
	 * that speaks typing itself.
	 */
	announce?: boolean;
	className?: string;
};

/**
 * Who is answering: a face, a name, and a status line — the title and availability, or, while
 * `typing`, three dots and "Omar is typing".
 *
 * One element to a screen reader, `"Omar Haddad, Support, online"`. When typing starts the label
 * becomes `"Omar Haddad is typing"` and is announced once, by one route per platform
 * (`useAnnouncement`: an announcement, because a live region would also speak the label when
 * typing stops) — never on every dot frame. Works on a thread route with no `<Support>` root: availability then defaults to
 * `offline`.
 */
export function SupportAgent({
	name,
	title,
	avatar,
	typing = false,
	availability: availabilityProp,
	typingTestID,
	announce = true,
	className,
	...props
}: SupportAgentProps): ReactElement {
	const { availability: rootAvailability } = useSupport();
	const availability = availabilityProp ?? rootAvailability;
	const status = resolveAgentStatusLine({ name, title, availability, typing });
	const label = resolveAgentA11yLabel({ name, title, availability, typing });
	const slots = supportVariants();

	const live = useAnnouncement(typing ? label : null, { channel: "announcement", onMount: true, enabled: announce });

	return (
		<View accessibilityLabel={label} accessible className={slots.agent({ className })} {...live} {...props}>
			{avatar}
			<View className={slots.agentText()}>
				<Text className={slots.agentName()} numberOfLines={1}>
					{name}
				</Text>
				<View className={slots.agentStatusLine()}>
					{typing ? <SupportTyping testID={typingTestID} /> : null}
					<Text className={slots.agentStatus()} numberOfLines={1}>
						{status.text}
					</Text>
				</View>
			</View>
		</View>
	);
}
SupportAgent.displayName = "DelacourUI.Support.Agent";
