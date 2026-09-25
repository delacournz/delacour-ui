import {
	BottomSheet as Headless,
	type BottomSheetOverlayProps as HeadlessProps,
} from "@delacour/react-native-bottom-sheet";
import type { ReactElement } from "react";
import { withUniwind } from "uniwind";
import {
	BOTTOM_SHEET_BACKDROP_INDICES,
	BOTTOM_SHEET_OVERLAY_OPACITY,
	bottomSheetVariants,
} from "./bottom-sheet.variants";

type StyledOverlayComponent = (props: HeadlessProps & { className?: string }) => ReactElement | null;

// Third-party to Uniwind, so `className` needs the wrapper, built once at
// module scope.
const StyledOverlay = withUniwind(Headless.Overlay) as unknown as StyledOverlayComponent;

export type BottomSheetOverlayProps = HeadlessProps & {
	className?: string;
};

/**
 * The scrim over the app behind the sheet.
 *
 * `bg-overlay`, a token that carries its own alpha, so the `opacity` here is 1
 * and the two theme variants can differ. The engine fades it with the sheet's
 * index — never with the keyboard — and makes it a plain `Pressable` written
 * before the panel, which is what lets a tap on a field inside the sheet reach
 * the field.
 *
 * Omit it and the sheet has no scrim at all. `pressBehavior="none"` keeps it
 * and makes it inert, for a sheet that must be answered.
 *
 * @example
 * <BottomSheet.Overlay />
 *
 * @example
 * <BottomSheet.Overlay pressBehavior="none" />
 */
export function BottomSheetOverlay({
	appearsOnIndex = BOTTOM_SHEET_BACKDROP_INDICES.appearsOnIndex,
	className,
	disappearsOnIndex = BOTTOM_SHEET_BACKDROP_INDICES.disappearsOnIndex,
	opacity = BOTTOM_SHEET_OVERLAY_OPACITY,
	...props
}: BottomSheetOverlayProps): ReactElement {
	return (
		<StyledOverlay
			appearsOnIndex={appearsOnIndex}
			className={bottomSheetVariants().overlay({ className })}
			disappearsOnIndex={disappearsOnIndex}
			opacity={opacity}
			{...props}
		/>
	);
}
BottomSheetOverlay.displayName = "DelacourUI.BottomSheet.Overlay";
