import { type ReactElement, type ReactNode, useRef } from "react";
import type { ViewProps } from "react-native";
import Animated, {
	LinearTransition,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import type { IconComponent } from "../icon";
import type { AnimatedBadgeFrame } from "./animated-badge.types";
import {
	type AnimatedBadgeSize,
	type AnimatedBadgeStatus,
	RESIZE_SPRING,
	resolveAnimatedBadgeGlyphKind,
	resolveAnimatedBadgeKey,
	resolveAnimatedBadgeMotion,
	resolveAnimatedBadgeSlots,
	resolveAnimatedBadgeText,
} from "./animated-badge.variants";
import { AnimatedBadgeContent } from "./animated-badge-content";
import { AnimatedBadgeMeasure } from "./animated-badge-measure";
import { useAnimatedBadgeRoll } from "./use-animated-badge-roll";

/**
 * Glyph control. A union rather than two loose props, so a custom `icon`
 * alongside `showIcon={false}` — a contradiction — does not typecheck.
 */
type AnimatedBadgeGlyphProps =
	| {
			/** Draw a glyph before the label. Default `true`. */
			showIcon?: true;
			/** Replaces the status's own glyph. Takes the badge's icon size and colour. */
			icon?: IconComponent;
	  }
	| { showIcon: false; icon?: never };

export type AnimatedBadgeProps = Omit<ViewProps, "children"> &
	AnimatedBadgeGlyphProps & {
		/** What the badge says. Default `neutral`. */
		status?: AnimatedBadgeStatus;
		/** `sm` for a list row or a sentence, `md` standalone. Default `md`. */
		size?: AnimatedBadgeSize;
		/** The label. A string (or number) is what change detection keys on. */
		children: ReactNode;
		/**
		 * Explicit change key. Needed when `children` is not text, or when the same
		 * words must roll again. Without it, a non-text label rolls only when
		 * `status` changes.
		 */
		contentKey?: string | number;
		/** A gentle repeating swell on the glyph. Defaults to `true` when `status` is `loading`. */
		pulse?: boolean;
		/**
		 * Spring to a new position when the layout around the badge moves. Default
		 * `true`. Turn it off inside flowing text, or the badge slides across lines
		 * when the sentence reflows.
		 */
		animateLayout?: boolean;
		/** Announce a change to assistive technology. Default `true`. */
		announce?: boolean;
		labelClassName?: string;
		className?: string;
	};

function AnimatedBadgeRoot({
	status = "neutral",
	size = "md",
	children,
	contentKey,
	pulse,
	animateLayout = true,
	announce = true,
	icon,
	showIcon,
	className,
	labelClassName,
	accessibilityLabel,
	style,
	...props
}: AnimatedBadgeProps): ReactElement {
	const motion = resolveAnimatedBadgeMotion({
		isReduceMotion: useReducedMotion(),
		isMotionCalm: useCalmMotion(),
		pulse,
		status,
		animateLayout,
	});

	const frame: AnimatedBadgeFrame = {
		key: resolveAnimatedBadgeKey({ status, children, contentKey }),
		status,
		glyph: resolveAnimatedBadgeGlyphKind({ status, showIcon, hasCustomIcon: icon !== undefined }),
		icon,
		label: children,
		text: resolveAnimatedBadgeText(children),
	};

	const { shown, style: rollStyle } = useAnimatedBadgeRoll({ frame, isRolling: motion.roll, announce });

	// Unset until the first measure, so the first paint is content-sized and
	// never jumps; every later width arrives through the measurer.
	const width = useSharedValue(0);
	const isMeasured = useSharedValue(false);
	const hasWidth = useRef(false);

	const handleMeasure = (next: number): void => {
		if (!hasWidth.current || motion.resize === "instant") {
			width.value = next;
		} else {
			width.value = withSpring(next, RESIZE_SPRING);
		}
		hasWidth.current = true;
		isMeasured.value = true;
	};

	const widthStyle = useAnimatedStyle(() => (isMeasured.value ? { width: width.value } : {}));

	// The capsule paints from the frame on screen, so its fill changes while the
	// outgoing word is invisible rather than under it.
	const slots = resolveAnimatedBadgeSlots({ status: shown.status, size, className });

	return (
		<Animated.View
			accessibilityLabel={accessibilityLabel ?? shown.text}
			accessibilityLiveRegion={announce ? "polite" : "none"}
			accessibilityRole="text"
			accessibilityState={{ busy: status === "loading" }}
			accessible
			className={slots.root}
			layout={motion.layout ? LinearTransition.springify() : undefined}
			style={[style, widthStyle]}
			{...props}
		>
			<AnimatedBadgeContent
				frame={shown}
				isPulsing={motion.pulse}
				labelClassName={labelClassName}
				rollStyle={rollStyle}
				size={size}
			/>
			<AnimatedBadgeMeasure
				className={className}
				frame={frame}
				labelClassName={labelClassName}
				onMeasure={handleMeasure}
				size={size}
			/>
		</Animated.View>
	);
}

/**
 * A status pill whose content moves when it changes.
 *
 * On a change of status or words, the old glyph and label roll out, the new
 * ones roll in, and the capsule springs to the new width — so a status that
 * moves from "Building" to "Live" is seen to move. One paint, `Badge`'s soft
 * row, at `Badge`'s own `sm` and `md`, so the two sit level in a row.
 *
 * Not a replacement for `Badge`: no compound parts, no press, no variant axis.
 * A caller wanting composed content or a tappable tag uses `Badge`.
 *
 * Reduce motion swaps the content, sets the width and skips the layout spring.
 * The pulse — on by default for `loading` — also holds still under the app's
 * `isMotionCalm`.
 *
 * @example
 * <AnimatedBadge status={job.status}>{job.label}</AnimatedBadge>
 *
 * @example
 * <AnimatedBadge icon={IconSparkle} status="info">Suggested</AnimatedBadge>
 *
 * @example
 * <AnimatedBadge animateLayout={false} size="sm" status="info">{`${n} reviews`}</AnimatedBadge>
 */
export const AnimatedBadge = Object.assign(AnimatedBadgeRoot, {
	displayName: "DelacourUI.AnimatedBadge",
});
