import type { HapticFeedback } from "../pressable/pressable";
import type { FabSize, FabVariant } from "./fab.variants";

/** The axes a `Fab` and a `Fab.Group`'s trigger share. */
export type FabSharedProps = {
	/** 44, 56 or 64pt. Default `md`. */
	size?: FabSize;
	/** Default `primary`. */
	variant?: FabVariant;
	isDisabled?: boolean;
	/** Haptic played on press. Off by default. */
	haptic?: false | HapticFeedback;
	/** Distance from the bottom and side edges, before the safe-area inset. Default 16. */
	offset?: number;
	/** Add the bottom safe-area inset to `offset`. Default `true`. Ignored in flow. */
	isSafeAreaAware?: boolean;
};
