import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";
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
	className?: string;
};

/**
 * Whether anyone is there, as a dot and a line.
 *
 * One live element to a screen reader — `"Online. Typically replies in under an hour"` — and
 * announced politely when it changes. The dot is decorative: colour alone must not carry
 * availability, so the word leads the spoken label. The dot swaps its class and snaps rather than
 * fading — a change of availability is state, not an event.
 */
export function SupportStatus({
	replyTime,
	availability: availabilityProp,
	className,
	...props
}: SupportStatusProps): ReactElement {
	const { availability: rootAvailability } = useSupport();
	const availability = availabilityProp ?? rootAvailability;
	const slots = supportVariants({ availability });

	return (
		<View
			accessibilityLabel={resolveStatusA11yLabel(availability, replyTime)}
			accessibilityLiveRegion="polite"
			accessibilityRole="text"
			accessible
			className={slots.statusRow({ className })}
			{...props}
		>
			<View className={slots.statusDot()} importantForAccessibility="no" />
			<Text className={slots.statusLabel()}>{resolveAvailabilityLabel(availability, replyTime)}</Text>
		</View>
	);
}
SupportStatus.displayName = "DelacourUI.Support.Status";
