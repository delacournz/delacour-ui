import type { ReactElement, ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { useSignaturePart } from "./signature.context";
import { signatureVariants } from "./signature.variants";

export type SignatureToolbarProps = Omit<ViewProps, "style"> & {
	className?: string;
	children?: ReactNode;
};

/**
 * The row of actions under the pad, aligned to its end.
 *
 * **Renders nothing while the signature is read-only** — a signature on a
 * receipt is content, and an undo button beside it, even a disabled one, says
 * it could be changed.
 */
export function SignatureToolbar({ className, children, ...props }: SignatureToolbarProps): ReactElement | null {
	const { isReadOnly } = useSignaturePart("Signature.Toolbar");
	if (isReadOnly) return null;

	return (
		<View className={signatureVariants().toolbar({ className })} {...props}>
			{children}
		</View>
	);
}
SignatureToolbar.displayName = "DelacourUI.Signature.Toolbar";
