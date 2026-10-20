import type { ReactElement, ReactNode } from "react";
import { Button, type ButtonProps } from "../button";
import { Icon, type IconComponent } from "../icon";
import { useSignaturePart } from "./signature.context";
import {
	SIGNATURE_ACTION_LABELS,
	SIGNATURE_TOOLBAR_BUTTON_SIZE,
	SIGNATURE_TOOLBAR_LABEL_SIZE,
	type SignatureAction,
} from "./signature.variants";

/** What every toolbar button takes: a `Button`, minus the press it owns. */
export type SignatureActionButtonProps = Omit<ButtonProps, "onPress" | "children"> & {
	/** A label, or any content, in place of the default glyph. */
	children?: ReactNode;
};

/**
 * One toolbar action — the shared body of `Signature.Undo`, `.Redo` and
 * `.Clear`, which differ only in which action and which glyph.
 *
 * Internal. **Disabled whenever its action would do nothing**, and whenever the
 * pad takes no input, so a toolbar never offers a press that is silently a
 * no-op. An explicit `isDisabled` still wins. Icon-only by default, with the
 * action's name as its accessibility label; children replace the glyph and the
 * button steps to a label size.
 */
export function SignatureActionButton({
	action,
	icon,
	children,
	size,
	variant = "ghost",
	isDisabled,
	accessibilityLabel,
	...props
}: SignatureActionButtonProps & { action: SignatureAction; icon: IconComponent }): ReactElement {
	const signature = useSignaturePart(`Signature.${ACTION_PART[action]}`);
	const isPossible = action === "undo" ? signature.canUndo : action === "redo" ? signature.canRedo : !signature.isEmpty;
	const run = signature[action];
	const resolvedSize =
		size ??
		(children === undefined
			? SIGNATURE_TOOLBAR_BUTTON_SIZE[signature.size]
			: SIGNATURE_TOOLBAR_LABEL_SIZE[signature.size]);

	return (
		<Button
			accessibilityLabel={accessibilityLabel ?? SIGNATURE_ACTION_LABELS[action]}
			isDisabled={isDisabled ?? (!signature.isInteractive || !isPossible)}
			onPress={run}
			size={resolvedSize}
			variant={variant}
			{...props}
		>
			{children ?? <Icon icon={icon} />}
		</Button>
	);
}
SignatureActionButton.displayName = "DelacourUI.Signature.ActionButton";

/** The public part each action is, for the error a part outside a signature throws. */
const ACTION_PART: Record<SignatureAction, string> = { undo: "Undo", redo: "Redo", clear: "Clear" };
