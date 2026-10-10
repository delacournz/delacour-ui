import type { ReactElement, ReactNode } from "react";
import type { TextProps } from "react-native";
import { Text } from "../text";
import { useProgressButtonLayer, useProgressButtonPart } from "./progress-button.context";
import { progressButtonVariants } from "./progress-button.variants";

export type ProgressButtonLabelProps = Omit<TextProps, "children"> & {
	children: ReactNode;
	className?: string;
};

/**
 * The button's text.
 *
 * Rendered twice by the root, once per layer, and picks its colour from the
 * layer it is in: the variant colour on the resting surface, the variant's
 * foreground inside the fill. The two copies share every other class, so they
 * wrap the same and the wipe's edge falls inside a glyph.
 */
export function ProgressButtonLabel({ className, ...props }: ProgressButtonLabelProps): ReactElement {
	const { variant, size } = useProgressButtonPart("ProgressButton.Label");
	const layer = useProgressButtonLayer();
	const slots = progressButtonVariants({ size, variant });
	const resolved = layer === "fill" ? slots.fillLabel({ className }) : slots.label({ className });
	return <Text className={resolved} {...props} />;
}
ProgressButtonLabel.displayName = "DelacourUI.ProgressButton.Label";
