import type { ReactNode } from "react";
import type { ViewProps } from "react-native";
import type { ScreenEdge, ScreenPlacement } from "./screen.variants";

/**
 * The shape of a container that can inset itself against the safe area.
 *
 * Shared by `Screen.Content` and `Screen.Header`, so it lives in a leaf rather
 * than in one of them arbitrarily.
 */
export type ScreenInsetProps = ViewProps & {
	/** Safe-area edges to pad against. None by default. */
	insets?: readonly ScreenEdge[];
	className?: string;
	children?: ReactNode;
};

/**
 * The shape of a part that either overlays the content or sits in the flow.
 *
 * Shared by `Screen.Navbar` and `Screen.Footer` — the two parts a scrollable
 * has to clear, and the reason `placement` is one axis rather than a boolean on
 * each of them.
 */
export type ScreenPlacementProps = ViewProps & {
	/**
	 * `overlay` floats the part over the content, which then insets itself by
	 * the measured height. `static` puts it in the flow, taking its own space.
	 */
	placement?: ScreenPlacement;
	className?: string;
	children?: ReactNode;
};

/**
 * What every Screen scrollable accepts on top of its own list props.
 *
 * `header` is separate from a list's `ListHeaderComponent` on purpose: the
 * screen composes its navbar spacer, this header and the caller's list header
 * in that order, so a caller can use both without having to interleave them.
 */
export type ScreenScrollableProps = {
	/** Rendered above the content, below the navbar spacer. */
	header?: ReactNode;
	className?: string;
	contentContainerClassName?: string;
};
