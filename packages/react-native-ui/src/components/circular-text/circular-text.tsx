import { type ReactElement, useState } from "react";
import { type ColorValue, type LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { useResolveClassNames } from "uniwind";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { resolveTextClass } from "../text/text.variants";
import type { CircularTextProps } from "./circular-text.types";
import {
	CIRCULAR_TEXT_DEFAULT_SEPARATOR,
	countGlyphs,
	resolveBaselineRadius,
	resolveCirclePath,
	resolveCircularTextIssue,
	resolveFillLetterSpacing,
	resolveRepeatCount,
	resolveRingBox,
	resolveRingLabel,
	resolveRingLength,
	resolveRingText,
	resolveSpan,
} from "./circular-text.variants";
import { CircularTextRing } from "./circular-text-ring";
import { useCircularSpin } from "./circular-text-spin";

/** React Native's own default, for a class chain that somehow resolved no size. */
const FALLBACK_FONT_SIZE = 14;

/** Messages already warned about, so a ring re-rendering with a bad prop warns once, not per frame. */
const warned = new Set<string>();

function warnOnce(message: string): void {
	if (!__DEV__ || warned.has(message)) return;
	warned.add(message);
	console.warn(message);
}

/** A colour SVG `fill` can take: Uniwind resolves a token to a string, never a platform colour object. */
function toFill(color: ColorValue | undefined): string | undefined {
	return typeof color === "string" ? color : undefined;
}

function CircularTextRoot({
	accessibilityLabel,
	centerContent,
	children,
	className,
	color,
	direction = "clockwise",
	pause = { kind: "none" },
	radius,
	repeat = 1,
	separator = CIRCULAR_TEXT_DEFAULT_SEPARATOR,
	side = "outside",
	size = "xs",
	span = { kind: "full" },
	spin = { kind: "none" },
	style,
	weight = "semibold",
	...props
}: CircularTextProps): ReactElement | null {
	const isCalm = useCalmMotion();
	const isPressed = useSharedValue(false);
	const typography = useResolveClassNames(resolveTextClass({ className, color, size, weight }));
	const rotation = useCircularSpin({
		direction,
		isCalm,
		isPaused: pause.kind === "controlled" && pause.isPaused,
		isPressed,
		spin,
	});

	const controlled = spin.kind === "controlled" ? spin.rotation : null;
	const rotationStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${controlled ? controlled.value : rotation.value}deg` }],
	}));

	const [measured, setMeasured] = useState<{ key: string; width: number } | null>(null);

	const press = Gesture.LongPress()
		.minDuration(0)
		.maxDistance(Number.MAX_SAFE_INTEGER)
		.shouldCancelWhenOutside(false)
		.enabled(pause.kind === "press" && spin.kind === "loop")
		.onBegin(() => {
			isPressed.value = true;
		})
		.onStart(() => {
			isPressed.value = true;
		})
		.onFinalize(() => {
			isPressed.value = false;
		});

	const issue = resolveCircularTextIssue(radius, children);
	if (issue) {
		warnOnce(issue);
		return null;
	}

	const fontSize = typeof typography.fontSize === "number" ? typography.fontSize : FALLBACK_FONT_SIZE;
	const box = resolveRingBox(radius, fontSize, side);
	const baseline = resolveBaselineRadius(radius, fontSize, side);
	const { startAngle, sweep, hasLength } = resolveSpan(span);
	const d = resolveCirclePath(box / 2, box / 2, baseline, startAngle, sweep, side);

	const copies =
		repeat === "fill"
			? resolveRepeatCount(
					resolveRingLength(baseline, sweep),
					countGlyphs(children.endsWith(separator) ? children.slice(0, -separator.length) : children),
					fontSize,
					countGlyphs(separator)
				)
			: repeat;

	const text = resolveRingText(children, copies, separator);
	const fontFamily = typeof typography.fontFamily === "string" ? typography.fontFamily : undefined;
	const fontWeight = typography.fontWeight === undefined ? undefined : String(typography.fontWeight);
	const baseSpacing = typeof typography.letterSpacing === "number" ? typography.letterSpacing : 0;
	const length = hasLength ? resolveRingLength(baseline, sweep) : undefined;
	const measureKey = `${text}|${fontSize}|${fontFamily}|${fontWeight}|${baseSpacing}`;
	const naturalWidth = measured?.key === measureKey ? measured.width : null;
	const letterSpacing =
		length === undefined || naturalWidth === null
			? baseSpacing
			: resolveFillLetterSpacing(length, naturalWidth, countGlyphs(text), baseSpacing);
	const isWaitingForWidth = length !== undefined && naturalWidth === null;
	const onMeasure = (event: LayoutChangeEvent) => {
		setMeasured({ key: measureKey, width: event.nativeEvent.layout.width });
	};

	// `textLength` alone would close the ring, but iOS ignores it, so a spanned ring measures its text
	// once with the platform's own shaper — an invisible, unwrapped `Text` in the same face — and
	// spreads the difference as letter spacing. The ring stays hidden until then, so it never
	// appears with a gap and jumps shut.
	//
	// The ring and its label sit on a View that does not turn, so a screen reader's focus frame stays
	// square while the glyphs rotate. `centerContent` is a sibling drawn over it, not a child, so an
	// icon button there keeps its own role; it passes touches it does not handle through to the ring.
	return (
		<View {...props} style={[{ height: box, width: box }, style]}>
			{length === undefined ? null : (
				<View pointerEvents="none" style={styles.measure}>
					<Text
						accessibilityElementsHidden
						allowFontScaling={false}
						importantForAccessibility="no-hide-descendants"
						numberOfLines={1}
						onLayout={onMeasure}
						style={{ fontFamily, fontSize, fontWeight: typography.fontWeight, letterSpacing: baseSpacing }}
					>
						{text}
					</Text>
				</View>
			)}
			<GestureDetector gesture={press}>
				<View
					accessibilityLabel={accessibilityLabel ?? resolveRingLabel(children, separator)}
					accessibilityRole="text"
					accessible
					style={StyleSheet.absoluteFill}
				>
					<Animated.View style={[StyleSheet.absoluteFill, rotationStyle, isWaitingForWidth && styles.hidden]}>
						<CircularTextRing
							box={box}
							d={d}
							fill={toFill(typography.color)}
							fontFamily={fontFamily}
							fontSize={fontSize}
							fontWeight={fontWeight}
							letterSpacing={letterSpacing === 0 ? undefined : letterSpacing}
							text={text}
							textLength={length}
						/>
					</Animated.View>
				</View>
			</GestureDetector>
			{centerContent === undefined || centerContent === null ? null : (
				<View pointerEvents="box-none" style={[StyleSheet.absoluteFill, styles.center]}>
					{centerContent}
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	center: { alignItems: "center", justifyContent: "center" },
	hidden: { opacity: 0 },
	measure: { alignItems: "flex-start", left: 0, opacity: 0, position: "absolute", top: 0, width: 100_000 },
});

/**
 * Text set around a circle, optionally turning — a seal, a badge, a "scroll down" ring, a loading
 * ring, an arc of words over a mark.
 *
 * The ring's size is `radius`, the centreline of the type; typography is `Text`'s scale. Spinning
 * turns the whole drawing on the UI thread, eases to a halt on a pause with no snap, and holds
 * still at 0° under reduce motion or `isMotionCalm` — a `controlled` angle still follows its caller.
 *
 * @example
 * ```tsx
 * <CircularText radius={72} repeat="fill" spin={{ kind: "loop" }} centerContent={<Icon icon={IconStar} />}>
 *   DELACOUR UI
 * </CircularText>
 * ```
 *
 * @example
 * ```tsx
 * <CircularText radius={60} span={{ kind: "arc", sweep: 140 }} size="sm">
 *   Handmade in Wellington
 * </CircularText>
 * ```
 */
export const CircularText = Object.assign(CircularTextRoot, {
	displayName: "DelacourUI.CircularText",
});
