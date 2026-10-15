import type { ReactNode } from "react";

/** `Compare.Before` and `Compare.After`: a full-frame layer of arbitrary content. */
export type CompareLayerProps = {
	className?: string;
	/** Anything — an image, a themed card, a map. Laid out at the full frame size. */
	children?: ReactNode;
	testID?: string;
};
