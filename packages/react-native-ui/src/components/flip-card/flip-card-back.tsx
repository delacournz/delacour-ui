import type { ReactElement } from "react";
import type { FlipCardFaceProps } from "./flip-card.types";
import { FlipCardFaceBody } from "./flip-card-face";

export type FlipCardBackProps = FlipCardFaceProps;

/**
 * The face behind. Absolutely positioned over the front, so it takes the
 * footprint the front sets — content taller than the front overflows it.
 *
 * Must be opaque: a `transparent` back would show the front through it on the
 * frames either side of the swap, so it warns in development.
 */
export function FlipCardBack({ variant, ...props }: FlipCardBackProps): ReactElement {
	if (process.env.NODE_ENV !== "production" && variant === "transparent") {
		console.warn(
			'FlipCard.Back: variant="transparent" shows the front through the back mid-turn. Give the back a fill.'
		);
	}
	return <FlipCardFaceBody side="back" variant={variant} {...props} />;
}
FlipCardBack.displayName = "DelacourUI.FlipCard.Back";
