import type { ReactElement } from "react";
import { IconEraser } from "../../icons/central";
import { SignatureActionButton, type SignatureActionButtonProps } from "./signature-action-button";

export type SignatureClearProps = SignatureActionButtonProps;

/**
 * Removes every stroke. Final — it cannot be undone. A ghost icon button, disabled while there is nothing to do; give it
 * children to label it instead.
 */
export function SignatureClear(props: SignatureClearProps): ReactElement {
	return <SignatureActionButton action="clear" icon={IconEraser} {...props} />;
}
SignatureClear.displayName = "DelacourUI.Signature.Clear";
