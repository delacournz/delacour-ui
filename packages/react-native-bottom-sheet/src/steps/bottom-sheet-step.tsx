import type { ReactElement } from "react";
import { StyleSheet } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { stepFrame } from "../core";
import { useStepsLayout } from "./steps.context";
import type { BottomSheetStepProps } from "./steps.types";

/**
 * One step's body. Rendered by `Steps` only while it is the current step or
 * the one on its way out, so a step that is neither costs nothing.
 *
 * Absolutely positioned across the top of the stack, so two steps can overlap
 * during a change and neither pushes the other down; the stack's own height
 * is animated by `Steps` from what the current step measures here. Its frame
 * — opacity and horizontal offset — is `stepFrame` over the shared `progress`,
 * on the UI thread.
 */
export function BottomSheetStep<S extends string>({
	name,
	children,
	style,
	ref,
	onLayout,
	...props
}: BottomSheetStepProps<S>): ReactElement | null {
	const { active, outgoing, direction, transition, progress, width, onActiveLayout } = useStepsLayout();
	const role = name === active ? "incoming" : name === outgoing ? "outgoing" : null;

	const frame = useAnimatedStyle(() => {
		if (role === null) return { opacity: 0, transform: [{ translateX: 0 }] };
		const { opacity, translateX } = stepFrame(transition, role, direction, progress.value, width.value);
		return { opacity, transform: [{ translateX }] };
	});

	if (role === null) return null;

	const measure =
		role === "incoming"
			? (event: Parameters<typeof onActiveLayout>[0]): void => {
					onActiveLayout(event);
					onLayout?.(event);
				}
			: onLayout;

	return (
		<Animated.View
			onLayout={measure}
			pointerEvents={role === "incoming" ? "auto" : "none"}
			ref={ref}
			style={[styles.step, style, frame]}
			{...props}
		>
			{children}
		</Animated.View>
	);
}
BottomSheetStep.displayName = "DelacourBottomSheet.BottomSheet.Step";

const styles = StyleSheet.create({
	step: { left: 0, position: "absolute", right: 0, top: 0 },
});
