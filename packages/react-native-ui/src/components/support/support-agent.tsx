import { type ReactElement, useEffect } from "react";
import { AccessibilityInfo, View, type ViewProps } from "react-native";
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
	className?: string;
};

/**
 * Who is answering: a face, a name, and a status line — the title and availability, or, while
 * `typing`, three dots and "Khalid is typing".
 *
 * One element to a screen reader, `"Khalid Abdi, Support, online"`. When typing starts the label
 * becomes `"Khalid Abdi is typing"` and is announced once — through a polite live region on
 * Android and an explicit announcement on iOS, which has no live regions — never on every dot
 * frame. Works on a thread route with no `<Support>` root: availability then defaults to
 * `offline`.
 */
export function SupportAgent({
	name,
	title,
	avatar,
	typing = false,
	availability: availabilityProp,
	typingTestID,
	className,
	...props
}: SupportAgentProps): ReactElement {
	const { availability: rootAvailability } = useSupport();
	const availability = availabilityProp ?? rootAvailability;
	const status = resolveAgentStatusLine({ name, title, availability, typing });
	const label = resolveAgentA11yLabel({ name, title, availability, typing });
	const slots = supportVariants();

	useEffect(() => {
		if (typing) AccessibilityInfo.announceForAccessibility(label);
	}, [typing, label]);

	return (
		<View
			accessibilityLabel={label}
			accessibilityLiveRegion={status.live ? "polite" : "none"}
			accessible
			className={slots.agent({ className })}
			{...props}
		>
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
