import type { ReactElement, ReactNode } from "react";
import { Text, type TextProps } from "../text";
import {
	LABEL_REQUIRED_MARK,
	LABEL_REQUIRED_MARK_COLOR,
	labelVariants,
	resolveLabelAccessibilityLabel,
	resolveLabelColor,
} from "./label.variants";

/**
 * `Text`'s props minus the role it already is, with two narrowed.
 *
 * `Text` renders `Animated.Text`, so its `children` and `accessibilityLabel` may
 * also be Reanimated `SharedValue`s. A label has to append its required mark to
 * its children and read them as text for a screen reader, and neither can be
 * done to a shared value, so the narrower type is the honest one — the move
 * `Field.Error` makes for the same reason.
 */
export type LabelProps = Omit<TextProps, "variant" | "children" | "accessibilityLabel"> & {
	children?: ReactNode;
	/** What a screen reader announces. Defaults to "Email, required" for a required label of plain text. */
	accessibilityLabel?: string;
	/** Appends a destructive asterisk, and announces the label as required. */
	isRequired?: boolean;
	/** Turns the label destructive, to match a control whose value is wrong. */
	isInvalid?: boolean;
	/** Fades the label, to match a control that is unavailable. */
	isDisabled?: boolean;
	/** Merged into the required mark's class. */
	requiredMarkClassName?: string;
};

/**
 * The name of a form control.
 *
 * Renders `Text.Label` and passes it a colour, never a size or a weight, so the
 * type scale stays the preset's. `isInvalid` turns it destructive and
 * `isDisabled` fades it, to read as one state with the control beside it.
 *
 * `isRequired` appends an asterisk as a **nested** `Text` rather than a sibling,
 * with a no-break space in front of it, so a label long enough to wrap carries
 * the mark on its last line, glued to its last word, instead of in a column of
 * its own. A nested run is read as part of the label's text, so a required label
 * whose children are text is announced as "Email, required" rather than
 * "Email, star". Pass `accessibilityLabel` when the children are not text.
 *
 * A standalone primitive: it reads no context, so its state is whatever it is
 * told. `Field.Label` is the field-aware counterpart — it reads a `Field`'s
 * state for itself, and colours and fades exactly as this does, which a test
 * holds. Reach for this one outside a `Field`, or inside one when the label has
 * to say "required", which `Field.Label` does not.
 *
 * There is no `htmlFor`: React Native has no label-for-control association. On
 * Android, give the label a `nativeID` and the control
 * `accessibilityLabelledBy` with the same string.
 *
 * @example
 * <Label isRequired>Email</Label>
 *
 * @example
 * <Label isInvalid={!isValid} isRequired>
 *   Email
 * </Label>
 */
export function Label({
	accessibilityLabel,
	accessibilityState,
	children,
	className,
	color,
	isDisabled = false,
	isInvalid = false,
	isRequired = false,
	requiredMarkClassName,
	...props
}: LabelProps): ReactElement {
	const slots = labelVariants({ isDisabled, isInvalid });

	return (
		<Text.Label
			accessibilityLabel={resolveLabelAccessibilityLabel({ accessibilityLabel, children, isRequired })}
			accessibilityState={isDisabled ? { ...accessibilityState, disabled: true } : accessibilityState}
			className={slots.root({ className })}
			color={color ?? resolveLabelColor(isInvalid)}
			{...props}
		>
			{children}
			{isRequired ? (
				<Text className={slots.requiredMark({ className: requiredMarkClassName })} color={LABEL_REQUIRED_MARK_COLOR}>
					{` ${LABEL_REQUIRED_MARK}`}
				</Text>
			) : null}
		</Text.Label>
	);
}
Label.displayName = "DelacourUI.Label";
