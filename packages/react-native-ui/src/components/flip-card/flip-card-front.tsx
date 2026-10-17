import type { ReactElement } from "react";
import type { FlipCardFaceProps } from "./flip-card.types";
import { FlipCardFaceBody } from "./flip-card-face";

export type FlipCardFrontProps = FlipCardFaceProps;

/**
 * The face the card starts on. In flow, so its content sets the card's size
 * when the root's `className` does not.
 */
export function FlipCardFront(props: FlipCardFrontProps): ReactElement {
	return <FlipCardFaceBody side="front" {...props} />;
}
FlipCardFront.displayName = "DelacourUI.FlipCard.Front";
