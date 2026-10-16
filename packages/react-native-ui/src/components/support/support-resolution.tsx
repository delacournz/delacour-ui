import type { ReactElement, ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { Text } from "../text";
import { supportVariants } from "./support.variants";

export type SupportResolutionProps = Omit<ViewProps, "children"> & {
	/** `"Did that help?"` */
	question?: string;
	/** The control that takes the answer is the caller's — a `Rating`, or two `Button`s. */
	children: ReactNode;
	className?: string;
};

/**
 * The end of a thread: a question and the caller's control for the answer. Swap the children for a
 * thank-you once it is answered.
 *
 * A group to assistive technology, labelled by its question; the wrapper is not one element, so the
 * control inside keeps its own role.
 */
export function SupportResolution({ question, className, children, ...props }: SupportResolutionProps): ReactElement {
	const slots = supportVariants();

	return (
		<View
			accessibilityLabel={question}
			accessible={false}
			className={slots.resolution({ className })}
			role="group"
			{...props}
		>
			{question ? <Text className={slots.resolutionQuestion()}>{question}</Text> : null}
			{children}
		</View>
	);
}
SupportResolution.displayName = "DelacourUI.Support.Resolution";
