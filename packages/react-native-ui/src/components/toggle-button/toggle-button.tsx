import { type ReactElement, type ReactNode, useCallback, useMemo } from "react";
import { useControllableState } from "../../hooks/use-controllable-state";
import { Button, type ButtonProps } from "../button";
import {
	type ToggleButtonContextValue,
	ToggleButtonProvider,
	useToggleButtonGroupContext,
} from "./toggle-button.context";
import {
	resolveToggleButtonAccessibility,
	resolveToggleButtonVariant,
	type ToggleButtonVariant,
} from "./toggle-button.variants";
import { ToggleButtonGroup } from "./toggle-button-group";
import { ToggleButtonLabel } from "./toggle-button-label";

/** What a render-function child is handed. */
export type ToggleButtonRenderState = {
	isSelected: boolean;
	isDisabled: boolean;
};

export type ToggleButtonProps = Omit<
	ButtonProps,
	"accessibilityRole" | "accessibilityState" | "children" | "variant"
> & {
	/** Identifies the toggle inside a `ToggleButton.Group`. Required there. */
	value?: string;
	/** How the toggle paints itself, off and on. Inherited from a group when not given. */
	variant?: ToggleButtonVariant;
	/** Controlled selection. Ignored inside a group, which owns the state. */
	isSelected?: boolean;
	/** Starting state while uncontrolled and outside a group. */
	defaultSelected?: boolean;
	/** Called with the new state on every press. Not called inside a group — the group's `onSelected` is. */
	onSelected?: (isSelected: boolean) => void;
	/** Content, or a function of the toggle's state for content that changes with it. */
	children?: ReactNode | ((state: ToggleButtonRenderState) => ReactNode);
};

function ToggleButtonRoot({
	value,
	variant,
	size,
	isSelected,
	defaultSelected = false,
	onSelected,
	isDisabled,
	haptic,
	onPress,
	children,
	...props
}: ToggleButtonProps): ReactElement {
	const group = useToggleButtonGroupContext();

	// Called unconditionally, grouped or not: a hook may not sit behind a branch.
	// Inside a group its state is simply never read.
	const [ownSelected, setOwnSelected] = useControllableState<boolean>({
		defaultValue: defaultSelected,
		onChange: onSelected,
		value: isSelected,
	});

	if (process.env.NODE_ENV !== "production" && group && value === undefined) {
		console.warn(
			"ToggleButton: a <ToggleButton> inside a <ToggleButton.Group> needs a `value`, or it can never be selected."
		);
	}

	const resolvedIsSelected = group ? value !== undefined && group.selected.includes(value) : ownSelected;
	const resolvedVariant = variant ?? group?.variant ?? "default";
	const resolvedSize = size ?? group?.size;
	const resolvedIsDisabled = isDisabled ?? group?.isDisabled ?? false;

	// The caller's `onPress` runs first, then the state moves — so a handler
	// reading the state it closed over sees what the toggle was when pressed.
	const handlePress = useCallback(() => {
		onPress?.();
		if (group) {
			if (value !== undefined) group.toggle(value);
			return;
		}
		setOwnSelected(!ownSelected);
	}, [group, onPress, ownSelected, setOwnSelected, value]);

	const context = useMemo<ToggleButtonContextValue>(
		() => ({
			isDisabled: resolvedIsDisabled,
			isSelected: resolvedIsSelected,
			size: resolvedSize,
			variant: resolvedVariant,
		}),
		[resolvedIsDisabled, resolvedIsSelected, resolvedSize, resolvedVariant]
	);

	const accessibility = resolveToggleButtonAccessibility(group?.selectionMode ?? null, resolvedIsSelected);

	const content =
		typeof children === "function"
			? children({ isDisabled: resolvedIsDisabled, isSelected: resolvedIsSelected })
			: children;

	// The role, state and press handler are set after the caller's props on
	// purpose: they are what keeps the announced state and the drawn state one
	// and the same, so nothing passed in may pull them apart.
	return (
		<ToggleButtonProvider value={context}>
			<Button
				{...props}
				accessibilityRole={accessibility.accessibilityRole}
				accessibilityState={accessibility.accessibilityState}
				haptic={haptic ?? group?.haptic}
				isDisabled={resolvedIsDisabled}
				onPress={handlePress}
				size={resolvedSize}
				variant={resolveToggleButtonVariant(resolvedVariant, resolvedIsSelected)}
			>
				{content}
			</Button>
		</ToggleButtonProvider>
	);
}

/**
 * A button that stays pressed — on its own, or as one of a group.
 *
 * It is a `Button`, and draws itself with one: each state names a button
 * variant (`TOGGLE_BUTTON_APPEARANCE`), so the fill, the label colour and the
 * colour a composed `Icon` inherits all come off the button's own tables. Sizes
 * are the button's, square `icon-*` steps included, and so are `haptic`,
 * `feedback`, `isLoading` and the rest.
 *
 * On its own it is controlled with `isSelected` and `onSelected`, or
 * uncontrolled from `defaultSelected`. Inside a `ToggleButton.Group` its `value`
 * identifies it and the group owns the state.
 *
 * The state is announced, not only drawn: a toggle is a `togglebutton` that is
 * checked or not, and a member of a `single` group is a `radio` that is selected
 * or not. A square toggle holds no text, so give it an `accessibilityLabel`.
 *
 * Children may be a function of the state, for content that changes with it.
 *
 * @example
 * <ToggleButton defaultSelected>Follow</ToggleButton>
 *
 * @example
 * <ToggleButton isSelected={saved} onSelected={setSaved} variant="outline">
 *   {({ isSelected }) => (
 *     <>
 *       <Icon icon={isSelected ? IconBookmarkCheck : IconBookmark} />
 *       <ToggleButton.Label>{isSelected ? "Saved" : "Save"}</ToggleButton.Label>
 *     </>
 *   )}
 * </ToggleButton>
 *
 * @example
 * <ToggleButton.Group selectionMode="single" defaultSelected={["left"]} isSelectionRequired>
 *   <ToggleButton accessibilityLabel="Align left" size="icon-md" value="left">
 *     <Icon icon={IconAlignmentLeft} />
 *   </ToggleButton>
 *   <ToggleButton accessibilityLabel="Align centre" size="icon-md" value="center">
 *     <Icon icon={IconAlignmentCenter} />
 *   </ToggleButton>
 * </ToggleButton.Group>
 */
export const ToggleButton = Object.assign(ToggleButtonRoot, {
	/** The toggle's text. Picks its colour from the state the toggle is in. */
	Label: ToggleButtonLabel,
	/** Toggles sharing one selection, joined into a run or spaced apart. */
	Group: ToggleButtonGroup,
	displayName: "DelacourUI.ToggleButton",
});
