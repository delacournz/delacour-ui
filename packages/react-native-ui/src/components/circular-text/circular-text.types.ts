import type { ReactNode } from "react";
import type { ViewProps } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import type { TextColor, TextSize, TextWeight } from "../text/text.variants";
import type { CircularTextDirection, CircularTextSide, CircularTextSpan } from "./circular-text.variants";

/**
 * Whether, and how, the ring turns.
 *
 * `loop` turns at `speed` degrees per second, signed by `direction`. `controlled` hands the angle
 * to the caller — a scroll offset, a slider, a gesture — in degrees, and never runs a clock of its
 * own.
 */
export type CircularTextSpin =
	| { kind: "none" }
	| { kind: "loop"; speed?: number }
	| { kind: "controlled"; rotation: SharedValue<number> };

/** What stops a `loop`. Easing to a halt and back, never snapping. */
export type CircularTextPause = { kind: "none" } | { kind: "press" } | { kind: "controlled"; isPaused: boolean };

export type CircularTextProps = Omit<ViewProps, "children"> & {
	/** Plain text. A trailing separator is the caller's to write — or use `repeat`. */
	children: string;
	/** The centreline of the text, in points. Required: a ring has no intrinsic size. */
	radius: number;
	/** Which way a `loop` turns. Default `clockwise`. */
	direction?: CircularTextDirection;
	/** How much of the circle the text spans. Default `{ kind: "full" }`. */
	span?: CircularTextSpan;
	/** Whether glyph tops face away from the centre or toward it. Default `outside`. */
	side?: CircularTextSide;
	/** Default `{ kind: "none" }`. */
	spin?: CircularTextSpin;
	/** Copies of `children`, each followed by `separator`. `"fill"` estimates enough to close the ring. Default 1. */
	repeat?: number | "fill";
	/** Written after each copy when `repeat` is more than one, and stripped from the spoken label. Default `" • "`. */
	separator?: string;
	/** Default `{ kind: "none" }`. */
	pause?: CircularTextPause;
	/** Drawn in the middle, upright and still while the ring turns. Stays independently accessible. */
	centerContent?: ReactNode;
	/** A step on `Text`'s type scale. Default `xs`. */
	size?: TextSize;
	/** Default `semibold`. */
	weight?: TextWeight;
	/** A page-level text colour, from `Text`'s set. Default `default`. */
	color?: TextColor;
	/** `Text` classes — a family, a tracking, a colour. Resolved once and handed to SVG text. */
	className?: string;
	/** What a screen reader says. Default: the text once, separators stripped. */
	accessibilityLabel?: string;
};
