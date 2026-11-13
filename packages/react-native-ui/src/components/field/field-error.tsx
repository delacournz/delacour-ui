import { Children, type ReactElement, type ReactNode, useEffect } from "react";
import { useAnnouncement } from "../../hooks/use-announce";
import { labelText } from "../label/label.variants";
import { Text } from "../text";
import { useFieldContext } from "./field.context";
import type { FieldTextProps } from "./field.types";
import { fieldVariants, resolveFieldErrorMessage, resolveFieldTextColor } from "./field.variants";

/**
 * `Text` renders `Animated.Text`, so its `children` may also be a Reanimated
 * `SharedValue<ReactNode>`. An error message is a string, and this part has to
 * count its children to know whether to render at all, so the narrower type is
 * both the honest one and the one that can be counted.
 */
export type FieldErrorProps = Omit<FieldTextProps, "children"> & {
	children?: ReactNode;
	/**
	 * Speak the message when it appears or changes. Default `true` — pass `false` for an app that
	 * announces validation itself, or moves focus to the error.
	 */
	announce?: boolean;
};

/**
 * What is wrong with the value.
 *
 * Renders nothing when it has no children, so
 * `<Field.Error>{errors.email}</Field.Error>` disappears on its own once the
 * value is fixed and needs no conditional at the call site.
 *
 * Deliberately **not** gated on the field's `isInvalid`. A part that swallowed
 * the children a caller actually wrote, because of a prop on a sibling, would be
 * a part whose absence is unexplainable from the call site — and pairing the two
 * is the caller's own `isInvalid={!!error}`, which is one expression, in view.
 *
 * Heard once per platform when it appears and whenever its text changes (`useAnnouncement`: iOS
 * has no live regions, so it announces; Android announces too, because a live region may not
 * speak a line that has only just mounted). Only a string or number message is spoken — an error
 * built from elements is shown but silent. `announce={false}` opts out.
 *
 * Always destructive, in a valid field as much as an invalid one: an error message is
 * never the calm case.
 *
 * **One announcement route**: `useAnnouncement`, never a live region beside it. The message
 * also joins the control's hint (it is registered with the field), so a screen reader hears it
 * wherever focus is.
 */
export function FieldError({
	className,
	color,
	children,
	announce = true,
	...props
}: FieldErrorProps): ReactElement | null {
	const field = useFieldContext();
	const isInvalid = field?.isInvalid ?? false;
	const isDisabled = field?.isDisabled ?? false;
	const isVisible = hasContent(children);

	// The control reads the error as part of its hint, so it is heard wherever
	// focus is. Only text is lent — an element has no words to read before it renders.
	const registerError = field?.registerError;
	const errorText = isVisible ? (labelText(children) ?? null) : null;
	useEffect(() => {
		if (!registerError) return;
		registerError(errorText);
		return () => registerError(null);
	}, [errorText, registerError]);

	const live = useAnnouncement(isVisible ? resolveFieldErrorMessage(children) : null, {
		channel: "announcement",
		onMount: true,
		enabled: announce,
	});

	if (!isVisible) return null;

	return (
		<Text.Caption
			className={fieldVariants({ isDisabled, isInvalid }).error({ className })}
			color={color ?? resolveFieldTextColor("error", isInvalid)}
			role="alert"
			{...live}
			role="alert"
			{...live}
			{...props}
		>
			{children}
		</Text.Caption>
	);
}
FieldError.displayName = "DelacourUI.Field.Error";

/**
 * Whether there is anything worth drawing a line of destructive text for.
 *
 * `Children.toArray` drops the `null`, `undefined` and booleans a conditional
 * child leaves behind, so `{error && <Text>{error}</Text>}` counts as empty
 * rather than as one child. An empty string is dropped too — it is what a
 * cleared validation message usually is.
 */
function hasContent(children: ReactNode): boolean {
	return Children.toArray(children).some((child) => child !== "");
}
