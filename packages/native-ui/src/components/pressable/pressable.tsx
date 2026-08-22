import {
	Children,
	type ComponentRef,
	type ComponentType,
	createElement,
	isValidElement,
	type ReactElement,
	type ReactNode,
	type Ref,
	useMemo,
} from "react";
import type { ViewProps } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Presets } from "react-native-pulsar";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { composeRefs } from "../../lib/compose-refs";
import { mergeProps } from "../../lib/merge-props";

const PRESS_SPRING = { damping: 18, mass: 0.4, stiffness: 320 } as const;

/**
 * Animated counterpart of each component type seen by `asChild`.
 *
 * `Animated.createAnimatedComponent` must be called once per type, never per
 * render — a fresh wrapper each render remounts the subtree.
 */
const animatedTypeCache = new WeakMap<object, ComponentType<Record<string, unknown>>>();

function resolveAnimatedType(type: unknown): ComponentType<Record<string, unknown>> {
	if (typeof type !== "function" && typeof type !== "object") {
		throw new Error("Pressable asChild expects a component element, not an intrinsic or text node.");
	}

	const key = type as object;
	const cached = animatedTypeCache.get(key);
	if (cached) return cached;

	const created = Animated.createAnimatedComponent(type as ComponentType<Record<string, unknown>>) as ComponentType<
		Record<string, unknown>
	>;
	animatedTypeCache.set(key, created);
	return created;
}

export type HapticFeedback = "selection" | "light" | "medium" | "heavy" | "success" | "warning" | "error";

/**
 * Fires a haptic preset from the UI thread.
 *
 * Every branch is a worklet, so this runs inside the gesture callback itself —
 * the tap and the haptic land in the same frame rather than waiting on a round
 * trip to the JS thread.
 */
function playHaptic(feedback: HapticFeedback): void {
	"worklet";
	switch (feedback) {
		case "selection":
			Presets.System.selection();
			return;
		case "light":
			Presets.System.impactLight();
			return;
		case "medium":
			Presets.System.impactMedium();
			return;
		case "heavy":
			Presets.System.impactHeavy();
			return;
		case "success":
			Presets.System.notificationSuccess();
			return;
		case "warning":
			Presets.System.notificationWarning();
			return;
		case "error":
			Presets.System.notificationError();
			return;
		default:
			return;
	}
}

export type PressableProps = Omit<ViewProps, "style"> & {
	children?: ReactNode;
	className?: string;
	disabled?: boolean;
	onPress?: () => void;
	onLongPress?: () => void;
	/** Haptic played on press-in. Off by default. */
	haptic?: false | HapticFeedback;
	/** Scale at full press. 1 disables the scale. */
	pressedScale?: number;
	/** Opacity at full press. 1 disables the fade. */
	pressedOpacity?: number;
	/** Render into the single child element instead of emitting a View. */
	asChild?: boolean;
	ref?: Ref<ComponentRef<typeof Animated.View>>;
};

/**
 * The interaction primitive every pressable component in this library builds on.
 *
 * Press feedback runs entirely on the UI thread: a Gesture Handler tap drives a
 * shared value, a spring maps it to scale and opacity, and the haptic fires in
 * the same worklet. Only `onPress` and `onLongPress` cross back to JS.
 *
 * Built on the Gesture API rather than a ready-made pressable so the animation,
 * the haptic and the gesture stay on one thread, and so nothing depends on
 * Gesture Handler's own `Pressable`, which was renamed in its v3.
 */
export function Pressable({
	children,
	className,
	disabled = false,
	onPress,
	onLongPress,
	haptic = false,
	pressedScale = 0.97,
	pressedOpacity = 0.9,
	asChild = false,
	ref,
	...props
}: PressableProps): ReactElement {
	const pressed = useSharedValue(0);

	const gesture = useMemo(() => {
		const tap = Gesture.Tap()
			.enabled(!disabled)
			.shouldCancelWhenOutside(true)
			.onBegin(() => {
				"worklet";
				pressed.value = withSpring(1, PRESS_SPRING);
				if (haptic) playHaptic(haptic);
			})
			.onEnd(() => {
				"worklet";
				if (onPress) runOnJS(onPress)();
			})
			.onFinalize(() => {
				"worklet";
				pressed.value = withSpring(0, PRESS_SPRING);
			});

		if (!onLongPress) return tap;

		const longPress = Gesture.LongPress()
			.enabled(!disabled)
			.shouldCancelWhenOutside(true)
			.onStart(() => {
				"worklet";
				runOnJS(onLongPress)();
			});

		return Gesture.Simultaneous(tap, longPress);
	}, [disabled, haptic, onLongPress, onPress, pressed]);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: 1 - pressed.value * (1 - pressedOpacity),
		transform: [{ scale: 1 - pressed.value * (1 - pressedScale) }],
	}));

	const content = asChild ? (
		renderAsChild(children, {
			accessibilityState: { disabled },
			accessible: true,
			className,
			ref,
			style: animatedStyle,
			...props,
		})
	) : (
		<Animated.View
			accessibilityRole="button"
			accessibilityState={{ disabled }}
			// Without this the view is not an accessibility element on iOS, and the
			// role, state and label above never reach VoiceOver — a composed label
			// on an icon-only button included. It also merges the children into one
			// element, which is what a control should be.
			accessible
			className={className}
			ref={ref}
			style={animatedStyle}
			{...props}
		>
			{children}
		</Animated.View>
	);

	return <GestureDetector gesture={gesture}>{content}</GestureDetector>;
}

/**
 * Renders the pressable's props into its single child, with no wrapper element.
 *
 * The child is rendered through the animated counterpart of its own type rather
 * than cloned as-is. A Reanimated style handed to a plain component is deep
 * frozen by React Native in development, and Reanimated's own effect then fails
 * writing to it — so the element receiving the style has to be an animated one.
 */
function renderAsChild(children: ReactNode, slotProps: Record<string, unknown>): ReactElement {
	const count = Children.count(children);
	if (count !== 1) {
		throw new Error(
			`Pressable asChild expects exactly one child element, received ${count}. Drop \`asChild\` to render a View.`
		);
	}

	const child = Children.only(children);
	if (!isValidElement(child)) {
		throw new Error("Pressable asChild expects a single React element child; text and fragments cannot take props.");
	}

	const childProps = child.props as Record<string, unknown> & { ref?: Ref<unknown> };
	const merged = mergeProps<Record<string, unknown>>(slotProps, childProps);
	merged.ref = composeRefs(slotProps.ref as Ref<unknown> | undefined, childProps.ref);

	return createElement(resolveAnimatedType(child.type), merged);
}
