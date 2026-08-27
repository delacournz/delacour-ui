import { type ReactElement, useCallback, useMemo } from "react";
import { View, type ViewProps } from "react-native";
import { useControllableState } from "@registry/hooks/use-controllable-state";
import { useFieldContext } from "@registry/ui/field/field.context";
import { type RadioGroupContextValue, RadioGroupProvider } from "./radio.context";
import {
	type RadioOrientation,
	type RadioSize,
	type RadioVariant,
	radioVariants,
	shouldEmitSelection,
} from "./radio.variants";

export type RadioGroupProps = ViewProps & {
	/**
	 * The selected radio's value.
	 *
	 * `null` means "controlled, nothing selected". Omitting the prop entirely is
	 * what makes the group uncontrolled, so a `useState<string>()` seeded with
	 * `undefined` would silently hand the group its own state and then switch it
	 * to controlled on the first press. Pass `value ?? null`.
	 */
	selected?: string | null;
	/** Initial selection while uncontrolled. */
	defaultSelected?: string | null;
	/** Called with the newly selected value. Never called for a re-press of the current one. */
	onSelected?: (value: string) => void;
	/** Size of every radio in the group. */
	size?: RadioSize;
	/** How every ring in the group is painted. */
	variant?: RadioVariant;
	/** `vertical` stacks the radios; `horizontal` lays them out in a wrapping row. */
	orientation?: RadioOrientation;
	/** Marks every radio invalid. Inherited from an enclosing `Field` when not given. */
	isInvalid?: boolean;
	/** Disables every radio. Inherited from an enclosing `Field` when not given. */
	isDisabled?: boolean;
	className?: string;
};

/**
 * Groups radios and owns which one is selected.
 *
 * Selection is `selected` plus `onSelected`, or `defaultSelected` alone to let
 * the group hold its own. `size` and `variant` belong to the group outright — a
 * group whose options were different sizes is not a design — while `isDisabled`
 * and `isInvalid` are published raw, so one option can still disable itself.
 *
 * It renders no legend, description or error. `Field` already owns all three, and
 * a second definition of a label is a type scale that can drift — the trade
 * `Input` made. That does leave the group without an accessible name, since React
 * Native has no `aria-labelledby` to tie it to the `Field.Label` above it, so
 * pass `accessibilityLabel`.
 *
 * @example
 * <Radio.Group onSelected={setPlan} selected={plan ?? null} accessibilityLabel="Plan">
 *   <Radio value="free"><Radio.Label>Free</Radio.Label></Radio>
 *   <Radio value="pro"><Radio.Label>Pro</Radio.Label></Radio>
 * </Radio.Group>
 */
export function RadioGroup({
	selected: selectedProp,
	defaultSelected,
	onSelected,
	size = "md",
	variant = "primary",
	orientation = "vertical",
	isInvalid,
	isDisabled,
	className,
	...props
}: RadioGroupProps): ReactElement {
	const field = useFieldContext();

	// Memoised, or `useControllableState`'s setter rebuilds every render, which
	// rebuilds the context value, which re-renders every radio in the group on
	// every render of whatever holds it.
	const handleChange = useCallback(
		(next: string | null) => {
			if (next !== null) onSelected?.(next);
		},
		[onSelected]
	);

	const [selected, setSelected] = useControllableState<string | null>({
		value: selectedProp,
		defaultValue: defaultSelected ?? null,
		onChange: handleChange,
	});

	const select = useCallback(
		(next: string) => {
			if (shouldEmitSelection(selected, next)) setSelected(next);
		},
		[selected, setSelected]
	);

	// Deliberately not defaulted in the destructure — `false` there would swallow
	// the field before it was ever consulted. See `input-group.tsx`.
	const resolvedIsInvalid = isInvalid ?? field?.isInvalid;
	const resolvedIsDisabled = isDisabled ?? field?.isDisabled;

	const context = useMemo<RadioGroupContextValue>(
		() => ({
			isDisabled: resolvedIsDisabled,
			isInvalid: resolvedIsInvalid,
			orientation,
			select,
			selected,
			size,
			variant,
		}),
		[resolvedIsDisabled, resolvedIsInvalid, orientation, select, selected, size, variant]
	);

	return (
		<RadioGroupProvider value={context}>
			<View
				accessibilityRole="radiogroup"
				className={radioVariants({ orientation, size }).group({ className })}
				{...props}
			/>
		</RadioGroupProvider>
	);
}
RadioGroup.displayName = "DelacourUI.Radio.Group";
