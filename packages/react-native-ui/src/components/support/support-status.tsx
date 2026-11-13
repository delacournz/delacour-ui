import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";
import { useAnnouncement } from "../../hooks/use-announce";
import { Text } from "../text";
import { useSupport } from "./support.context";
import type { SupportAvailability } from "./support.types";
import { resolveAvailabilityLabel, resolveStatusA11yLabel } from "./support.utils";
import { supportVariants } from "./support.variants";

export type SupportStatusProps = Omit<ViewProps, "children"> & {
	/** Caller wording ("Typically replies in under an hour"). Absent ⇒ the availability's own label. */
	replyTime?: string;
	/** Override the root's availability for this one status. Rare. */
	availability?: SupportAvailability;
	/**
	 * Announce the status when it changes. Default `true` — pass `false` for an app that speaks
	 * availability itself.
	 */
	announce?: boolean;
	className?: string;
};

/**
 * Whether anyone is there, as a dot and a line.
 *
 * One live element to a screen reader — `"Online. Typically replies in under an hour"` — and
 * announced politely when it changes, by one route per platform (`useAnnouncement`: a live region
 * on Android, an announcement on iOS, which has no live regions). The dot is decorative: colour alone must not carry
 * availability, so the word leads the spoken label. The dot swaps its class and snaps rather than
 * fading — a change of availability is state, not an event.
 */
export function SupportStatus({
	replyTime,
	availability: availabilityProp,
	announce = true,
	className,
	...props
}: SupportStatusProps): ReactElement {
	const { availability: rootAvailability } = useSupport();
	const availability = availabilityProp ?? rootAvailability;
	const slots = supportVariants({ availability });
	const label = resolveStatusA11yLabel(availability, replyTime);
	const live = useAnnouncement(label, { enabled: announce });

	return (
		<View
			accessibilityLabel={label}
			accessibilityRole="text"
			accessible
			className={slots.statusRow({ className })}
			{...live}
			{...props}
		>
			<View className={slots.statusDot()} importantForAccessibility="no" />
			<Text className={slots.statusLabel()}>{resolveAvailabilityLabel(availability, replyTime)}</Text>
		</View>
	);
}
SupportStatus.displayName = "DelacourUI.Support.Status";
