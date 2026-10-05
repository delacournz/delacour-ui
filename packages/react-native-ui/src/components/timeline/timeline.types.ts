import type { ReactNode } from "react";
import type { TextPresetProps } from "../text";
import type { TimelineSize, TimelineVariant } from "./timeline.variants";

/** The axes the root and `Timeline.List` both take. */
export type TimelineAxesProps = {
	/** The current event, zero-based. Events before it are completed. Default `-1` — none reached. */
	value?: number;
	variant?: TimelineVariant;
	size?: TimelineSize;
};

/**
 * The orientation, and what only a horizontal strip takes. A discriminated union,
 * so `snap` or `onColumnChange` on a vertical timeline is a type error rather
 * than a prop that silently does nothing.
 */
export type TimelineOrientationProps =
	| { orientation?: "vertical" }
	| {
			orientation: "horizontal";
			/** Settle every fling with a column at the reading edge. */
			snap?: boolean;
			/** A selection tick each time a new column reaches the reading edge. */
			haptic?: boolean;
			/** Called once per change of the column at the reading edge — the strip's left content inset. */
			onColumnChange?: (index: number) => void;
			/** The strip's scroll content. Its left padding is the reading edge. */
			contentContainerClassName?: string;
	  };

/** A text part — `Title`, `Date`, `Description`, `Meta`. */
export type TimelineTextProps = TextPresetProps;

/** A layout part that wraps its children. */
export type TimelineSlotProps = {
	className?: string;
	children?: ReactNode;
};
