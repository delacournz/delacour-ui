export { Splitter, type SplitterProps } from "./splitter";
export { type SplitterContextValue, useSplitter, useSplitterContext } from "./splitter.context";
export {
	clamp,
	fractionToPercent,
	nearestSnapIndex,
	percentToFraction,
	projectSnap,
	snapToStep,
} from "./splitter.math";
export type { SplitterSlotProps } from "./splitter.types";
export {
	fitLayout,
	resolveCollapseToggle,
	resolveDrag,
	resolveDragEnd,
	resolveInitialLayout,
	resolveKeyboardStep,
	SPLITTER_DEFAULT_ORIENTATION,
	SPLITTER_DEFAULT_STEP,
	SPLITTER_DEFAULT_VARIANT,
	SPLITTER_ORIENTATIONS,
	SPLITTER_VARIANTS,
	type SplitterLayout,
	type SplitterOrientation,
	type SplitterPaneConstraints,
	type SplitterVariant,
	type SplitterVariantProps,
	splitterVariants,
} from "./splitter.variants";
export type { SplitterHandleProps } from "./splitter-handle";
export type { SplitterPaneProps } from "./splitter-pane";
