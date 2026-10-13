import type { ReactElement } from "react";
import { IconArrowRedoDown } from "../../icons/central";
import { SignatureActionButton, type SignatureActionButtonProps } from "./signature-action-button";

export type SignatureRedoProps = SignatureActionButtonProps;

/**
 * Restores the last stroke undone. A ghost icon button, disabled while there is nothing to do; give it
 * children to label it instead.
 */
export function SignatureRedo(props: SignatureRedoProps): ReactElement {
	return <SignatureActionButton action="redo" icon={IconArrowRedoDown} {...props} />;
}
SignatureRedo.displayName = "DelacourUI.Signature.Redo";
