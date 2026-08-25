import {
	BottomSheetBackdrop,
	type BottomSheetBackdropProps,
	useBottomSheet as useGorhomBottomSheet,
} from "@gorhom/bottom-sheet";
import type { ReactElement, ReactNode } from "react";
import { StyleSheet } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { withUniwind } from "uniwind";
import { Pressable } from "../pressable";
import {
	BOTTOM_SHEET_BACKDROP_INDICES,
	BOTTOM_SHEET_OVERLAY_OPACITY,
	bottomSheetVariants,
} from "./bottom-sheet.variants";

/**
 * gorhom's backdrop is third-party and takes a `style`, never a `className`, and
 * it is a leaf — there is no inner view to hang classes on the way
 * `BottomSheet.Content` and `BottomSheet.Footer` do. So it is wrapped, once, at
 * module scope. In render `withUniwind` would mint a new component type every
 * frame and remount the scrim mid-fade. See AGENTS.md rule 7.
 */
const StyledBackdrop = withUniwind(BottomSheetBackdrop);

export type BottomSheetOverlayProps = Partial<BottomSheetBackdropProps> & {
	className?: string;
	/**
	 * Opacity at full appearance.
	 *
	 * Defaults to 1 rather than gorhom's 0.5, because `--color-overlay` carries
	 * its own alpha — the two would otherwise multiply and land the scrim at a
	 * fifth of what the theme asked for.
	 */
	opacity?: number;
	/** Snap index the scrim is fully in by. @default 0, the first snap point */
	appearsOnIndex?: number;
	/** Snap index the scrim is gone by. @default -1, the closed position */
	disappearsOnIndex?: number;
	/** Let touches reach the app behind the scrim. @default false */
	enableTouchThrough?: boolean;
	/** Close the sheet when the scrim is pressed. @default true */
	isCloseOnPress?: boolean;
	/** Announced on the pressable scrim. Ignored when it does not close. */
	accessibilityLabel?: string;
	onPress?: () => void;
	children?: ReactNode;
};

/**
 * The scrim over the app behind the sheet.
 *
 * **It is not rendered where it is written.** gorhom takes the backdrop as a
 * `backdropComponent` render prop rather than as a child, so
 * `BottomSheet.Portal` lifts this element out of its own children, publishes it
 * on context, and `BottomSheet.Container` clones it into that slot with the
 * sheet's animated position attached. Writing it as a sibling of the container is
 * what makes the anatomy read like the thing it draws.
 *
 * Omit it and the sheet has no scrim at all — gorhom's own default for
 * `backdropComponent` is nothing.
 *
 * **gorhom's own press handling is deliberately turned off, and the press area
 * is rebuilt here.** Its backdrop puts a full-screen `Gesture.Tap()` behind the
 * sheet, and Gesture Handler resolves a touch between competing GESTURES: a
 * `Button` in the sheet has one of its own and wins, but a `TextInput` has none,
 * so the backdrop takes the tap and the sheet closes instead of the field
 * focusing. That is why gorhom ships its own `BottomSheetTextInput` — and taking
 * that route would mean this package's `Input`, with its variants, its
 * `Input.Group` and its `Field` cascade, could not be used in a sheet at all.
 *
 * So the scrim keeps `pressBehavior="none"` — no gesture anywhere — and a
 * `Pressable` is laid over the region ABOVE the sheet, sized from the sheet's own
 * `animatedPosition`. It never overlaps the sheet, so there is nothing for it to
 * take, and pressing the part of the scrim anyone can actually see still closes.
 * The colour and the fade stay gorhom's, driven off the sheet's position on the
 * UI thread; the slot therefore carries no `opacity-*`, or a class and an
 * animated style would be two writers of one property.
 *
 * @example
 * <BottomSheet.Overlay />
 *
 * @example
 * // A scrim that does not close the sheet — a decision the caller has to make.
 * <BottomSheet.Overlay isCloseOnPress={false} />
 */
export function BottomSheetOverlay({
	accessibilityLabel = "Close",
	animatedIndex,
	animatedPosition,
	appearsOnIndex = BOTTOM_SHEET_BACKDROP_INDICES.appearsOnIndex,
	className,
	disappearsOnIndex = BOTTOM_SHEET_BACKDROP_INDICES.disappearsOnIndex,
	isCloseOnPress = true,
	opacity = BOTTOM_SHEET_OVERLAY_OPACITY,
	onPress,
	...props
}: BottomSheetOverlayProps): ReactElement {
	if (animatedIndex === undefined || animatedPosition === undefined) {
		throw new Error(
			"BottomSheet.Overlay must be written inside a <BottomSheet.Portal>, beside its <BottomSheet.Container>."
		);
	}

	return (
		<>
			<StyledBackdrop
				animatedIndex={animatedIndex}
				animatedPosition={animatedPosition}
				appearsOnIndex={appearsOnIndex}
				className={bottomSheetVariants().overlay({ className })}
				disappearsOnIndex={disappearsOnIndex}
				opacity={opacity}
				pressBehavior="none"
				{...props}
			/>
			{isCloseOnPress ? (
				<BottomSheetOverlayPressArea
					accessibilityLabel={accessibilityLabel}
					animatedPosition={animatedPosition}
					onPress={onPress}
				/>
			) : null}
		</>
	);
}
BottomSheetOverlay.displayName = "DelacourUI.BottomSheet.Overlay";

/**
 * The pressable band between the top of the screen and the top of the sheet.
 *
 * Its height is the sheet's own `animatedPosition`, so it grows and shrinks with
 * the sheet on the UI thread and stops exactly where the sheet begins — which is
 * the whole point. The `Pressable` is a child rather than the animated view
 * itself because `Pressable` takes no `style`: its own `Animated.View` already
 * owns one, and a second would fight it for prop ownership every frame.
 *
 * It reads gorhom's `useBottomSheet()` rather than this package's. The backdrop
 * is rendered by gorhom's own container, OUTSIDE the children
 * `BottomSheet.Container` re-publishes its context around, so the sheet's own
 * handle is the one thing in scope here — and closing through it lands on
 * `onDismiss`, which is where `onOpenChange` already is.
 */
function BottomSheetOverlayPressArea({
	accessibilityLabel,
	animatedPosition,
	onPress,
}: {
	accessibilityLabel: string;
	animatedPosition: NonNullable<BottomSheetBackdropProps["animatedPosition"]>;
	onPress?: () => void;
}): ReactElement {
	const { close } = useGorhomBottomSheet();

	const style = useAnimatedStyle(() => ({ height: Math.max(0, animatedPosition.value) }));

	const handlePress = () => {
		onPress?.();
		close();
	};

	return (
		<Animated.View style={[styles.pressArea, style]}>
			<Pressable
				accessibilityLabel={accessibilityLabel}
				accessibilityRole="button"
				className="flex-1"
				feedback="none"
				onPress={handlePress}
			/>
		</Animated.View>
	);
}
BottomSheetOverlayPressArea.displayName = "DelacourUI.BottomSheet.Overlay.PressArea";

// A style rather than a class: the height beside it is an animated value, and the
// two have to arrive on the same node.
const styles = StyleSheet.create({
	pressArea: { left: 0, position: "absolute", right: 0, top: 0 },
});
