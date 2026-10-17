import type { RefObject } from "react";
import type { ViewInstance } from "react-native";
import type { TourPlacement, TourShape, TourStepOptions } from "./tour.variants";

/**
 * What a `Tour.Step` hands its tour on mount: where it is, what its card says and how its hole
 * differs from the tour's.
 *
 * Shared by the root, which keeps the list, the step, which registers one, and the overlay, which
 * measures `ref` — three modules, so it lives in the leaf rather than in any one of them.
 */
export type TourStepEntry = {
	/** Stable per mounted step, so a re-registration replaces rather than duplicates. */
	id: string;
	order: number;
	title: string;
	description?: string;
	/** The step's own geometry; anything omitted inherits the tour's. */
	options: Partial<TourStepOptions>;
	/** The wrapper `View` the hole is measured from. */
	ref: RefObject<ViewInstance | null>;
};

/** The geometry props a tour and a step both take. */
export type TourGeometryProps = {
	/** The hole's outline. */
	shape?: TourShape;
	/** Space between the target's edge and the hole's, in points. */
	padding?: number;
	/** The hole's corner, in points. Ignored by `circle`. */
	radius?: number;
	/** Which side of the hole the card sits on. */
	placement?: TourPlacement;
};
