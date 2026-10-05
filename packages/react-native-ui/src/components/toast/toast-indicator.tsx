import type { ReactElement, ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { ALERT_GLYPHS } from "../alert/alert-glyphs";
import { Icon } from "../icon";
import { useToastPart } from "./toast.context";
import { toastVariants } from "./toast.variants";

export type ToastIndicatorProps = ViewProps & {
	className?: string;
	/** Replaces the status glyph — a `Spinner` while loading, an `Icon` of your own. Inherits the toast's icon size and colour. */
	children?: ReactNode;
};

/**
 * The toast's leading glyph — Alert's glyph for the same status, in Alert's
 * colour for it, so a toast and an alert saying the same thing look alike.
 *
 * As tall as the title's line, so the glyph stays level with the first line.
 * Hidden from assistive technology: the title says what happened.
 */
export function ToastIndicator({ className, children, ...props }: ToastIndicatorProps): ReactElement {
	const { status } = useToastPart("Toast.Indicator");
	return (
		<View
			accessibilityElementsHidden
			className={toastVariants().indicator({ className })}
			importantForAccessibility="no-hide-descendants"
			{...props}
		>
			{children ?? <Icon icon={ALERT_GLYPHS[status]} />}
		</View>
	);
}
ToastIndicator.displayName = "DelacourUI.Toast.Indicator";
