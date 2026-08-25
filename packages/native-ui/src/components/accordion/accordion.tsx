import { Children, isValidElement, type ReactElement, type ReactNode, useCallback, useMemo, useRef } from "react";
import { View, type ViewProps } from "react-native";
import { useControllableState } from "../../hooks/use-controllable-state";
import { Separator } from "../separator";
import { type AccordionContextValue, AccordionProvider } from "./accordion.context";
import {
	ACCORDION_DEFAULT_SIZE,
	ACCORDION_DEFAULT_VARIANT,
	type AccordionSelection,
	type AccordionSelectionMode,
	type AccordionSize,
	type AccordionVariant,
	accordionVariants,
	toExpandedList,
	toggleExpandedValue,
} from "./accordion.variants";
import { AccordionContent } from "./accordion-content";
import { AccordionDescription } from "./accordion-description";
import { AccordionIndicator } from "./accordion-indicator";
import { AccordionItem } from "./accordion-item";
import { AccordionTitle } from "./accordion-title";
import { AccordionTrigger } from "./accordion-trigger";

export type AccordionBaseProps = Omit<ViewProps, "children"> & {
	variant?: AccordionVariant;
	size?: AccordionSize;
	/** Draw a divider between adjacent items. On by default. */
	isDivided?: boolean;
	/** Blocks every trigger and fades every row. An item's own prop still overrides it. */
	isDisabled?: boolean;
	/**
	 * Whether the last open item may be closed. On by default.
	 *
	 * It bounds the *set*, never a single item: in `multiple` mode an item still
	 * closes while another is open, and only the last one is refused.
	 */
	isCollapsible?: boolean;
	className?: string;
	children?: ReactNode;
};

export type AccordionProps = AccordionBaseProps & AccordionSelection;

type AccordionBodyProps = AccordionBaseProps & {
	selectionMode?: AccordionSelectionMode;
	expanded?: readonly string[];
	defaultExpanded: readonly string[];
	onExpandedChange?: (expanded: readonly string[]) => void;
};

/**
 * Everything the accordion does, over one internal list of open values.
 *
 * Split from the root so the root can be nothing but a narrow on `selectionMode`.
 * `useControllableState` cannot be called conditionally, so the two shapes a
 * caller can hold — a string or an array — are converted to this one list at the
 * boundary and back again on the way out. Two hooks would be two pieces of state
 * for one answer.
 */
function AccordionBody({
	selectionMode = "single",
	variant = ACCORDION_DEFAULT_VARIANT,
	size = ACCORDION_DEFAULT_SIZE,
	isDivided = true,
	isDisabled = false,
	isCollapsible = true,
	expanded: expandedProp,
	defaultExpanded,
	onExpandedChange,
	className,
	children,
	...props
}: AccordionBodyProps): ReactElement {
	// A ref-backed trampoline, so the accordion's own context does not change
	// identity whenever the caller passes a fresh arrow — which would re-render
	// every item on every render of the screen above it. `Switch` registers its
	// toggle with a `Field` the same way, for the same reason.
	const changeRef = useRef(onExpandedChange);
	changeRef.current = onExpandedChange;
	const handleChange = useCallback((next: readonly string[]) => changeRef.current?.(next), []);

	const [expanded, setExpanded] = useControllableState<readonly string[]>({
		defaultValue: defaultExpanded,
		onChange: handleChange,
		value: expandedProp,
	});

	// Read by `toggle` rather than closed over, so one stable callback serves the
	// accordion for its whole life. A `toggle` that changed on every expansion
	// would be a new context value on every expansion, and therefore a re-render
	// of every item rather than of the one that moved.
	const expandedRef = useRef(expanded);
	expandedRef.current = expanded;

	const toggle = useCallback(
		(value: string) => {
			const next = toggleExpandedValue({ expanded: expandedRef.current, isCollapsible, selectionMode, value });
			// Refused, by identity. A tap the rules reject must not re-render and
			// must not report an `onValueChange` for a change that did not happen.
			if (next === expandedRef.current) return;
			setExpanded(next);
		},
		[isCollapsible, selectionMode, setExpanded]
	);

	const context = useMemo<AccordionContextValue>(
		() => ({ expanded, isDisabled, size, toggle, variant }),
		[expanded, isDisabled, size, toggle, variant]
	);

	const slots = accordionVariants({ size, variant });
	const dividerClassName = slots.divider();

	const content = useMemo(
		() => (isDivided ? withDividers(children, dividerClassName) : children),
		[children, dividerClassName, isDivided]
	);

	return (
		<AccordionProvider value={context}>
			<View className={slots.root({ className })} {...props}>
				{content}
			</View>
		</AccordionProvider>
	);
}
AccordionBody.displayName = "DelacourUI.Accordion.Body";

/**
 * Inserts a divider between adjacent items.
 *
 * A pair is skipped when either side already is a `Separator`, so a hand-placed
 * divider is never doubled. `Children.toArray` drops the nulls and booleans a
 * conditional child leaves behind, so an item rendered only some of the time does
 * not strand a divider where nothing follows it — which counting indices against
 * the raw children cannot do.
 */
function withDividers(children: ReactNode, dividerClassName: string): ReactNode {
	const items = Children.toArray(children);
	const output: ReactNode[] = [];

	for (const [index, child] of items.entries()) {
		if (index > 0 && !isSeparator(items[index - 1]) && !isSeparator(child)) {
			output.push(<Separator className={dividerClassName} key={`divider-${index}`} />);
		}
		output.push(child);
	}

	return output;
}

function isSeparator(node: ReactNode): boolean {
	return isValidElement(node) && node.type === Separator;
}

function AccordionRoot(props: AccordionProps): ReactElement {
	// The one place the union is narrowed, and it happens before anything is
	// destructured — which is what keeps the two shapes correlated. Destructure
	// first and `onValueChange` widens to a union of two functions that cannot be
	// called, which is what forces a cast or a `@ts-expect-error` on every other
	// implementation of this component.
	if (props.selectionMode === "multiple") {
		const { value, defaultValue, onValueChange, ...rest } = props;
		return (
			<AccordionBody
				{...rest}
				defaultExpanded={toExpandedList(defaultValue)}
				expanded={value === undefined ? undefined : toExpandedList(value)}
				onExpandedChange={(next) => onValueChange?.([...next])}
			/>
		);
	}

	const { value, defaultValue, onValueChange, ...rest } = props;
	return (
		<AccordionBody
			{...rest}
			defaultExpanded={toExpandedList(defaultValue)}
			expanded={value === undefined ? undefined : toExpandedList(value)}
			onExpandedChange={(next) => onValueChange?.(next[0] ?? null)}
		/>
	);
}

/**
 * A set of rows that each disclose a panel.
 *
 * `selectionMode` decides how many open at once: `single` (the default) keeps one
 * open and reports a `string | null`, `multiple` keeps any number and reports a
 * `string[]`. The two are a real discriminated union, so an array `defaultValue`
 * on a single accordion is a compile error rather than a runtime surprise.
 *
 * **A panel's height is measured and animated**, so the animation lives on the
 * panel's own node and whatever sits below simply follows it — no sibling on the
 * screen has to opt into anything. Its
 * height, its fade and the indicator's rotation all run off one shared value per
 * item, so they cannot drift out of step by a frame, and a tap mid-travel reverses
 * the spring rather than restarting it.
 *
 * **A panel mounts on first expand and stays mounted**, so a form inside one keeps
 * what was typed, a list keeps where it was scrolled, and a video keeps playing
 * position across every later collapse.
 *
 * Dividers are inserted between adjacent items rather than written out at every
 * call site, inset to line up with the triggers' own padding. A `Separator` placed
 * by hand is respected — no divider is added on either side of it — so a caller can
 * control one gap without turning the feature off. `isDivided={false}` turns it off.
 *
 * `isCollapsible={false}` keeps one item open at all times. It bounds the set and
 * never a single item, so in `multiple` mode a row still closes while another is
 * open and only the last one is refused.
 *
 * **State works either way from one hook**: pass `value` to control it, or nothing
 * and let it hold its own.
 *
 * @example
 * <Accordion>
 *   <Accordion.Item value="shipping">
 *     <Accordion.Trigger>
 *       <Accordion.Title>Shipping</Accordion.Title>
 *       <Accordion.Description>2–5 business days</Accordion.Description>
 *     </Accordion.Trigger>
 *     <Accordion.Content>
 *       <Text.Paragraph>Tracked, and signed for over $200.</Text.Paragraph>
 *     </Accordion.Content>
 *   </Accordion.Item>
 * </Accordion>
 *
 * @example
 * <Accordion onValueChange={setOpen} selectionMode="multiple" value={open}>
 *   {sections.map((section) => (
 *     <Accordion.Item key={section.id} value={section.id}>
 *       <Accordion.Trigger>{section.title}</Accordion.Trigger>
 *       <Accordion.Content>{section.body}</Accordion.Content>
 *     </Accordion.Item>
 *   ))}
 * </Accordion>
 */
export const Accordion = Object.assign(AccordionRoot, {
	/** One section: a trigger, and the panel it discloses. */
	Item: AccordionItem,
	/** The row that opens the item. A `Pressable`, so it inherits the whole vocabulary. */
	Trigger: AccordionTrigger,
	/** The trigger's primary line. Bare string children become one automatically. */
	Title: AccordionTitle,
	/** The trigger's secondary line, stacked under the title. */
	Description: AccordionDescription,
	/** The glyph that turns as the panel opens. Composed in when a trigger holds none. */
	Indicator: AccordionIndicator,
	/** The measured, clipped panel. Mounts on first expand and stays mounted. */
	Content: AccordionContent,
	displayName: "DelacourUI.Accordion",
});
