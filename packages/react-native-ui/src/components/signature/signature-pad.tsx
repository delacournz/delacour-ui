import { type ReactElement, useCallback, useEffect, useMemo, useRef } from "react";
import { type AccessibilityActionEvent, type LayoutChangeEvent, StyleSheet, View, type ViewProps } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { FadeOut, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { useThemeColor } from "../../hooks/use-theme-color";
import { useFieldContext } from "../field/field.context";
import { playHaptic } from "../pressable";
import { Text } from "../text";
import { useSignaturePart } from "./signature.context";
import { shouldAddPoint } from "./signature.stroke";
import type { SignaturePoint, SignatureStroke } from "./signature.types";
import {
	describeSignature,
	resolveSignatureAccessibilityActions,
	SIGNATURE_ACCESSIBILITY_HINT,
	SIGNATURE_GUIDELINE_Y,
	type SignatureAction,
	signatureVariants,
} from "./signature.variants";
import { SignatureLivePath } from "./signature-live-path";
import { SignaturePath } from "./signature-path";

/** A cleared signature's ink fades rather than vanishing, so the clear reads as an action. */
const CLEAR_EXITING = FadeOut.duration(150);

/** How long the placeholder takes to fade on first touch, in ms. */
const PLACEHOLDER_FADE_MS = 150;

/** The guideline layer's offset from the top, as a style percentage. */
const GUIDELINE_STYLE = { top: `${SIGNATURE_GUIDELINE_Y * 100}%` } as const;

export type SignaturePadProps = Omit<ViewProps, "children" | "style"> & {
	className?: string;
};

/**
 * The drawing surface: the gesture, the ink, the guideline, the placeholder and
 * the whole accessibility surface.
 *
 * **Drawing happens on the UI thread.** One `Gesture.Pan()` samples the finger
 * into a shared value and the live stroke's path is an animated prop rebuilt
 * from it, so a finger moving across the pad renders nothing in React. When the
 * finger lifts, the stroke crosses to the JS thread once and joins the finished
 * paths — **one render per stroke, none per move**.
 *
 * **The stroke starts in `onBegin`**, with `minDistance(0)`, so a tap that never
 * moves still leaves a dot and the pad wins the touch from an enclosing scroll
 * view at once — a pad that waited for movement would lose every downstroke to
 * the scroll. `onFinalize` closes the stroke on every path, cancel included.
 *
 * **The live stroke is cleared only once its committed copy has rendered**, and
 * only if it is still the stroke that was committed. Cleared on finger-up, the
 * ink would blink out for the frame between the two; cleared unconditionally, a
 * quick second stroke — the dot on an i — would lose its first point to the
 * commit of the one before it.
 *
 * To a screen reader the pad is one element: it says whether it is empty and
 * how many strokes it holds, and offers undo, redo and clear as custom actions
 * whenever they would do something.
 */
export function SignaturePad({ className, onLayout, ...props }: SignaturePadProps): ReactElement {
	const {
		strokes,
		isEmpty,
		strokeCount,
		canUndo,
		canRedo,
		size,
		variant,
		isDisabled,
		isInvalid,
		isInteractive,
		strokeColor,
		strokeWidth,
		minDistance,
		hasGuideline,
		guidelineLabel,
		placeholder,
		haptic,
		clearCount,
		commitStroke,
		beginStroke,
		setPadSize,
		runAction,
	} = useSignaturePart("Signature.Pad");
	const field = useFieldContext();
	const slots = signatureVariants({ isDisabled, isInvalid, size, variant });
	const ink = useThemeColor(strokeColor);
	const isCalm = useCalmMotion();

	const live = useSharedValue<SignaturePoint[]>([]);
	const liveStroke = useSharedValue(0);
	const isDrawing = useSharedValue(0);
	const startTime = useSharedValue(0);
	const committedStroke = useRef(0);

	const handleStrokeEnd = useCallback(
		(stroke: SignatureStroke, id: number) => {
			committedStroke.current = id;
			commitStroke(stroke);
		},
		[commitStroke]
	);

	// Runs after every change to the finished strokes — a commit, an undo, a
	// clear — once the paths that replace the live stroke are on screen.
	// biome-ignore lint/correctness/useExhaustiveDependencies: `strokes` is the re-run trigger, see above
	useEffect(() => {
		const id = committedStroke.current;
		scheduleOnUI(() => {
			"worklet";
			if (liveStroke.value !== id) return;
			live.value = [];
			isDrawing.value = 0;
		});
	}, [isDrawing, live, liveStroke, strokes]);

	const gesture = useMemo(
		() =>
			Gesture.Pan()
				.enabled(isInteractive)
				.minDistance(0)
				.shouldCancelWhenOutside(false)
				.onBegin((event) => {
					"worklet";
					liveStroke.value += 1;
					startTime.value = Date.now();
					isDrawing.value = 1;
					live.value = [{ t: 0, x: event.x, y: event.y }];
					if (haptic !== false) playHaptic(haptic);
					scheduleOnRN(beginStroke);
				})
				.onUpdate((event) => {
					"worklet";
					const next: SignaturePoint = { t: Date.now() - startTime.value, x: event.x, y: event.y };
					if (!shouldAddPoint(live.value[live.value.length - 1], next, minDistance)) return;
					live.modify((points) => {
						"worklet";
						points.push(next);
						return points;
					});
				})
				.onFinalize(() => {
					"worklet";
					if (live.value.length === 0) return;
					scheduleOnRN(handleStrokeEnd, live.value.slice(), liveStroke.value);
				}),
		[beginStroke, handleStrokeEnd, haptic, isDrawing, isInteractive, live, liveStroke, minDistance, startTime]
	);

	const placeholderStyle = useAnimatedStyle(() => {
		const opacity = isEmpty && isDrawing.value === 0 ? 1 : 0;
		return { opacity: isCalm ? opacity : withTiming(opacity, { duration: PLACEHOLDER_FADE_MS }) };
	});

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			setPadSize(event.nativeEvent.layout.width, event.nativeEvent.layout.height);
			onLayout?.(event);
		},
		[onLayout, setPadSize]
	);

	const accessibilityActions = useMemo(
		() => resolveSignatureAccessibilityActions({ canRedo, canUndo, isEmpty, isInteractive }),
		[canRedo, canUndo, isEmpty, isInteractive]
	);

	const handleAccessibilityAction = useCallback(
		(event: AccessibilityActionEvent) => {
			const name = event.nativeEvent.actionName;
			if (isSignatureAction(name)) runAction(name);
		},
		[runAction]
	);

	return (
		<GestureDetector gesture={gesture}>
			<View
				accessibilityActions={accessibilityActions}
				accessibilityHint={isInteractive ? SIGNATURE_ACCESSIBILITY_HINT : undefined}
				accessibilityLabel={describeSignature({ label: field?.label ?? null, strokeCount })}
				accessibilityRole={isEmpty ? "none" : "image"}
				accessibilityState={{ disabled: isDisabled }}
				accessible
				className={slots.pad({ className })}
				onAccessibilityAction={handleAccessibilityAction}
				onLayout={handleLayout}
				{...props}
			>
				{hasGuideline ? (
					<View className={slots.guideline()} pointerEvents="none" style={GUIDELINE_STYLE}>
						<View className={slots.rule()} />
						{guidelineLabel ? (
							<Text.Caption className={slots.guidelineLabel()} color="muted">
								{guidelineLabel}
							</Text.Caption>
						) : null}
					</View>
				) : null}
				<Animated.View className={slots.placeholder()} pointerEvents="none" style={placeholderStyle}>
					<Text.Paragraph color="muted">{placeholder}</Text.Paragraph>
				</Animated.View>
				<Animated.View
					exiting={isCalm ? undefined : CLEAR_EXITING}
					key={clearCount}
					pointerEvents="none"
					style={StyleSheet.absoluteFill}
				>
					<SignaturePath color={ink} strokes={strokes} strokeWidth={strokeWidth} />
				</Animated.View>
				<SignatureLivePath color={ink} points={live} strokeWidth={strokeWidth} />
			</View>
		</GestureDetector>
	);
}
SignaturePad.displayName = "DelacourUI.Signature.Pad";

function isSignatureAction(name: string): name is SignatureAction {
	return name === "undo" || name === "redo" || name === "clear";
}
