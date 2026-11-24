import { type ReactElement, useEffect } from "react";
import { Text, type TextPresetProps } from "../text";
import { useAlertPart } from "./alert.context";
import { alertVariants, extractAlertText } from "./alert.variants";

export type AlertTitleProps = TextPresetProps;

/**
 * The alert's heading, coloured by its status.
 *
 * The colour is the same token the indicator's glyph reads, so the two are
 * always one shade — a test pins the pair.
 *
 * Its text is registered with the alert, which speaks it (see `Alert`).
 */
export function AlertTitle({ className, ...props }: AlertTitleProps): ReactElement {
	const { status, size, registerText } = useAlertPart("Alert.Title");
	const text = extractAlertText(props.children);
	useEffect(() => {
		registerText("title", text);
		return () => registerText("title", "");
	}, [registerText, text]);
	return <Text className={alertVariants({ size, status }).title({ className })} {...props} />;
}
AlertTitle.displayName = "DelacourUI.Alert.Title";
