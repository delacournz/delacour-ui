import type { ReactElement, ReactNode } from "react";
import { Button, type ButtonProps } from "../button";
import { useSignaturePart } from "./signature.context";
import { SIGNATURE_ALTERNATIVE_LABEL, SIGNATURE_TOOLBAR_LABEL_SIZE, signatureVariants } from "./signature.variants";

export type SignatureAlternativeProps = Omit<ButtonProps, "onPress" | "children"> & {
	/** The link's text. Default "Can't sign? Type your name". */
	children?: ReactNode;
};

/**
 * The way out for anyone who cannot draw: a ghost button calling the
 * signature's `onRequestAlternative`.
 *
 * **Renders nothing unless the caller passed `onRequestAlternative`**, so it is
 * safe in a shared layout. A pad is a path a finger has to trace, and that is
 * not something an accessibility label can make possible for everyone — some
 * people need to type their name instead, and this is where they are offered it.
 * Pushed to the start of the toolbar when it sits in one. Stays enabled while
 * the pad is disabled: the pad being off is no reason to block the alternative.
 */
export function SignatureAlternative({
	children,
	className,
	size,
	variant = "ghost",
	...props
}: SignatureAlternativeProps): ReactElement | null {
	const { onRequestAlternative, isReadOnly, size: padSize } = useSignaturePart("Signature.Alternative");
	if (!onRequestAlternative || isReadOnly) return null;

	return (
		<Button
			className={signatureVariants().alternative({ className })}
			onPress={onRequestAlternative}
			size={size ?? SIGNATURE_TOOLBAR_LABEL_SIZE[padSize]}
			variant={variant}
			{...props}
		>
			{children ?? SIGNATURE_ALTERNATIVE_LABEL}
		</Button>
	);
}
SignatureAlternative.displayName = "DelacourUI.Signature.Alternative";
