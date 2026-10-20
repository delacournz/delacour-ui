import type { ComponentProps, ReactNode } from "react";
import type Animated from "react-native-reanimated";
import type { IconComponent } from "../icon";
import type { AnimatedBadgeGlyphKind, AnimatedBadgeStatus } from "./animated-badge.variants";

/**
 * One state of the badge's content — what is drawn between one roll and the next.
 *
 * The root builds one from its props every render; the roll holds on to the
 * last one it showed until the outgoing content is off-screen, and the measurer
 * lays out the incoming one ahead of time. Shared by all three, which is why it
 * lives here rather than in any one of them.
 */
export type AnimatedBadgeFrame = {
	/** What a roll keys on — see `resolveAnimatedBadgeKey`. */
	key: string;
	status: AnimatedBadgeStatus;
	glyph: AnimatedBadgeGlyphKind;
	/** The caller's glyph, when there is one. */
	icon: IconComponent | undefined;
	/** The label as passed. */
	label: ReactNode;
	/** The label as one string, when it is text — see `resolveAnimatedBadgeText`. */
	text: string | undefined;
};

/** A style an `Animated.View` takes — what the roll hands the moving unit. */
export type AnimatedBadgeAnimatedStyle = ComponentProps<typeof Animated.View>["style"];
