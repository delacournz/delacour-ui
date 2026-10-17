import type { ReactElement } from "react";
import type { AccessibilityActionEvent } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { Surface } from "../surface";
import { useFlipCardPart } from "./flip-card.context";
import type { FlipCardFaceProps } from "./flip-card.types";
import {
	type FlipCardFace,
	faceRotation,
	resolveFaceA11y,
	resolveFaceOpacity,
	resolveFaceTransform,
	resolveFlipCardActions,
	resolveFlipCardClasses,
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
 * action needs an element to live on. Under the other triggers it stays a
 * container, so a button on a face is reached on its own.
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
	const { accessibilityLabel, axis, face, flip, isCalm, perspective, rotation, trigger } = useFlipCardPart(
		side === "front" ? "FlipCard.Front" : "FlipCard.Back"
	);
	const classes = resolveFlipCardClasses({ className, face: side, padding, variant });
	const isHidden = resolveFaceA11y(face)[side].hidden;
	const isElement = trigger === "swipe" && !isHidden;
	const rest = faceRotation(side);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: resolveFaceOpacity(side, rotation.value, isCalm),
		transform: resolveFaceTransform(side, axis, isCalm ? rest : rotation.value, perspective),
	}));

	const handleAction = (event: AccessibilityActionEvent) => {
		if (event.nativeEvent.actionName === "activate") flip();
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
			<Surface className={classes.surface} padding={classes.padding} variant={classes.variant}>
				{children}
			</Surface>
		</Animated.View>
	);
}
FlipCardFaceBody.displayName = "DelacourUI.FlipCard.Face";
