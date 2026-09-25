import { type ReactElement, type ReactNode, useCallback, useMemo } from "react";
import { View, type ViewProps } from "react-native";
import { useControllableState } from "../../hooks/use-controllable-state";
import { Button } from "../button";
import type { ButtonSize } from "../button/button.variants";
import type { HapticFeedback, PressableFeedback } from "../pressable";
import { type ToggleButtonGroupContextValue, ToggleButtonGroupProvider } from "./toggle-button.context";
import {
	resolveToggleSelection,
	type ToggleButtonGroupLayout,
	type ToggleButtonGroupOrientation,
	type ToggleButtonSelectionMode,
	type ToggleButtonVariant,
	toggleButtonVariants,
} from "./toggle-button.variants";

export type ToggleButtonGroupProps = Omit<ViewProps, "children"> & {
	/** `multiple` marks independently; `single` is an either-or choice. Default `multiple`. */
	selectionMode?: ToggleButtonSelectionMode;
	/** The `value` of every selected toggle. Controlled. */
	selected?: string[];
	/** The values selected to begin with, while uncontrolled. */
	defaultSelected?: string[];
	/** Called with the whole new list. Never called for a press that changes nothing. */
	onSelected?: (selected: string[]) => void;
	/** Refuse to clear the last selection — a re-press of it does nothing. */
	isSelectionRequired?: boolean;
	/** `attached` joins the toggles into one run; `detached` spaces them apart. Default `attached`. */
	layout?: ToggleButtonGroupLayout;
	/** Which way the toggles run. Default `horizontal`. */
	orientation?: ToggleButtonGroupOrientation;
	/** A default every toggle takes unless it names its own. */
	variant?: ToggleButtonVariant;
	/** Shared by every toggle. An attached group owns the step outright. */
	size?: ButtonSize;
	/** Disables every toggle that does not say otherwise. */
	isDisabled?: boolean;
	/** Haptic for every toggle that does not name its own. */
	haptic?: false | HapticFeedback;
	/** Press treatment for every toggle. Unset, an attached toggle fades rather than scaling. */
	feedback?: PressableFeedback;
	className?: string;
	children?: ReactNode;
};

function ToggleButtonGroupRoot({
	selectionMode = "multiple",
	selected,
	defaultSelected = EMPTY,
	onSelected,
	isSelectionRequired = false,
	layout = "attached",
	orientation = "horizontal",
	variant,
	size,
	isDisabled,
	haptic,
	feedback,
	className,
	children,
	...props
}: ToggleButtonGroupProps): ReactElement {
	const [values, setValues] = useControllableState<string[]>({
		defaultValue: defaultSelected,
		onChange: onSelected,
		value: selected,
	});

	const toggle = useCallback(
		(value: string) => {
			const next = resolveToggleSelection({ current: values, isSelectionRequired, selectionMode, value });
			if (next !== null) setValues(next);
		},
		[isSelectionRequired, selectionMode, setValues, values]
	);

	const context = useMemo<ToggleButtonGroupContextValue>(
		() => ({ haptic, isDisabled, layout, orientation, selected: values, selectionMode, size, toggle, variant }),
		[haptic, isDisabled, layout, orientation, selectionMode, size, toggle, values, variant]
	);

	// A single-choice group is a radio group, and says so. A set of independent
	// marks is a container with no action of its own, so it announces nothing —
	// the same call `Button.Group` makes.
	const accessibilityRole = selectionMode === "single" ? "radiogroup" : undefined;

	return (
		<ToggleButtonGroupProvider value={context}>
			{layout === "attached" ? (
				<Button.Group
					accessibilityRole={accessibilityRole}
					className={className}
					feedback={feedback}
					orientation={orientation}
					size={size}
					{...props}
				>
					{children}
				</Button.Group>
			) : (
				<View
					accessibilityRole={accessibilityRole}
					className={toggleButtonVariants({ layout, orientation }).group({ className })}
					{...props}
				>
					{children}
				</View>
			)}
		</ToggleButtonGroupProvider>
	);
}

/**
 * A stable empty list, so an uncontrolled group does not seed its state from a
 * fresh array on every render.
 */
const EMPTY: string[] = [];

/**
 * Toggles sharing one selection.
 *
 * State is one array of the members' `value`s, controlled with `selected` and
 * `onSelected` or held by the group from `defaultSelected`. `selectionMode`
 * decides what a press does: `multiple` adds or removes the one pressed, while
 * `single` replaces the selection with it. `isSelectionRequired` keeps the last
 * one from being cleared — a segmented choice always has an answer.
 *
 * `attached` — the default — renders a `Button.Group`, so the toggles join into
 * one run with shared corners and a hairline seam, and `Button.Group.Separator`
 * works between them. `detached` spaces them apart and wraps, for a row of
 * filters.
 *
 * `variant`, `size`, `isDisabled` and `haptic` are defaults a member may
 * override, so one option can disable itself. An attached group owns the size
 * step outright, because controls of different heights do not join; a square
 * member stays square.
 *
 * @example
 * <ToggleButton.Group defaultSelected={["bold"]} variant="ghost">
 *   <ToggleButton accessibilityLabel="Bold" size="icon-md" value="bold">
 *     <Icon icon={IconBold} />
 *   </ToggleButton>
 *   <ToggleButton accessibilityLabel="Italic" size="icon-md" value="italic">
 *     <Icon icon={IconItalic} />
 *   </ToggleButton>
 * </ToggleButton.Group>
 *
 * @example
 * <ToggleButton.Group layout="detached" onSelected={setFilters} selected={filters} size="sm" variant="outline">
 *   <ToggleButton value="open">Open</ToggleButton>
 *   <ToggleButton value="closed">Closed</ToggleButton>
 * </ToggleButton.Group>
 */
export const ToggleButtonGroup = Object.assign(ToggleButtonGroupRoot, {
	displayName: "DelacourUI.ToggleButton.Group",
});
