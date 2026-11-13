import type { ReactElement } from "react";
import { type AccessibilityActionEvent, Platform, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { dispatchPressableAccessibilityAction, resolvePressableActivation } from "../pressable/pressable.variants";
import { Surface } from "../surface";
import { useFlipCardPart } from "./flip-card.context";
import type { FlipCardFaceProps } from "./flip-card.types";
import {
	FLIP_CARD_ACTION_LABEL,
	type FlipCardFace,
	faceRotation,
	oppositeFace,
	resolveFaceA11y,
	resolveFaceMode,
	resolveFaceOpacity,
	resolveFaceTransform,
	resolveFlipCardActions,
	resolveFlipCardClasses,
	resolveFlipCardTriggerHint,
} from "./flip-card.variants";

/** Set on both faces. Nothing depends on it — the angle decides visibility — but iOS honours it for free. */
const BACKFACE_STYLE = { backfaceVisibility: "hidden" } as const;

/**
 * The body both faces share: an animated wrapper that turns, and a `Surface`
 * inside it that paints.
 *
 * Visibility is the angle's, not `backfaceVisibility`'s: opacity comes from
 * `resolveFaceOpacity` every frame. Reachability is React state's: the face the
 * card is turning away from is hidden from assistive technology and stops
 * taking touches the moment the turn is committed, not when it settles.
 *
 * Under `trigger="swipe"` the visible face is one accessibility element holding
 * the "Flip card" action, because a drag has no screen-reader equivalent and an
 * action needs an element to live on. Under `"press"` it stays a container, so a
 * button on a face is reached on its own, and a transparent "Flip card" button
 * is its first child — behind the content, so explore-by-touch over a control
 * still lands on the control. `resolvePressableActivation` routes its
 * activation: `onAccessibilityTap` on iOS, an `activate` action on Android.
 * Under `"manual"` the face is a plain container.
 *
 * Internal — rendered by `FlipCard.Front` and `FlipCard.Back`, never exported.
 */
export function FlipCardFaceBody({
	side,
	variant,
	padding,
	className,
	children,
}: FlipCardFaceProps & { side: FlipCardFace }): ReactElement {
	const { accessibilityLabel, axis, face, flip, isCalm, isDisabled, perspective, rotation, trigger } = useFlipCardPart(
		side === "front" ? "FlipCard.Front" : "FlipCard.Back"
	);
	const classes = resolveFlipCardClasses({ className, face: side, padding, variant });
	const isHidden = resolveFaceA11y(face)[side].hidden;
	const mode = resolveFaceMode({ hidden: isHidden, trigger });
	const isElement = mode === "grouped";
	const rest = faceRotation(side);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: resolveFaceOpacity(side, rotation.value, isCalm),
		transform: resolveFaceTransform(side, axis, isCalm ? rest : rotation.value, perspective),
	}));

	const handleAction = (event: AccessibilityActionEvent) => {
		if (event.nativeEvent.actionName === "activate") flip();
	};

	const activation = resolvePressableActivation({
		hasAccessibilityTap: false,
		hasPress: true,
		platform: Platform.OS,
	});

	const handleFlipButtonAction = (event: AccessibilityActionEvent) => {
		dispatchPressableAccessibilityAction({
			actionName: event.nativeEvent.actionName,
			activation,
			busy: false,
			disabled: isDisabled,
			onPress: flip,
		});
	};

	const handleFlipButtonTap = () => {
		if (!isDisabled) flip();
	};

	return (
		<Animated.View
			accessibilityActions={isElement ? resolveFlipCardActions(trigger) : undefined}
			accessibilityElementsHidden={isHidden}
			accessibilityLabel={isElement ? accessibilityLabel : undefined}
			accessible={isElement}
			className={classes.wrapper}
			importantForAccessibility={isHidden ? "no-hide-descendants" : "auto"}
			onAccessibilityAction={isElement ? handleAction : undefined}
			pointerEvents={isHidden ? "none" : "auto"}
			style={[BACKFACE_STYLE, animatedStyle]}
		>
			{mode === "flip-button" ? (
				<View
					accessibilityActions={activation.accessibilityActions}
					accessibilityHint={resolveFlipCardTriggerHint(oppositeFace(face))}
					accessibilityLabel={FLIP_CARD_ACTION_LABEL}
					accessibilityRole="button"
					accessibilityState={{ disabled: isDisabled }}
					accessible
					className="absolute inset-0"
					onAccessibilityAction={handleFlipButtonAction}
					onAccessibilityTap={activation.wiresAccessibilityTap ? handleFlipButtonTap : undefined}
					pointerEvents="none"
				/>
			) : null}
			<Surface className={classes.surface} padding={classes.padding} variant={classes.variant}>
				{children}
			</Surface>
		</Animated.View>
	);
}
FlipCardFaceBody.displayName = "DelacourUI.FlipCard.Face";
