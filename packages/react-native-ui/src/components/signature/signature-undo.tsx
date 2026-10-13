import type { ReactElement } from "react";
import { IconArrowUndoUp } from "../../icons/central";
import { SignatureActionButton, type SignatureActionButtonProps } from "./signature-action-button";

export type SignatureUndoProps = SignatureActionButtonProps;

/**
 * Removes the last stroke. A ghost icon button, disabled while there is nothing to do; give it
 * children to label it instead.
 */
export function SignatureUndo(props: SignatureUndoProps): ReactElement {
	return <SignatureActionButton action="undo" icon={IconArrowUndoUp} {...props} />;
}
SignatureUndo.displayName = "DelacourUI.Signature.Undo";
