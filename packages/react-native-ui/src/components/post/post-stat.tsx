import { type ReactElement, useEffect, useRef } from "react";
import { View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withSequence,
	withSpring,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useThemeColor } from "../../hooks/use-theme-color";
import { Icon, type IconComponent } from "../icon";
import { Pressable, type PressableProps } from "../pressable";
import { usePostPart } from "./post.context";
import { formatCompactCount, resolvePostStatLabel } from "./post.utils";
import { POST_HIT_SLOP, type PostStatTone, postVariants, resolveStatFillPath, resolveStatTone } from "./post.variants";
import { PostStatCount } from "./post-stat-count";

/** The spring the icon pops with on activation — quick, a little bouncy, settled in well under half a second. */
const POST_POP_SPRING = { damping: 12, stiffness: 420, mass: 0.6 } as const;
/** How far the icon swells at the top of its pop. */
const POST_POP_SCALE = 1.2;

export type PostStatProps = Omit<PressableProps, "asChild" | "children"> & {
	/** A Central glyph. Lit, the same glyph is drawn over a filled copy of its outline — never swapped for another. */
	icon: IconComponent;
	/**
	 * The filled outline drawn under the glyph when lit, as 24-unit SVG path data.
	 * Defaults by tone — the heart for `like`, the bookmark for `save`. `""` opts out.
	 */
	fillPath?: string;
	/** The count, or a word. Absent, the stat is a glyph alone. */
	value?: number | string;
	/** What colour it lights up. @default "neutral" */
	tone?: PostStatTone;
	/** Whether it is on — liked, saved, reposted. Caller state. @default false */
	active?: boolean;
	/** `"end"` pushes this stat, and every one after it, to the trailing edge. @default "start" */
	align?: "start" | "end";
	/** The spoken noun — `"Like"`. Read with the full number: "Like, 1,234". */
	label: string;
	/** Print numbers compactly — `1234` as `1.2K`. @default true */
	compact?: boolean;
	className?: string;
};

/**
 * One count under a post — a glyph and a number, pressed to toggle.
 *
 * Post counts nothing: `value` and `active` are the caller's, because an
 * optimistic like and the server's answer are two values only the app can
 * reconcile. What Post owns is what a press looks like — a selection haptic, a
 * scale-fade, the glyph filling with a one-shot pop, and the number rolling the
 * way it moved.
 *
 * Central Icons is an outlined set, so a lit glyph is the outline drawn over
 * a filled copy of its own path (`fillPath`). The shape never changes; only the
 * fill and the colour do.
 *
 * A screen reader hears the noun and the whole number in one stop — "Like,
 * 1,234" — with on/off as `selected` in the accessibility state.
 */
export function PostStat({
	icon,
	fillPath,
	value,
	tone = "neutral",
	active = false,
	align = "start",
	label,
	compact = true,
	className,
	accessibilityLabel,
	accessibilityState,
	haptic = "selection",
	hitSlop = POST_HIT_SLOP,
	disabled,
	...props
}: PostStatProps): ReactElement {
	const { size } = usePostPart("Post.Stat");
	const slots = postVariants({ size, tone, active, align });
	const colorToken = resolveStatTone(tone, active);
	const fillColor = useThemeColor(colorToken);
	const path = active ? resolveStatFillPath(tone, fillPath) : undefined;
	const text = typeof value === "number" ? (compact ? formatCompactCount(value) : String(value)) : value;

	const isReducedMotion = useReducedMotion();
	const scale = useSharedValue(1);
	const wasActive = useRef(active);
	useEffect(() => {
		if (active && !wasActive.current && !isReducedMotion) {
			scale.value = withSequence(withSpring(POST_POP_SCALE, POST_POP_SPRING), withSpring(1, POST_POP_SPRING));
		}
		wasActive.current = active;
	}, [active, isReducedMotion, scale]);
	const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

	return (
		<Pressable
			accessibilityLabel={accessibilityLabel ?? resolvePostStatLabel(label, value, active)}
			accessibilityRole="button"
			accessibilityState={{ ...accessibilityState, selected: active }}
			className={slots.stat({ className })}
			disabled={disabled}
			feedback="scale-fade"
			haptic={haptic}
			hitSlop={hitSlop}
			{...props}
		>
			<Animated.View className={slots.statIcon()} style={popStyle}>
				{path ? (
					<View className={slots.statFill()} pointerEvents="none">
						<Svg height="100%" viewBox="0 0 24 24" width="100%">
							<Path d={path} fill={fillColor} />
						</Svg>
					</View>
				) : null}
				<Icon className={slots.statIcon()} color={colorToken} icon={icon} />
			</Animated.View>
			{value !== undefined && text !== undefined && text !== "" ? (
				<PostStatCount className={slots.statValue()} containerClassName={slots.statCount()} text={text} value={value} />
			) : null}
		</Pressable>
	);
}
PostStat.displayName = "DelacourUI.Post.Stat";
