import { type ReactElement, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, type ViewProps } from "react-native";
import { cancelAnimation, useSharedValue, withSpring } from "react-native-reanimated";
import { useControllableState } from "../../hooks/use-controllable-state";
import { type CollapsibleContextValue, CollapsibleProvider } from "./collapsible.context";
import {
	COLLAPSIBLE_DEFAULT_SIZE,
	COLLAPSIBLE_DEFAULT_VARIANT,
	COLLAPSIBLE_SPRING,
	COLLAPSIBLE_UNMEASURED,
	type CollapsibleSize,
	type CollapsibleVariant,
	collapsibleVariants,
	toggleCollapsibleOpen,
} from "./collapsible.variants";
import { CollapsibleContent } from "./collapsible-content";
import { CollapsibleDescription } from "./collapsible-description";
import { CollapsibleIndicator } from "./collapsible-indicator";
import { CollapsibleTitle } from "./collapsible-title";
import { CollapsibleTrigger } from "./collapsible-trigger";

export type CollapsibleProps = Omit<ViewProps, "children"> & {
	variant?: CollapsibleVariant;
	size?: CollapsibleSize;
	/** Controlled open state. Leave it off and the collapsible holds its own. */
	isOpen?: boolean;
	/** Initial open state while uncontrolled. */
	defaultOpen?: boolean;
	/** Called with the next state whenever the trigger (or `toggle()`) opens or closes it. */
	onOpenChange?: (isOpen: boolean) => void;
	/**
	 * Stops the trigger opening or closing it, fades the surface and announces the
	 * trigger disabled. An open section stays open.
	 */
	isDisabled?: boolean;
	className?: string;
	children?: ReactNode;
};

function CollapsibleRoot({
	variant = COLLAPSIBLE_DEFAULT_VARIANT,
	size = COLLAPSIBLE_DEFAULT_SIZE,
	isOpen: isOpenProp,
	defaultOpen = false,
	onOpenChange,
	isDisabled = false,
	className,
	children,
	...props
}: CollapsibleProps): ReactElement {
	// A ref-backed trampoline, so a caller passing a fresh arrow every render does
	// not change the context's identity and re-render every part.
	const changeRef = useRef(onOpenChange);
	changeRef.current = onOpenChange;
	const handleChange = useCallback((next: boolean) => changeRef.current?.(next), []);

	const [isOpen, setOpen] = useControllableState<boolean>({
		defaultValue: defaultOpen,
		onChange: handleChange,
		value: isOpenProp,
	});

	// Read by `toggle` rather than closed over, so one stable callback serves the
	// collapsible for its whole life.
	const stateRef = useRef({ isDisabled, isOpen });
	stateRef.current = { isDisabled, isOpen };

	const toggle = useCallback(() => {
		const current = stateRef.current;
		const next = toggleCollapsibleOpen(current);
		// Refused: a disabled tap must not report an `onOpenChange` for a change
		// that did not happen.
		if (next === current.isOpen) return;
		setOpen(next);
	}, [setOpen]);

	// Seeded from the settled state, so a collapsible mounted open does not
	// animate itself open on its first paint.
	const progress = useSharedValue(isOpen ? 1 : 0);
	const contentHeight = useSharedValue(COLLAPSIBLE_UNMEASURED);

	// Bumped the first time the panel reports a height, purely to re-run the
	// effect below. See `onMeasured` on the context.
	const [measurements, setMeasurements] = useState(0);
	const onMeasured = useCallback(() => setMeasurements((count) => count + 1), []);

	// The first open of a panel that has never mounted has no height to travel
	// against, so that run bails and the measurement that follows brings it back.
	// biome-ignore lint/correctness/useExhaustiveDependencies: `measurements` is the re-run trigger, see above
	useEffect(() => {
		if (isOpen && contentHeight.value === COLLAPSIBLE_UNMEASURED) return;

		progress.value = withSpring(isOpen ? 1 : 0, COLLAPSIBLE_SPRING);

		return () => cancelAnimation(progress);
	}, [contentHeight, isOpen, measurements, progress]);

	const context = useMemo<CollapsibleContextValue>(
		() => ({ contentHeight, isDisabled, isOpen, onMeasured, progress, size, toggle, variant }),
		[contentHeight, isDisabled, isOpen, onMeasured, progress, size, toggle, variant]
	);

	return (
		<CollapsibleProvider value={context}>
			<View className={collapsibleVariants({ isDisabled, size, variant }).root({ className })} {...props}>
				{children}
			</View>
		</CollapsibleProvider>
	);
}

/**
 * One section of content, shown and hidden by its own trigger.
 *
 * The standalone form of an accordion item — the same row, the same measured
 * panel, the same spring — for a single disclosure that belongs to nothing else:
 * "Show details", an order summary, the advanced half of a form.
 *
 * **The panel's height is measured and animated**, so the animation lives on the
 * panel's own node and whatever sits below follows it with nothing opted in. Its
 * height, its fade and the indicator's rotation all run off one shared value, so
 * they cannot drift by a frame, and a tap mid-travel reverses the spring rather
 * than restarting it.
 *
 * **The panel mounts on first open and stays mounted**, so what was typed or
 * scrolled inside it survives every later close. A closed panel is taken out of
 * the accessibility tree and stops taking touches.
 *
 * **State works either way from one hook**: pass `isOpen` to control it, or
 * `defaultOpen` (or nothing) and let it hold its own. `onOpenChange` hears both.
 *
 * `isDisabled` stops the trigger and fades the surface. It does not close a
 * section that is already open — a disabled control is one that cannot be used,
 * not one that undoes itself.
 *
 * @example
 * <Collapsible>
 *   <Collapsible.Trigger>
 *     <Collapsible.Title>What is included</Collapsible.Title>
 *     <Collapsible.Description>Three items</Collapsible.Description>
 *   </Collapsible.Trigger>
 *   <Collapsible.Content>
 *     <Text.Paragraph>Unlimited projects, 100 GB of storage, email support.</Text.Paragraph>
 *   </Collapsible.Content>
 * </Collapsible>
 *
 * @example
 * <Collapsible isOpen={isOpen} onOpenChange={setOpen} variant="transparent">
 *   <Collapsible.Trigger>Advanced</Collapsible.Trigger>
 *   <Collapsible.Content>{fields}</Collapsible.Content>
 * </Collapsible>
 */
export const Collapsible = Object.assign(CollapsibleRoot, {
	/** The row that opens the section. A `Pressable`, so it inherits the whole vocabulary. */
	Trigger: CollapsibleTrigger,
	/** The trigger's primary line. Bare string children become one automatically. */
	Title: CollapsibleTitle,
	/** The trigger's secondary line, stacked under the title. */
	Description: CollapsibleDescription,
	/** The glyph that turns as the panel opens. Composed in when a trigger holds none. */
	Indicator: CollapsibleIndicator,
	/** The measured, clipped panel. Mounts on first open and stays mounted. */
	Content: CollapsibleContent,
	displayName: "DelacourUI.Collapsible",
});
