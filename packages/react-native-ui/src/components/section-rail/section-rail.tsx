import { type ReactElement, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, I18nManager, type LayoutChangeEvent, View, type ViewProps } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useControllableState } from "../../hooks/use-controllable-state";
import type { HapticFeedback } from "../pressable";
import { type SectionRailContextValue, SectionRailProvider } from "./section-rail.context";
import {
	resolveAdjacentSection,
	resolveBarOrder,
	resolveRailPlacementStyle,
	SECTION_RAIL_DEFAULT_ALIGN,
	SECTION_RAIL_DEFAULT_CLOSE_DELAY,
	SECTION_RAIL_DEFAULT_OFFSET,
	SECTION_RAIL_DEFAULT_PLACEMENT,
	type SectionRailAlign,
	type SectionRailBarLayout,
	type SectionRailPlacement,
	sectionRailVariants,
	shouldEmitSection,
} from "./section-rail.variants";
import { SectionRailBar } from "./section-rail-bar";
import { SectionRailContent } from "./section-rail-content";
import { SectionRailItem } from "./section-rail-item";
import { SectionRailScrim } from "./section-rail-scrim";
import { SectionRailTrigger } from "./section-rail-trigger";

export type SectionRailProps = Omit<ViewProps, "children"> & {
	/** Which screen edge the rail hugs. `end` is the right in left-to-right. */
	placement?: SectionRailPlacement;
	/** `center` sits mid-edge; `bottom` sits in the thumb's reach and grows the panel upward. */
	align?: SectionRailAlign;
	/**
	 * The active section. Controlled — `undefined` is a real value here, "no
	 * section yet", so a scroll hook's `activeId` can be passed before the first
	 * scroll without the rail switching modes.
	 */
	value?: string;
	defaultValue?: string;
	/** Called with a picked section. Never called for a re-pick of the active one. */
	onValueChange?: (value: string) => void;
	isOpen?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (isOpen: boolean) => void;
	/** ms the panel lingers after a pick, so a mis-tap can be corrected. */
	closeDelay?: number;
	/** Points between the rail and the safe-area edge it hugs. */
	offset?: number;
	/** Ticked once per section crossed while scrubbing, and on opening. Off by default. */
	haptic?: false | HapticFeedback;
	className?: string;
	children: ReactNode;
};

function SectionRailRoot(rootProps: SectionRailProps): ReactElement {
	const {
		placement = SECTION_RAIL_DEFAULT_PLACEMENT,
		align = SECTION_RAIL_DEFAULT_ALIGN,
		value: valueProp,
		defaultValue,
		onValueChange,
		isOpen: isOpenProp,
		defaultOpen = false,
		onOpenChange,
		closeDelay = SECTION_RAIL_DEFAULT_CLOSE_DELAY,
		offset = SECTION_RAIL_DEFAULT_OFFSET,
		haptic = false,
		className,
		children,
		...props
	} = rootProps;

	// `useControllableState` reads `undefined` as "uncontrolled", but a scroll
	// hook's `activeId` is `undefined` until the first scroll. Whether the caller
	// passed `value` at all is what decides the mode, so a present-but-empty
	// value travels as `null` and stays controlled.
	const isValueControlled = "value" in rootProps;
	const reportValue = useCallback(
		(next: string | null) => {
			if (next !== null) onValueChange?.(next);
		},
		[onValueChange]
	);
	const [storedValue, setStoredValue] = useControllableState<string | null>({
		value: isValueControlled ? (valueProp ?? null) : undefined,
		defaultValue: defaultValue ?? null,
		onChange: reportValue,
	});
	const value = storedValue ?? undefined;

	const [isOpen, setOpenState] = useControllableState<boolean>({
		value: isOpenProp,
		defaultValue: defaultOpen,
		onChange: onOpenChange,
	});

	const [highlighted, setHighlighted] = useState<string | undefined>(undefined);
	const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const cancelClose = useCallback(() => {
		if (closeTimer.current !== undefined) clearTimeout(closeTimer.current);
		closeTimer.current = undefined;
	}, []);
	useEffect(() => cancelClose, [cancelClose]);

	const setOpen = useCallback(
		(next: boolean) => {
			cancelClose();
			if (!next) setHighlighted(undefined);
			if (next !== isOpen) setOpenState(next);
		},
		[cancelClose, isOpen, setOpenState]
	);

	const pick = useCallback(
		(next: string) => {
			setHighlighted(undefined);
			if (shouldEmitSection(value, next)) setStoredValue(next);
			cancelClose();
			closeTimer.current = setTimeout(() => {
				closeTimer.current = undefined;
				setOpenState(false);
			}, closeDelay);
		},
		[cancelClose, closeDelay, setOpenState, setStoredValue, value]
	);

	const bars = useSharedValue<SectionRailBarLayout[]>([]);
	const barMap = useRef(new Map<string, SectionRailBarLayout>());
	const [order, setOrder] = useState<readonly string[]>([]);

	const publishBars = useCallback(() => {
		const sorted = resolveBarOrder([...barMap.current.values()]);
		bars.value = sorted;
		const nextOrder = sorted.map((bar) => bar.value);
		setOrder((previous) =>
			previous.length === nextOrder.length && previous.every((entry, index) => entry === nextOrder[index])
				? previous
				: nextOrder
		);
	}, [bars]);

	const mountBar = useCallback(
		(barValue: string) => {
			if (!barMap.current.has(barValue)) barMap.current.set(barValue, { height: 0, value: barValue, y: undefined });
			publishBars();
			return () => {
				barMap.current.delete(barValue);
				publishBars();
			};
		},
		[publishBars]
	);

	const layoutHandlers = useRef(new Map<string, (event: LayoutChangeEvent) => void>());
	const layoutBar = useCallback(
		(barValue: string) => {
			const cached = layoutHandlers.current.get(barValue);
			if (cached) return cached;
			const handler = (event: LayoutChangeEvent) => {
				const { y, height } = event.nativeEvent.layout;
				barMap.current.set(barValue, { height, value: barValue, y });
				publishBars();
			};
			layoutHandlers.current.set(barValue, handler);
			return handler;
		},
		[publishBars]
	);

	const [labels, setLabels] = useState<Readonly<Record<string, string>>>({});
	const registerItem = useCallback((itemValue: string, label: string) => {
		setLabels((previous) => (previous[itemValue] === label ? previous : { ...previous, [itemValue]: label }));
		return () =>
			setLabels((previous) => {
				if (!(itemValue in previous)) return previous;
				const { [itemValue]: _removed, ...rest } = previous;
				return rest;
			});
	}, []);

	const step = useCallback(
		(direction: 1 | -1) => {
			const next = resolveAdjacentSection(order, value, direction);
			if (shouldEmitSection(value, next)) setStoredValue(next);
		},
		[order, setStoredValue, value]
	);

	useEffect(() => {
		if (!isOpen) return;
		const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
			setOpen(false);
			return true;
		});
		return () => subscription.remove();
	}, [isOpen, setOpen]);

	const insets = useSafeAreaInsets();
	const frameStyle = useMemo(
		() => resolveRailPlacementStyle(placement, align, insets, offset, I18nManager.isRTL),
		[align, insets, offset, placement]
	);

	const context = useMemo<SectionRailContextValue>(
		() => ({
			activeValue: highlighted ?? value,
			align,
			bars,
			frameStyle,
			haptic,
			highlight: setHighlighted,
			isOpen,
			labels,
			layoutBar,
			mountBar,
			pick,
			placement,
			registerItem,
			setOpen,
			step,
			value,
		}),
		[
			align,
			bars,
			frameStyle,
			haptic,
			highlighted,
			isOpen,
			labels,
			layoutBar,
			mountBar,
			pick,
			placement,
			registerItem,
			setOpen,
			step,
			value,
		]
	);

	return (
		<SectionRailProvider value={context}>
			<View className={sectionRailVariants().root({ className })} pointerEvents="box-none" {...props}>
				{isOpen ? <SectionRailScrim /> : null}
				{children}
			</View>
		</SectionRailProvider>
	);
}

/**
 * A thin rail of bars along one screen edge — one bar per section of a long
 * screen, the active one highlighted — that expands into a labelled outline.
 *
 * Tap the rail to open the panel; tap a row to jump there. Or scrub: drag along
 * the rail and the row under the finger highlights, ticking once per section
 * crossed, and releasing jumps to it. After a pick the panel lingers for
 * `closeDelay` so a mis-tap can be corrected; an outside tap or Android's back
 * closes it.
 *
 * **Mount it as the last child of the screen's container**, a sibling of the
 * scroll view. It fills that container and passes every touch it does not own
 * through, so the content keeps scrolling everywhere but the rail. Pair it with
 * `useScrollSections` for the value.
 *
 * The bars and the rows are written separately, and should mirror each other —
 * the same values in the same order with the same `level`s. The trigger speaks
 * for the bars: one adjustable control, valued by the active row's title, that
 * a swipe up or down moves through the sections.
 *
 * @example
 * const sections = useScrollSections();
 *
 * <View className="flex-1">
 *   <Animated.ScrollView ref={sections.scrollRef} onScroll={sections.scrollHandler} scrollEventThrottle={16}>
 *     <View onLayout={sections.register("intro")}>…</View>
 *     <View onLayout={sections.register("setup")}>…</View>
 *   </Animated.ScrollView>
 *
 *   <SectionRail value={sections.activeId} onValueChange={sections.scrollTo} align="bottom">
 *     <SectionRail.Trigger>
 *       <SectionRail.Bar value="intro" />
 *       <SectionRail.Bar value="setup" />
 *       <SectionRail.Bar value="setup-ios" level={1} />
 *     </SectionRail.Trigger>
 *     <SectionRail.Content>
 *       <SectionRail.Item value="intro">Introduction</SectionRail.Item>
 *       <SectionRail.Item value="setup">Setup</SectionRail.Item>
 *       <SectionRail.Item value="setup-ios" level={1}>iOS</SectionRail.Item>
 *     </SectionRail.Content>
 *   </SectionRail>
 * </View>
 */
export const SectionRail = Object.assign(SectionRailRoot, {
	/** The rail: the bars' column, its tap and its scrub, and the one adjustable control VoiceOver reads. */
	Trigger: SectionRailTrigger,
	/** One section's bar. Shortens with `level`. A direct child of the trigger. */
	Bar: SectionRailBar,
	/** The panel that opens from the rail's edge. */
	Content: SectionRailContent,
	/** One row of the panel: a section's title, indented by `level`. */
	Item: SectionRailItem,
	displayName: "DelacourUI.SectionRail",
});
