import type Animated from "react-native-reanimated";
import type { AnimatedRef, SharedValue } from "react-native-reanimated";
import type { TextProps } from "../text";
import type { ScrollTextEffect, ScrollTextSplit, ScrollTextWindow } from "./scroll-text.variants";

/**
 * Where a block's progress comes from.
 *
 * - `screen` — the enclosing `Screen`'s published `scrollY`. The default.
 * - `offset` — any scrollable's offset. Without a `viewport` the window is read
 *   against the device window; with one, against that scroll view's own bounds,
 *   which is what a bounded scroller inside a card needs.
 * - `progress` — already 0..1; the geometry is the caller's.
 *
 * A scroll offset is only ever the *trigger*: the block's own page position,
 * measured on the UI thread, is what the window is read against.
 */
export type ScrollTextSource =
	| { kind: "screen" }
	| { kind: "offset"; scrollY: SharedValue<number>; viewport?: AnimatedRef<Animated.ScrollView> }
	| { kind: "progress"; progress: SharedValue<number> };

export type ScrollTextProps = Omit<TextProps, "children" | "style"> & {
	/** Plain text only — splitting rich children has no defined word boundary. */
	children: string;
	/** Default `{ kind: "colour" }`. */
	effect?: ScrollTextEffect;
	/** Default `"word"`. */
	split?: ScrollTextSplit;
	/** 0 = units reveal one after another, 1 = all together. Default 0.4. */
	overlap?: number;
	/** Default `{ kind: "screen" }`. */
	source?: ScrollTextSource;
	/** Default `{ start: 0.85, end: 0.35 }`. */
	window?: ScrollTextWindow;
};
