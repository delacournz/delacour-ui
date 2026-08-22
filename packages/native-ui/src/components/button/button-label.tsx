import type { ReactElement } from "react";
import { Text, type TextProps } from "react-native";
import { useButtonPart } from "./button.context";
import { buttonLabelVariants } from "./button.variants";

export type ButtonLabelProps = TextProps & { className?: string };

/**
 * The button's text.
 *
 * Carries its own colour and type scale, read from the button's context: a
 * React Native `View` does not cascade colour to a `Text` descendant, so a
 * colour set on the root would be lost.
 */
export function ButtonLabel({ className, ...props }: ButtonLabelProps): ReactElement {
	const { variant, size } = useButtonPart("Button.Label");
	return <Text className={buttonLabelVariants({ className, size, variant })} {...props} />;
}
