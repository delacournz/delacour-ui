import { type ReactElement, useState } from "react";
import { type ColorValue, type LayoutChangeEvent, StyleSheet, Text, type TextStyle, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { type SharedValue, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
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
	resolveCopies,
	resolveFillLetterSpacing,
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

type RingTypography = {
	fill: string | undefined;
	fontFamily: string | undefined;
	fontSize: number;
	fontWeight: TextStyle["fontWeight"];
	letterSpacing: number;
};

/** The parts of a resolved `Text` style SVG text can take, with React Native's own fallbacks. */
function toRingTypography(style: TextStyle): RingTypography {
	return {
		fill: toFill(style.color),
		fontFamily: typeof style.fontFamily === "string" ? style.fontFamily : undefined,
		fontSize: typeof style.fontSize === "number" ? style.fontSize : FALLBACK_FONT_SIZE,
		fontWeight: style.fontWeight,
		letterSpacing: typeof style.letterSpacing === "number" ? style.letterSpacing : 0,
	};
}

/**
 * The text's natural width, measured once per `key` by an invisible `Text`'s `onLayout`, or `null`
 * until it arrives. Keyed so a change of text or face measures again instead of reusing a stale
 * width.
 */
function useNaturalWidth(key: string): [number | null, (event: LayoutChangeEvent) => void] {
	const [measured, setMeasured] = useState<{ key: string; width: number } | null>(null);
	const onMeasure = (event: LayoutChangeEvent) => {
		setMeasured({ key, width: event.nativeEvent.layout.width });
	};
	return [measured?.key === key ? measured.width : null, onMeasure];
}

/**
 * Press-to-pause: a hold on the ring, read on the UI thread. `onBegin` and `onStart` both set the
 * flag — on the iOS simulator `onBegin` never fired for this gesture.
 */
function createPressGesture(isPressed: SharedValue<boolean>, isEnabled: boolean) {
	return Gesture.LongPress()
		.minDuration(0)
		.maxDistance(Number.MAX_SAFE_INTEGER)
		.shouldCancelWhenOutside(false)
		.enabled(isEnabled)
		.onBegin(() => {
			isPressed.value = true;
		})
		.onStart(() => {
			isPressed.value = true;
		})
		.onFinalize(() => {
			isPressed.value = false;
		});
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

	const press = createPressGesture(isPressed, pause.kind === "press" && spin.kind === "loop");
	const type = toRingTypography(typography);
	const box = resolveRingBox(radius, type.fontSize, side);
	const baseline = resolveBaselineRadius(radius, type.fontSize, side);
	const { startAngle, sweep, hasLength } = resolveSpan(span);
	const text = resolveRingText(
		children,
		resolveCopies(repeat, children, separator, resolveRingLength(baseline, sweep), type.fontSize),
		separator
	);
	const length = hasLength ? resolveRingLength(baseline, sweep) : undefined;
	const [naturalWidth, onMeasure] = useNaturalWidth(
		`${text}|${type.fontSize}|${type.fontFamily}|${String(type.fontWeight)}|${type.letterSpacing}`
	);

	const issue = resolveCircularTextIssue(radius, children);
	if (issue) {
		warnOnce(issue);
		return null;
	}

	const d = resolveCirclePath(box / 2, box / 2, baseline, startAngle, sweep, side);
	const letterSpacing =
		length === undefined || naturalWidth === null
			? type.letterSpacing
			: resolveFillLetterSpacing(length, naturalWidth, countGlyphs(text), type.letterSpacing);
	const isWaitingForWidth = length !== undefined && naturalWidth === null;

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
						style={{
							fontFamily: type.fontFamily,
							fontSize: type.fontSize,
							fontWeight: type.fontWeight,
							letterSpacing: type.letterSpacing,
						}}
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
							fill={type.fill}
							fontFamily={type.fontFamily}
							fontSize={type.fontSize}
							fontWeight={type.fontWeight === undefined ? undefined : String(type.fontWeight)}
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
