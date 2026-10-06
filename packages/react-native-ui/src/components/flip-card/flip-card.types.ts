import type { ReactNode } from "react";
import type { SurfacePadding, SurfaceVariant } from "../surface/surface.variants";

/** Props shared by `FlipCard.Front` and `FlipCard.Back`. */
export type FlipCardFaceProps = {
	/** The face's `Surface` fill. Default: the front `"default"`, the back `"secondary"`. */
	variant?: SurfaceVariant;
	/** The face's `Surface` padding. Default `"md"`. */
	padding?: SurfacePadding;
	/** Lands on the face's `Surface`. */
	className?: string;
	children?: ReactNode;
};
