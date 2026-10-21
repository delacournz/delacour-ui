import { type ReactElement, useEffect } from "react";
import Animated, {
	cancelAnimation,
	Easing,
	ReduceMotion,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated";
import {
	IconCircle,
	IconCircleCheck,
	IconCircleInfo,
	IconExclamationCircle,
	IconExclamationTriangle,
} from "../../icons/central";
import { Icon, type IconComponent } from "../icon";
import { Spinner } from "../spinner";
import {
	type AnimatedBadgeGlyphKind,
	type AnimatedBadgeStatus,
	PULSE_CYCLE_MS,
	PULSE_MAX_SCALE,
	PULSE_MIN_OPACITY,
} from "./animated-badge.variants";

/**
 * The glyph each status draws when the caller names none.
 *
 * The four statuses `Alert` also has take `Alert`'s glyphs, so a warning reads
 * the same in a badge as in a banner — and `warning` and `destructive` differ in
 * shape as well as colour, a triangle against a circle, for anyone who cannot
 * tell amber from red. `neutral` is a bare ring: a status with no verdict.
 * `loading` is absent because it spins instead.
 *
 * Lives here rather than in `animated-badge.variants.ts` because the glyphs are
 * React Native SVG components, and that file must stay free of React Native imports.
 */
const STATUS_GLYPHS: Record<Exclude<AnimatedBadgeStatus, "loading">, IconComponent> = {
	neutral: IconCircle,
	info: IconCircleInfo,
	success: IconCircleCheck,
	warning: IconExclamationTriangle,
	destructive: IconExclamationCircle,
};

/**
 * The element for a resolved glyph kind. `loading` with no custom icon always
 * spins, whichever kind it arrives with.
 */
function pickGlyph(
	kind: "spinner" | "icon",
	status: AnimatedBadgeStatus,
	icon: IconComponent | undefined
): ReactElement {
	if (kind === "icon" && icon) return <Icon icon={icon} />;
	if (status === "loading") return <Spinner />;
	return <Icon icon={icon ?? STATUS_GLYPHS[status]} />;
}

export type AnimatedBadgeGlyphProps = {
	kind: AnimatedBadgeGlyphKind;
	status: AnimatedBadgeStatus;
	icon: IconComponent | undefined;
	/** Swell in a loop. Already resolved against calm and reduced motion. */
	isPulsing: boolean;
};

/**
 * The glyph leading the label: the caller's icon, the status's icon, or a
 * spinner for `loading`. Size and colour come from the badge's
 * `IconDefaultsProvider`, never from here.
 *
 * Hidden from assistive technology — it duplicates the word beside it, and the
 * spinner would otherwise announce itself as a progress bar inside a label.
 *
 * The pulse is a 0 → 1 clock read through a cosine, the shape `Skeleton`'s pulse
 * uses. Its timing sets `ReduceMotion.Never` because the gate is one level up,
 * in `resolveAnimatedBadgeMotion`: under the default policy a `withRepeat(-1)`
 * of a timing the OS has zeroed spins forever.
 */
export function AnimatedBadgeGlyph({ kind, status, icon, isPulsing }: AnimatedBadgeGlyphProps): ReactElement | null {
	const clock = useSharedValue(0);

	useEffect(() => {
		if (!isPulsing) {
			cancelAnimation(clock);
			clock.value = 0;
			return;
		}

		clock.value = 0;
		clock.value = withRepeat(
			withTiming(1, { duration: PULSE_CYCLE_MS, easing: Easing.linear, reduceMotion: ReduceMotion.Never }),
			-1,
			false
		);
		return () => cancelAnimation(clock);
	}, [isPulsing, clock]);

	const pulseStyle = useAnimatedStyle(() => {
		const swell = (1 - Math.cos(clock.value * 2 * Math.PI)) / 2;
		return {
			opacity: 1 - (1 - PULSE_MIN_OPACITY) * swell,
			transform: [{ scale: 1 + (PULSE_MAX_SCALE - 1) * swell }],
		};
	});

	if (kind === "none") return null;

	return (
		<Animated.View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={pulseStyle}>
			{pickGlyph(kind, status, icon)}
		</Animated.View>
	);
}
AnimatedBadgeGlyph.displayName = "DelacourUI.AnimatedBadge.Glyph";
