import { type ReactElement, type ReactNode, useCallback, useMemo, useRef, useState } from "react";
import { Modal, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useControllableState } from "../../hooks/use-controllable-state";
import type { HapticFeedback } from "../pressable";
import { type TourContextValue, TourProvider, TourRegistryProvider, type TourRegistryValue } from "./tour.context";
import type { TourGeometryProps, TourStepEntry } from "./tour.types";
import {
	resolveAdjacent,
	resolveCurrentOrder,
	resolveStepIndex,
	resolveStepOptions,
	resolveTourLabels,
	sortSteps,
	TOUR_DEFAULT_PADDING,
	TOUR_DEFAULT_PLACEMENT,
	TOUR_DEFAULT_RADIUS,
	TOUR_DEFAULT_SHAPE,
	type TourLabels,
	tourVariants,
} from "./tour.variants";
import { TourOverlay } from "./tour-overlay";
import { TourStep } from "./tour-step";

export type TourProps = TourGeometryProps & {
	/** Whether the tour is showing. Controlled. */
	isOpen?: boolean;
	/** Whether the tour starts open, uncontrolled. Default false. */
	defaultOpen?: boolean;
	onOpenChange?: (isOpen: boolean) => void;
	/** The `order` of the step on screen. Controlled. */
	step?: number;
	/** The first step while uncontrolled. Default: the lowest order. */
	defaultStep?: number;
	/** Fires before the step is measured — scroll the target into view here. */
	onStepChange?: (step: number) => void;
	/** The last step's Done was pressed. */
	onFinish?: () => void;
	/** Skip, a scrim tap, Android back or VoiceOver's escape closed the tour early. */
	onSkip?: () => void;
	/** A scrim tap, Android back and VoiceOver's escape skip. Default true. */
	isDismissible?: boolean;
	/** Show "2 of 5" on the card. Default true. */
	hasProgress?: boolean;
	/** Show Skip on every step but the last. Default true. */
	hasSkip?: boolean;
	/**
	 * Let the spotlit control receive touches; the app advances the tour itself with `useTour()`.
	 * Draws inside the tour's own root rather than in a `Modal`, which is a separate window that
	 * no touch could pass through.
	 */
	isInteractive?: boolean;
	/** Haptic on the card's actions. Off by default. */
	haptic?: false | HapticFeedback;
	labels?: Partial<TourLabels>;
	/** Classes merged over the card. */
	cardClassName?: string;
	/** Classes on the root `View`, which fills its parent. */
	className?: string;
	/**
	 * On the root `View`, and the stem of the card's own: `<testID>-card`, `-next`, `-back` and
	 * `-skip`, so a test or automation can press the actions the tour draws.
	 */
	testID?: string;
	children: ReactNode;
};

function TourRoot({
	isOpen: isOpenProp,
	defaultOpen = false,
	onOpenChange,
	step: stepProp,
	defaultStep,
	onStepChange,
	onFinish,
	onSkip,
	padding = TOUR_DEFAULT_PADDING,
	radius = TOUR_DEFAULT_RADIUS,
	shape = TOUR_DEFAULT_SHAPE,
	placement = TOUR_DEFAULT_PLACEMENT,
	isDismissible = true,
	hasProgress = true,
	hasSkip = true,
	isInteractive = false,
	haptic = false,
	labels: labelsProp,
	cardClassName,
	className,
	testID,
	children,
}: TourProps): ReactElement {
	const rootRef = useRef<View>(null);
	const [entries, setEntries] = useState<readonly TourStepEntry[]>([]);

	const [isOpen, setOpen] = useControllableState<boolean>({
		value: isOpenProp,
		defaultValue: defaultOpen,
		onChange: onOpenChange,
	});

	const handleStepChange = useCallback(
		(next: number | undefined) => {
			if (next !== undefined) onStepChange?.(next);
		},
		[onStepChange]
	);

	const [requestedStep, setStep] = useControllableState<number | undefined>({
		value: stepProp,
		defaultValue: defaultStep,
		onChange: handleStepChange,
	});

	const register = useCallback((entry: TourStepEntry) => {
		setEntries((previous) => [...previous.filter((e) => e.id !== entry.id), entry]);
		return () => setEntries((previous) => previous.filter((e) => e.id !== entry.id));
	}, []);

	const registry = useMemo<TourRegistryValue>(() => ({ register }), [register]);

	const sorted = useMemo(() => sortSteps(entries), [entries]);
	const orders = useMemo(() => sorted.map((entry) => entry.order), [sorted]);
	const current = resolveCurrentOrder(orders, requestedStep);
	const index = current === undefined ? -1 : resolveStepIndex(orders, current);
	const entry = index === -1 ? undefined : sorted[index];
	const total = orders.length;

	const finish = useCallback(() => {
		setOpen(false);
		onFinish?.();
	}, [onFinish, setOpen]);

	const skip = useCallback(() => {
		setOpen(false);
		onSkip?.();
	}, [onSkip, setOpen]);

	const next = useCallback(() => {
		if (current === undefined) return;
		const adjacent = resolveAdjacent(orders, current, "next");
		if (adjacent === undefined) finish();
		else setStep(adjacent);
	}, [current, finish, orders, setStep]);

	const back = useCallback(() => {
		if (current === undefined) return;
		const adjacent = resolveAdjacent(orders, current, "back");
		if (adjacent !== undefined) setStep(adjacent);
	}, [current, orders, setStep]);

	const goTo = useCallback(
		(order: number) => {
			if (orders.includes(order)) setStep(order);
		},
		[orders, setStep]
	);

	const start = useCallback(
		(order?: number) => {
			const first = resolveCurrentOrder(orders, order);
			if (first !== undefined) setStep(first);
			setOpen(true);
		},
		[orders, setOpen, setStep]
	);

	const context = useMemo<TourContextValue>(
		() => ({ isOpen, step: current, index, total, start, next, back, skip, finish, goTo }),
		[isOpen, current, index, total, start, next, back, skip, finish, goTo]
	);

	const labels = useMemo(() => resolveTourLabels(labelsProp), [labelsProp]);

	const overlay =
		isOpen && entry ? (
			<TourOverlay
				cardClassName={cardClassName}
				entry={entry}
				haptic={haptic}
				hasProgress={hasProgress}
				hasSkip={hasSkip}
				index={index}
				isDismissible={isDismissible}
				isInteractive={isInteractive}
				labels={labels}
				onBack={back}
				onNext={next}
				onSkip={skip}
				options={resolveStepOptions({ padding, radius, shape, placement }, entry.options)}
				rootRef={rootRef}
				testID={testID}
				total={total}
			/>
		) : null;

	// The app beneath is hidden from assistive technology only while a non-interactive tour covers
	// it — an interactive tour's spotlit control has to stay reachable.
	const isAppHidden = overlay !== null && !isInteractive;
	const handleRequestClose = (): void => {
		if (isDismissible) skip();
	};

	return (
		<TourRegistryProvider value={registry}>
			<TourProvider value={context}>
				<View className={tourVariants().root({ className })} collapsable={false} ref={rootRef} testID={testID}>
					<View
						accessibilityElementsHidden={isAppHidden}
						className="grow"
						importantForAccessibility={isAppHidden ? "no-hide-descendants" : "auto"}
					>
						{children}
					</View>
					{isInteractive ? overlay : null}
				</View>
				{!isInteractive && overlay ? (
					<Modal
						animationType="none"
						navigationBarTranslucent
						onRequestClose={handleRequestClose}
						statusBarTranslucent
						supportedOrientations={["portrait", "landscape"]}
						transparent
						visible
					>
						<GestureHandlerRootView style={StyleSheet.absoluteFill}>{overlay}</GestureHandlerRootView>
					</Modal>
				) : null}
			</TourProvider>
		</TourRegistryProvider>
	);
}

/**
 * A guided walkthrough of a screen's controls: the app dims, a hole is cut around one control, and
 * a card beside it explains it, with Next, Back and Skip to move through the steps.
 *
 * **Mark the controls, not the screen.** Wrap each one in a `Tour.Step` with an `order` and a
 * title; the tour sorts them, measures the one on screen in window coordinates and draws the hole
 * around it — re-measuring on rotation. Nothing about the screen changes while the tour is
 * closed.
 *
 * **The hole glides** between targets on the UI thread, and jumps under reduce motion. The card
 * sits below the hole when it fits and above it otherwise.
 *
 * By default the tour is a `Modal`, which covers the status bar and the tab bar and swallows every
 * touch. `isInteractive` draws it inside the tour's own root instead, and passes touches inside the
 * hole through to the control beneath — the app then calls `next()` from that control's handler.
 *
 * Open it with `defaultOpen`, the `isOpen` triple, or `useTour().start()` from inside. The tour
 * keeps no record of having been seen: `onFinish` and `onSkip` are where an app writes that down.
 *
 * @example
 * <Tour defaultOpen onFinish={markSeen} onSkip={markSeen}>
 *   <Screen>
 *     <Tour.Step order={1} title="Search" description="Find anything in your library.">
 *       <SearchButton />
 *     </Tour.Step>
 *     <Tour.Step order={2} title="New note" description="Start writing." shape="circle">
 *       <Fab />
 *     </Tour.Step>
 *   </Screen>
 * </Tour>
 *
 * @example
 * function StartTour() {
 *   const tour = useTour();
 *   return <Button onPress={() => tour.start()}>Show me around</Button>;
 * }
 */
export const Tour = Object.assign(TourRoot, {
	/** One stop on the tour — wraps the control the hole is cut around. */
	Step: TourStep,
	displayName: "DelacourUI.Tour",
});
