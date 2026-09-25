import {
	type ReactElement,
	useCallback,
	useEffect,
	useId,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from "react";
import { useAnimateTo } from "../animation/use-animate-to";
import { useSettleCallbacks } from "../animation/use-settle-callbacks";
import { CLOSED_INDEX, indexForHeight, resolveDetached } from "../core";
import { useSheetPan } from "../gesture/use-sheet-pan";
import { useContainerLayout } from "../layout/use-container-layout";
import { useControllableState } from "../lib/use-controllable-state";
import { ANIM_STATUS, type SheetWorkletConfig } from "../state/state.types";
import { useSheetGeometry } from "../state/use-sheet-geometry";
import { type IntentRequest, useSheetIntents } from "../state/use-sheet-intents";
import { useSheetState } from "../state/use-sheet-state";
import {
	BottomSheetAnimatedContext,
	BottomSheetContext,
	BottomSheetInternalContext,
	type BottomSheetInternalValue,
} from "./bottom-sheet.context";
import type {
	BottomSheetAnimatedValue,
	BottomSheetContextValue,
	BottomSheetProps,
	BottomSheetRef,
} from "./bottom-sheet.types";
import { BottomSheetBackground } from "./bottom-sheet-background";
import { BottomSheetClose } from "./bottom-sheet-close";
import { BottomSheetContainer } from "./bottom-sheet-container";
import { BottomSheetContent } from "./bottom-sheet-content";
import { BottomSheetDescription } from "./bottom-sheet-description";
import { BottomSheetHandle } from "./bottom-sheet-handle";
import { BottomSheetOverlay } from "./bottom-sheet-overlay";
import { BottomSheetPortal } from "./bottom-sheet-portal";
import { BottomSheetTitle } from "./bottom-sheet-title";
import { BottomSheetTrigger } from "./bottom-sheet-trigger";

const EMPTY_SNAP_POINTS: readonly never[] = [];

/**
 * The root: owns the open state, the shared values, the geometry, the
 * animation and the pans, and hands all of it to the parts through three
 * contexts. It renders no view of its own.
 *
 * **State opens, intents move.** `isOpen` — controlled or not — is the one
 * source of truth for whether the sheet is open. Flipping it true mounts the
 * portal's children and queues an `open` intent, which the UI thread resolves
 * once every measurement has landed; a swipe down, an overlay press, a
 * `Close`, or the ref's `close()` animate to the closed height, and the settle
 * at `-1` is what flips `isOpen` back. Closing a sheet that is not open is
 * nothing at all — there is no present/dismiss pair to deadlock.
 *
 * A sheet mid-open counts as open for a `close()`: the animation's target,
 * not the last settled index, is what the resolver is told. Without that a
 * close during the open animation would resolve to nothing and the sheet would
 * finish opening.
 */
function BottomSheetRoot({
	children,
	ref,
	isOpen: isOpenProp,
	defaultOpen = false,
	onOpenChange,
	index: indexProp,
	initialIndex = 0,
	onIndexChange,
	onAnimate,
	onClose,
	snapPoints = EMPTY_SNAP_POINTS,
	dynamicSizing = true,
	maxDynamicContentSize,
	topInset = 0,
	bottomInset = 0,
	detached,
	enablePanDownToClose = true,
	enableHandlePanningGesture = true,
	enableContentPanningGesture = true,
	enableOverDrag = true,
	overDragResistanceFactor = 2.5,
	keyboardBehavior = "interactive",
	animation,
	overrideReduceMotion,
	animateOnMount = true,
	keepMounted = false,
	onDetentHaptic,
	onCloseHaptic,
	onOverDragHaptic,
}: BottomSheetProps): ReactElement {
	const [isOpen, setOpen] = useControllableState<boolean>({
		value: isOpenProp,
		defaultValue: defaultOpen,
		onChange: onOpenChange,
	});
	const [presented, setPresented] = useState(isOpen);
	const [index, setIndex] = useState(CLOSED_INDEX);
	const [detentCount, setDetentCount] = useState(0);
	const [hasOverlay, setHasOverlay] = useState(false);
	const handleMounted = useRef(false);
	const titleId = useId();
	const descriptionId = useId();

	const detachedOptions = useMemo(() => resolveDetached(detached), [detached]);
	const config = useMemo<SheetWorkletConfig>(
		() => ({
			dynamicSizing,
			maxDynamicContentSize,
			hasFooter: false,
			bottomInset,
			detached: detachedOptions,
			enablePanDownToClose,
			enableOverDrag,
			overDragResistanceFactor,
			initialIndex,
			animateOnMount,
			keyboardBehavior,
		}),
		[
			dynamicSizing,
			maxDynamicContentSize,
			bottomInset,
			detachedOptions,
			enablePanDownToClose,
			enableOverDrag,
			overDragResistanceFactor,
			initialIndex,
			animateOnMount,
			keyboardBehavior,
		]
	);

	const state = useSheetState(snapPoints, config);
	const geometry = useSheetGeometry(state);
	const listeners = useSettleCallbacks({
		isOpen,
		setOpen,
		setPresented,
		setIndex,
		setDetentCount,
		onIndexChange,
		onClose,
		onAnimate,
	});
	const { animateTo, jumpTo } = useAnimateTo({
		state,
		geometry,
		animation,
		overrideReduceMotion,
		onSettle: listeners.onSettle,
		onAnimate: listeners.onAnimate,
	});
	const intents = useSheetIntents(state, geometry, animateTo, jumpTo);
	const { dispatch } = intents;
	const pans = useSheetPan(state, geometry, animateTo, {
		enableHandlePanningGesture,
		enableContentPanningGesture,
		onDetentHaptic,
		onCloseHaptic,
		onOverDragHaptic,
	});
	const containerLayout = useContainerLayout(state);

	// Open for the purpose of a close: settled above the closed height, or on
	// the way there.
	const isEffectivelyOpen = useCallback((): boolean => {
		if (state.animStatus.value === ANIM_STATUS.RUNNING) {
			return indexForHeight(state.animTarget.value, geometry.detents.value, geometry.closedHeight.value) > CLOSED_INDEX;
		}
		return state.currentIndex.value > CLOSED_INDEX;
	}, [state, geometry]);

	const latestOpen = useRef(isOpen);
	latestOpen.current = isOpen;
	const moveQueued = useRef(false);

	// The queue is judged by the JS-side record of the last request, never by
	// reading the shared value back: a JS write is queued to the UI thread, so
	// the read would still show the request before it. See `useSheetIntents`.
	useEffect(() => {
		if (isOpen) {
			setPresented(true);
			// A move queued by the ref on a closed sheet is a more specific open;
			// it waits on the same layout and lands on its own detent.
			if (!moveQueued.current) dispatch({ kind: "open" });
			moveQueued.current = false;
			return;
		}
		if (isEffectivelyOpen()) {
			dispatch({ kind: "close" });
			return;
		}
		// A queued open the state changed its mind about, before layout landed.
		if (intents.lastKind() === "open") intents.clear();
	}, [isOpen, dispatch, intents, isEffectivelyOpen]);

	useEffect(() => {
		if (indexProp !== undefined && isOpen) dispatch({ kind: "snapToIndex", index: indexProp });
	}, [indexProp, isOpen, dispatch]);

	const methods = useMemo<BottomSheetRef>(() => {
		const close = (): void => {
			if (isEffectivelyOpen()) {
				dispatch({ kind: "close" });
				return;
			}
			if (latestOpen.current) setOpen(false);
		};
		// A move on a closed sheet is an open: the state flips first so the
		// portal mounts, and the queued intent lands on the requested detent.
		const move = (request: IntentRequest): void => {
			if (!isEffectivelyOpen() && !latestOpen.current) {
				moveQueued.current = true;
				setOpen(true);
			}
			dispatch(request);
		};
		return {
			open: () => setOpen(true),
			close,
			dismiss: close,
			forceClose: () => {
				if (isEffectivelyOpen()) dispatch({ kind: "forceClose" });
				else if (latestOpen.current) setOpen(false);
			},
			snapToIndex: (target) => (target < 0 ? close() : move({ kind: "snapToIndex", index: target })),
			snapToPosition: (position) => move({ kind: "snapToPosition", position }),
			expand: () => move({ kind: "expand" }),
			collapse: () => move({ kind: "collapse" }),
		};
	}, [dispatch, setOpen, isEffectivelyOpen]);

	useImperativeHandle(ref, () => methods, [methods]);

	const contextValue = useMemo<BottomSheetContextValue>(
		() => ({ ...methods, isOpen, setOpen, index, detentCount }),
		[methods, isOpen, setOpen, index, detentCount]
	);

	const animatedValue = useMemo<BottomSheetAnimatedValue>(
		() => ({
			animatedIndex: geometry.index,
			animatedPosition: geometry.position,
			animatedHeight: geometry.height,
			containerHeight: state.containerHeight,
			handleHeight: state.handleHeight,
			contentHeight: state.contentHeight,
			footerHeight: geometry.footerHeight,
			keyboardLift: geometry.keyboardLift,
			detents: geometry.detents,
			closedHeight: geometry.closedHeight,
		}),
		[geometry, state]
	);

	const internalValue = useMemo<BottomSheetInternalValue>(
		() => ({
			state,
			geometry,
			pans,
			animateTo,
			dispatch,
			containerLayout,
			presented,
			keepMounted,
			topInset,
			hasOverlay,
			setHasOverlay,
			handleMounted,
			enableHandlePanningGesture,
			titleId,
			descriptionId,
		}),
		[
			state,
			geometry,
			pans,
			animateTo,
			dispatch,
			containerLayout,
			presented,
			keepMounted,
			topInset,
			hasOverlay,
			enableHandlePanningGesture,
			titleId,
			descriptionId,
		]
	);

	return (
		<BottomSheetContext.Provider value={contextValue}>
			<BottomSheetAnimatedContext.Provider value={animatedValue}>
				<BottomSheetInternalContext.Provider value={internalValue}>{children}</BottomSheetInternalContext.Provider>
			</BottomSheetAnimatedContext.Provider>
		</BottomSheetContext.Provider>
	);
}

/**
 * A headless bottom sheet.
 *
 * @example
 * <BottomSheet snapPoints={["40%", "85%"]} dynamicSizing={false}>
 *   <BottomSheet.Trigger asChild><Button /></BottomSheet.Trigger>
 *   <BottomSheet.Portal inline>
 *     <BottomSheet.Overlay style={{ backgroundColor: "#0008" }} />
 *     <BottomSheet.Container>
 *       <BottomSheet.Background style={{ backgroundColor: "white", borderTopLeftRadius: 16, borderTopRightRadius: 16 }} />
 *       <BottomSheet.Handle style={{ padding: 12 }}><View style={pill} /></BottomSheet.Handle>
 *       <BottomSheet.Content style={{ padding: 16 }}>
 *         <BottomSheet.Title>Title</BottomSheet.Title>
 *         <BottomSheet.Close><Text>Close</Text></BottomSheet.Close>
 *       </BottomSheet.Content>
 *     </BottomSheet.Container>
 *   </BottomSheet.Portal>
 * </BottomSheet>
 */
export const BottomSheet = Object.assign(BottomSheetRoot, {
	Trigger: BottomSheetTrigger,
	Portal: BottomSheetPortal,
	Overlay: BottomSheetOverlay,
	Container: BottomSheetContainer,
	Background: BottomSheetBackground,
	Handle: BottomSheetHandle,
	Content: BottomSheetContent,
	Close: BottomSheetClose,
	Title: BottomSheetTitle,
	Description: BottomSheetDescription,
	displayName: "DelacourBottomSheet.BottomSheet",
});
