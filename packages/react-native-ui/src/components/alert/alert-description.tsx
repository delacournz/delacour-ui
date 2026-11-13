import { type ReactElement, useEffect } from "react";
import { Text, type TextPresetProps } from "../text";
import { useAlertPart } from "./alert.context";
import { alertVariants, extractAlertText } from "./alert.variants";

export type AlertDescriptionProps = TextPresetProps;

/**
 * The alert's body text — always muted, whatever the status, so a long
 * explanation under a red title never shouts.
 *
 * Its text is registered with the alert, which speaks it (see `Alert`).
 */
export function AlertDescription({ className, ...props }: AlertDescriptionProps): ReactElement {
	const { size, registerText } = useAlertPart("Alert.Description");
	const text = extractAlertText(props.children);
	useEffect(() => {
		registerText("description", text);
		return () => registerText("description", "");
	}, [registerText, text]);
	return <Text className={alertVariants({ size }).description({ className })} {...props} />;
}
AlertDescription.displayName = "DelacourUI.Alert.Description";
