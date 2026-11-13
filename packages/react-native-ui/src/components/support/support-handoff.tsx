import type { ReactElement } from "react";
import type { ViewProps } from "react-native";
import Animated, { FadeIn, ReduceMotion } from "react-native-reanimated";
import { useAnnouncement } from "../../hooks/use-announce";
import { Separator } from "../separator";
import { Text } from "../text";
import { supportVariants } from "./support.variants";

const ENTERING = FadeIn.duration(240).reduceMotion(ReduceMotion.System);

export type SupportHandoffProps = Omit<ViewProps, "children"> & {
	/** `"You were passed to Omar, who can see everything you told the assistant."` */
	children: string;
	/**
	 * Announce the change of hands when this mounts. Default `true` — pass `false` for a handoff
	 * that is history, loaded with the transcript, so opening a thread does not read every past one.
	 */
	announce?: boolean;
	className?: string;
};

/**
 * The moment a conversation changes hands — a line of text between two rules, placed between turns
 * in the transcript, fading in once on mount.
 *
 * Read out as it appears, so a screen-reader user hears the change of hands exactly when it
 * happens, by one route per platform (`useAnnouncement`, on mount — a live region may not speak an
 * appearance, so Android announces).
 */
export function SupportHandoff({ children, announce = true, className, ...props }: SupportHandoffProps): ReactElement {
	const slots = supportVariants();

	const live = useAnnouncement(children, { channel: "announcement", onMount: true, enabled: announce });

	return (
		<Animated.View
			accessibilityLabel={children}
			accessibilityRole="text"
			accessible
			className={slots.handoff({ className })}
			entering={ENTERING}
			{...live}
			{...props}
		>
			<Separator className={slots.handoffRule()} />
			<Text className={slots.handoffLabel()}>{children}</Text>
			<Separator className={slots.handoffRule()} />
		</Animated.View>
	);
}
SupportHandoff.displayName = "DelacourUI.Support.Handoff";
