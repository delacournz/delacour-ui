import {
	Children,
	type ComponentRef,
	isValidElement,
	type ReactElement,
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	AccessibilityInfo,
	BackHandler,
	findNodeHandle,
	type LayoutChangeEvent,
	View,
	type ViewProps,
} from "react-native";
import Animated, {
	FadeIn,
	isSharedValue,
	type SharedValue,
	useAnimatedReaction,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { useControllableState } from "../../hooks/use-controllable-state";
import type { UseScrollSectionsResult } from "../../hooks/use-scroll-sections";
import { type HapticFeedback, Pressable, playHaptic } from "../pressable";
import { type SectionProgressContextValue, SectionProgressProvider } from "./section-progress.context";
import {
	resolvePlacementStyle,
	resolveProgressPercent,
	resolveRevealed,
	resolveRingTransition,
	resolveSectionColor,
	resolveSectionLabel,
	resolveSectionProgressAccessibilityValue,
	SECTION_PROGRESS_DEFAULT_PLACEMENT,
	SECTION_PROGRESS_REVEAL_MS,
	SECTION_PROGRESS_RING_SETTLE_MS,
	type SectionProgressEntry,
	type SectionProgressPlacement,
	sectionProgressVariants,
} from "./section-progress.variants";
import { SectionProgressItem, type SectionProgressItemProps } from "./section-progress-item";
import { SectionProgressPanel } from "./section-progress-panel";

/** What the pill reads from `useScrollSections` — pass the whole result. */
export type SectionProgressScroll = Pick<UseScrollSectionsResult, "progress" | "scrollY">;

export type SectionProgressProps = Omit<ViewProps, "children"> & {
	/** From `useScrollSections` — drives the ring and the reveal. */
	scroll?: SectionProgressScroll;
	/** Overrides the scroll-derived ring fill (0–1). */
	progress?: SharedValue<number> | number;
	/** The active section. Controlled — pass `useScrollSections().activeId`, even while it is undefined. */
	value?: string;
	/** The first active section while uncontrolled. */
	defaultValue?: string;
	/** Called with the picked section. Wire it to `useScrollSections().scrollTo`. */
	onValueChange?: (value: string) => void;
	/** Whether the panel is open. Controlled. */
	isOpen?: boolean;
	/** Whether the panel starts open while uncontrolled. Default false. */
	defaultOpen?: boolean;
	onOpenChange?: (isOpen: boolean) => void;
	/** Where the pill floats. Default `bottom-center`. */
	placement?: SectionProgressPlacement;
	/** Points from the safe-area edge. Default 16. */
	offset?: number;
	/** Scroll Y before the pill appears. Stays once shown. 0 = always visible. Default 64. */
	revealAt?: number;
	/** Played when the active section changes. Default off. */
	haptic?: false | HapticFeedback;
	/** The pill's accessible name. Default "Sections". */
	accessibilityLabel?: string;
	/** `SectionProgress.Item`s, one per section. */
	children: ReactNode;
	className?: string;
};

/** The settle the ring eases with when the progress jumps. */
const RING_SETTLE = { duration: SECTION_PROGRESS_RING_SETTLE_MS } as const;
/** Long enough for the panel to have mounted and been laid out before VoiceOver is pointed at it. */
const FOCUS_DELAY_MS = 250;

function SectionProgressRoot(props: SectionProgressProps): ReactElement {
	const {
		scroll,
		progress: progressProp,
		value: valueProp,
		defaultValue,
		onValueChange,
		isOpen: isOpenProp,
		defaultOpen = false,
		onOpenChange,
		placement = SECTION_PROGRESS_DEFAULT_PLACEMENT,
		offset = 16,
		revealAt = 64,
		haptic = false,
		accessibilityLabel = "Sections",
		children,
		className,
		testID,
		...rest
	} = props;

	// `useScrollSections().activeId` is undefined until the first scroll event, so
	// `value={sections.activeId}` would read as uncontrolled and then flip. The key's
	// presence is what makes the pill controlled; an undefined value is "none yet".
	const isValueControlled = Object.hasOwn(props, "value");
	const emitValue = useCallback(
		(next: string | null) => {
			if (next !== null) onValueChange?.(next);
		},
		[onValueChange]
	);
	const [value, setValue] = useControllableState<string | null>({
		value: isValueControlled ? (valueProp ?? null) : undefined,
		defaultValue: defaultValue ?? null,
		onChange: emitValue,
	});
	const [isOpen, setOpen] = useControllableState<boolean>({
		value: isOpenProp,
		defaultValue: defaultOpen,
		onChange: onOpenChange,
	});

	const entries = useMemo<SectionProgressEntry[]>(
		() =>
			Children.toArray(children).flatMap((child) =>
				isValidElement<SectionProgressItemProps>(child) && child.type === SectionProgressItem
					? [{ value: child.props.value, title: child.props.children, color: child.props.color }]
					: []
			),
		[children]
	);

	if (process.env.NODE_ENV !== "production" && entries.length === 0 && Children.count(children) > 0) {
		console.warn(
			"SectionProgress: found no <SectionProgress.Item> among the direct children, so the pill has no titles. " +
				"Render the items directly, or from a .map(), rather than behind a wrapper component."
		);
	}

	const fallbackProgress = useSharedValue(0);
	useEffect(() => {
		if (typeof progressProp === "number") fallbackProgress.value = progressProp;
	}, [fallbackProgress, progressProp]);
	const source = isSharedValue<number>(progressProp)
		? progressProp
		: typeof progressProp === "number"
			? fallbackProgress
			: (scroll?.progress ?? fallbackProgress);

	// The ring's own value: it tracks a scroll frame by frame and eases over a jump.
	// Written on the UI thread only — scrolling renders nothing.
	const ringProgress = useSharedValue(0);
	useAnimatedReaction(
		() => source.value,
		(next, previous) => {
			if (previous === null || resolveRingTransition(ringProgress.value, next) === "track") {
				ringProgress.value = next;
			} else {
				ringProgress.value = withTiming(next, RING_SETTLE);
			}
		},
		[source]
	);

	const scrollY = scroll?.scrollY;
	const [isRevealed, setRevealed] = useState(() => scrollY === undefined || revealAt <= 0);
	useAnimatedReaction(
		() => (scrollY === undefined ? true : resolveRevealed(scrollY.value, revealAt, false)),
		(now, was) => {
			if (now && was !== true) scheduleOnRN(setRevealed, true);
		},
		[scrollY, revealAt]
	);

	// The percent only crosses to React while a screen reader is listening; with
	// none, scrolling costs no render at all.
	const [isScreenReaderOn, setScreenReaderOn] = useState(false);
	useEffect(() => {
		AccessibilityInfo.isScreenReaderEnabled().then(setScreenReaderOn);
		const subscription = AccessibilityInfo.addEventListener("screenReaderChanged", setScreenReaderOn);
		return () => subscription.remove();
	}, []);
	const [percent, setPercent] = useState(0);
	useAnimatedReaction(
		() => (isScreenReaderOn ? resolveProgressPercent(source.value) : -1),
		(next, previous) => {
			if (next >= 0 && next !== previous) scheduleOnRN(setPercent, next);
		},
		[isScreenReaderOn, source]
	);

	const lastValue = useRef(value);
	useEffect(() => {
		if (haptic && lastValue.current !== null && value !== null && value !== lastValue.current) playHaptic(haptic);
		lastValue.current = value;
	}, [haptic, value]);

	useEffect(() => {
		if (!isOpen) return;
		const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
			setOpen(false);
			return true;
		});
		return () => subscription.remove();
	}, [isOpen, setOpen]);

	const activeItemRef = useRef<ComponentRef<typeof Animated.View> | null>(null);
	useEffect(() => {
		if (!isOpen) return;
		const timeout = setTimeout(() => {
			const node = activeItemRef.current === null ? undefined : findNodeHandle(activeItemRef.current);
			if (node !== undefined) AccessibilityInfo.setAccessibilityFocus(node);
		}, FOCUS_DELAY_MS);
		return () => clearTimeout(timeout);
	}, [isOpen]);

	const select = useCallback(
		(next: string) => {
			setValue(next);
			setOpen(false);
		},
		[setOpen, setValue]
	);
	const close = useCallback(() => setOpen(false), [setOpen]);

	const index = entries.findIndex((entry) => entry.value === value);
	const label = resolveSectionLabel(entries, value ?? undefined);
	const color = resolveSectionColor(entries, value ?? undefined);
	const accessibilityValue = resolveSectionProgressAccessibilityValue(label, percent / 100);

	const context = useMemo<SectionProgressContextValue>(
		() => ({
			accessibilityLabel,
			accessibilityValue,
			activeItemRef,
			color,
			index,
			isOpen,
			label,
			pillTestID: testID === undefined ? undefined : `${testID}-pill`,
			placement,
			progress: ringProgress,
			select,
			setOpen,
			value,
		}),
		[
			accessibilityLabel,
			accessibilityValue,
			color,
			index,
			isOpen,
			label,
			placement,
			ringProgress,
			select,
			setOpen,
			testID,
			value,
		]
	);

	const [availableWidth, setAvailableWidth] = useState(0);
	const measureStack = useCallback((event: LayoutChangeEvent) => setAvailableWidth(event.nativeEvent.layout.width), []);

	const insets = useSafeAreaInsets();
	const slots = sectionProgressVariants({ placement });

	return (
		<SectionProgressProvider value={context}>
			<View className={slots.root({ className })} pointerEvents="box-none" testID={testID} {...rest}>
				{isOpen ? (
					<Pressable
						accessibilityElementsHidden
						accessible={false}
						className={slots.scrim()}
						feedback="none"
						importantForAccessibility="no-hide-descendants"
						onPress={close}
					/>
				) : null}
				{isRevealed ? (
					<Animated.View
						className={slots.stack()}
						entering={FadeIn.duration(SECTION_PROGRESS_REVEAL_MS)}
						onLayout={measureStack}
						pointerEvents="box-none"
						style={resolvePlacementStyle(placement, insets, offset)}
					>
						<SectionProgressPanel availableWidth={availableWidth}>{children}</SectionProgressPanel>
					</Animated.View>
				) : null}
			</View>
		</SectionProgressProvider>
	);
}

/**
 * A floating pill over a long reading screen: a ring filling with scroll
 * progress and the title of the section being read. Tapping it grows it into a
 * card listing every section; picking one scrolls there.
 *
 * **Mount it as the last child of the screen's container**, a sibling of the
 * scroll view — it positions itself absolutely inside that container, inset by
 * the safe area. It is not portalled. Leave bottom padding at the end of the
 * scroll content so the pill never covers the last line.
 *
 * The ring runs on the UI thread from `useScrollSections().progress`, so
 * scrolling renders nothing; the label changes only when the section does.
 * VoiceOver reads the pill as "Sections, Pricing, 42 percent".
 *
 * @example
 * const sections = useScrollSections({ readingLine: 96 });
 *
 * <View className="flex-1">
 *   <Animated.ScrollView ref={sections.scrollRef} onScroll={sections.scrollHandler} scrollEventThrottle={16}>
 *     <View onLayout={sections.register("intro")}>…</View>
 *     <View onLayout={sections.register("pricing")}>…</View>
 *   </Animated.ScrollView>
 *
 *   <SectionProgress scroll={sections} value={sections.activeId} onValueChange={sections.scrollTo}>
 *     <SectionProgress.Item value="intro">Introduction</SectionProgress.Item>
 *     <SectionProgress.Item value="pricing" color="success">Pricing</SectionProgress.Item>
 *   </SectionProgress>
 * </View>
 */
export const SectionProgress = Object.assign(SectionProgressRoot, {
	/** One section in the panel — its marker and title. The title is the pill's label while it is active. */
	Item: SectionProgressItem,
	displayName: "DelacourUI.SectionProgress",
});
