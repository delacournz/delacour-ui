import type { ReactElement } from "react";
import { Button, type ButtonLabelProps } from "../button";
import { useToggleButtonPart } from "./toggle-button.context";

export type ToggleButtonLabelProps = ButtonLabelProps;

/**
 * The toggle's text.
 *
 * A `Button.Label`, and nothing more: the toggle hands its button the variant
 * for the state it is in, so the label already reads the right colour off the
 * button's context. A part of its own anyway, so a label placed outside a toggle
 * fails with a message that names the toggle rather than the button.
 */
export function ToggleButtonLabel(props: ToggleButtonLabelProps): ReactElement {
	useToggleButtonPart("ToggleButton.Label");
	return <Button.Label {...props} />;
}
ToggleButtonLabel.displayName = "DelacourUI.ToggleButton.Label";
