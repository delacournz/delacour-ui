import { Children, isValidElement, type ReactElement, type ReactNode, useCallback, useMemo } from "react";
import { useFieldContext } from "@registry/ui/field/field.context";
import { Pressable, type PressableProps } from "@registry/ui/pressable";
import { TextClassProvider } from "@registry/ui/text/text.context";
import { resolveTextClass } from "@registry/ui/text/text.variants";
import { type RadioContextValue, RadioProvider, useRadioGroupContext } from "./radio.context";
import {
	RADIO_LABEL_TEXT_SIZE,
	type RadioSize,
	type RadioVariant,
	radioVariants,
	resolveIndicatorPlacement,
	resolveRadioState,
} from "./radio.variants";
import { RadioGroup } from "./radio-group";
import { RadioIndicator } from "./radio-indicator";
import { RadioLabel } from "./radio-label";

export type RadioProps = Omit<PressableProps, "asChild" | "busy" | "children" | "disabled"> & {
	/** Identifies this radio to its `Radio.Group`. Required there; inert without one. */
	value?: string;
	/** Selected state for a radio standing on its own. Ignored inside a `Radio.Group`. */
	isSelected?: boolean;
	/** Initial selected state while uncontrolled and ungrouped. */
	defaultSelected?: boolean;
	/**
	 * Called when this radio becomes the selection. Ignored inside a
	 * `Radio.Group`, which owns the callback.
	 *
	 * Only ever called with `true`: a radio does not deselect itself, which is
	 * `Switch` and `Checkbox` semantics rather than radio ones.
	 */
	onSelected?: (isSelected: boolean) => void;
	/** Ignored inside a `Radio.Group` — the group owns this axis. */
	size?: RadioSize;
	/** Ignored inside a `Radio.Group` — the group owns this axis. */
	variant?: RadioVariant;
	/** Wins over an enclosing `Field`. A group that names it wins over both. */
	isInvalid?: boolean;
	/** Wins over an enclosing `Field`. A group that names it wins over both. */
	isDisabled?: boolean;
	children?: ReactNode;
};

function RadioRoot({
	value,
	isSelected,
	defaultSelected,
	onSelected,
	size,
	variant,
	isInvalid,
	isDisabled,
	feedback = "fade",
	hitSlop = 8,
	className,
	children,
	onPress,
	...props
}: RadioProps): ReactElement {
	const group = useRadioGroupContext();
	const field = useFieldContext();

	const state = resolveRadioState({
		field,
		group,
		own: { isDisabled, isInvalid, isSelected, size, value, variant },
	});

	if (process.env.NODE_ENV !== "production" && group && value === undefined) {
		console.warn("Radio: a <Radio> inside a <Radio.Group> needs a `value`, or it can never be selected.");
	}

	const handlePress = useCallback(() => {
		if (group) {
			if (value !== undefined) group.select(value);
		} else if (!state.isSelected) {
			onSelected?.(true);
		}
		onPress?.();
	}, [group, onPress, onSelected, state.isSelected, value]);

	const context = useMemo<RadioContextValue>(
		() => ({
			isDisabled: state.isDisabled,
			isInvalid: state.isInvalid,
			isSelected: state.isSelected,
			size: state.size,
			variant: state.variant,
		}),
		[state.isDisabled, state.isInvalid, state.isSelected, state.size, state.variant]
	);

	const { content, placement } = useMemo(() => withIndicator(children), [children]);

	// One treatment covers the whole subtree — a radio row has a label and no
	// description part — which is the condition for publishing into the cascade.
	const labelClass = useMemo(
		() => resolveTextClass({ size: RADIO_LABEL_TEXT_SIZE[state.size], variant: "label" }),
		[state.size]
	);

	return (
		<RadioProvider value={context}>
			<Pressable
				accessibilityRole="radio"
				accessibilityState={{ checked: state.isSelected }}
				className={radioVariants({
					isDisabled: state.isDisabled,
					isIndicatorTrailing: placement === "end",
					size: state.size,
				}).root({ className })}
				disabled={state.isDisabled}
				feedback={feedback}
				hitSlop={hitSlop}
				onPress={handlePress}
				{...props}
			>
				<TextClassProvider value={labelClass}>{content}</TextClassProvider>
			</Pressable>
		</RadioProvider>
	);
}

/**
 * Wraps bare text in a `Radio.Label` and settles where the indicator sits.
 *
 * React Native cannot render a string outside a `<Text>`, so `<Radio>Yes</Radio>`
 * would otherwise crash. Consecutive strings and numbers collapse into one label
 * rather than one each — `Plan {n}` is a single piece of text, and wrapping the
 * parts separately would space them apart by the row's own gap.
 *
 * An indicator is composed in at the front only when the children hold none,
 * which is what buys a settings row for free: place a `<Radio.Indicator />` last
 * and the row lays out `[label and description] [ring]`, spread to the far edge,
 * with nothing else said. {@link resolveIndicatorPlacement} is that decision and
 * is pure, so `bun test` reaches it.
 *
 * Lives here rather than with the parts: it is the root that wraps its own
 * children, and importing it from a part would close a cycle. See AGENTS.md.
 */
function withIndicator(children: ReactNode): { content: ReactNode; placement: "start" | "end" | "none" } {
	const items = Children.toArray(children);
	const output: ReactNode[] = [];
	const isIndicator: boolean[] = [];
	let run: (string | number)[] = [];

	const flushRun = () => {
		if (run.length === 0) return;
		output.push(<RadioLabel key={`label-${output.length}`}>{run.join("")}</RadioLabel>);
		isIndicator.push(false);
		run = [];
	};

	for (const child of items) {
		if (typeof child === "string" || typeof child === "number") {
			run.push(child);
			continue;
		}
		flushRun();
		output.push(child);
		isIndicator.push(isValidElement(child) && child.type === RadioIndicator);
	}
	flushRun();

	const placement = resolveIndicatorPlacement(isIndicator);
	if (placement !== "none") return { content: output, placement };

	return { content: [<RadioIndicator key="indicator" />, ...output], placement: "start" };
}

/**
 * One option in a set where exactly one can be chosen.
 *
 * The whole row is the control: the ring, the label beside it and the space
 * between them are one tap target, so a press anywhere on the row selects. A
 * `Radio.Indicator` is composed in automatically and plain string children are
 * wrapped in a `Radio.Label`, so the shortest thing that works is `<Radio
 * value="pro">Pro</Radio>`.
 *
 * **A radio works with or without a group.** Inside a `Radio.Group` its `value`
 * identifies it and the group owns the selection, the size and the variant.
 * Outside one it is driven by its own `isSelected` and `onSelected`.
 *
 * Nearest wins for state: a group first, this radio's own props next, an
 * enclosing `Field` last — so a radio inside an invalid `Field` turns danger with
 * nothing said at the call site, while `isInvalid={false}` still opts out.
 *
 * A radio whose row holds no text needs an `accessibilityLabel`, the same rule an
 * icon-only `Button` follows.
 *
 * @example
 * <Radio.Group onSelected={setPlan} selected={plan ?? null} accessibilityLabel="Plan">
 *   <Radio value="free">Free</Radio>
 *   <Radio value="pro">Pro</Radio>
 * </Radio.Group>
 *
 * @example
 * <Radio value="express">
 *   <Radio.Label>Express</Radio.Label>
 *   <Text.Caption>Arrives tomorrow.</Text.Caption>
 * </Radio>
 *
 * @example
 * <Radio accessibilityLabel="Express delivery" isSelected={isExpress} onSelected={setExpress} />
 */
export const Radio = Object.assign(RadioRoot, {
	/** The radio's text, inside its tap target. Takes its size step from the radio's own. */
	Label: RadioLabel,
	/** The ring and its dot. Composed in automatically; write it out to move or replace it. */
	Indicator: RadioIndicator,
	/** Groups radios and owns which one is selected. */
	Group: RadioGroup,
	displayName: "DelacourUI.Radio",
});
