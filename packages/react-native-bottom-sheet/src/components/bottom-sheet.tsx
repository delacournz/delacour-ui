import {
	type ReactElement,
	type RefObject,
	useCallback,
	useEffect,
	useId,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from "react";
import { BackHandler } from "react-native";
import { useAnimateTo } from "../animation/use-animate-to";
import { useSettleCallbacks } from "../animation/use-settle-callbacks";
import {
	CLOSED_INDEX,
	indexForHeight,
	resolveDetached,
	SCROLLABLE_TYPE,
	type ScrollableType,
	type SheetEvent,
	type SheetStepOverride,
} from "../core";
import { useSheetPan } from "../gesture/use-sheet-pan";
import { useSheetKeyboard } from "../keyboard/use-sheet-keyboard";
import { useContainerLayout } from "../layout/use-container-layout";
import { useControllableState } from "../lib/use-controllable-state";
import { BottomSheetHost } from "../portal/bottom-sheet-host";
import { BottomSheetProvider } from "../portal/bottom-sheet-provider";
import { isTop } from "../portal/sheet-registry";
import { useOptionalSheetRegistry } from "../portal/sheet-registry.context";
import { BottomSheetFlatList } from "../scrollable/bottom-sheet-flat-list";
import { BottomSheetScrollView } from "../scrollable/bottom-sheet-scroll-view";
import { BottomSheetSectionList } from "../scrollable/bottom-sheet-section-list";
import type { ScrollableHandle } from "../scrollable/scrollable.types";
import { ANIM_STATUS, type SheetWorkletConfig } from "../state/state.types";
import { useSheetGeometry } from "../state/use-sheet-geometry";
import { type IntentRequest, useSheetIntents } from "../state/use-sheet-intents";
import { useSheetState } from "../state/use-sheet-state";
import { BottomSheetStep } from "../steps/bottom-sheet-step";
import { BottomSheetSteps } from "../steps/bottom-sheet-steps";
import type { SheetStepController } from "../steps/steps.types";
import {
	BottomSheetAnimatedContext,
	BottomSheetContext,
	BottomSheetInternalContext,
	type BottomSheetInternalValue,
	type ContentHeightSource,
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
import { BottomSheetFooter } from "./bottom-sheet-footer";
import { BottomSheetHandle } from "./bottom-sheet-handle";
import { BottomSheetOverlay } from "./bottom-sheet-overlay";
import { BottomSheetPortal } from "./bottom-sheet-portal";
import { BottomSheetTextInput } from "./bottom-sheet-text-input";
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
	keyboardBlurBehavior = "restore",
	keyboardScope = "inside",
	enableBlurKeyboardOnGesture = true,
	animation,
	overrideReduceMotion,
	animateOnMount = true,
	keepMounted = false,
	stackBehavior = "push",
	closeOnBack = true,
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
	const [hasFooter, setHasFooter] = useState(false);
	const handleMounted = useRef(false);
	const titleId = useId();
	const descriptionId = useId();
	const sheetId = useId();
	const registry = useOptionalSheetRegistry();

	const detachedOptions = useMemo(() => resolveDetached(detached), [detached]);

	// A `Steps` body may override the detents and the dismissibility for the
	// step it is on. A step that names its `snapPoints` is sized by them, so
	// dynamic sizing is off while it is current.
	const [stepOverride, setStepOverride] = useState<SheetStepOverride | null>(null);
	const [stepController, setStepController] = useState<SheetStepController<string, unknown, SheetEvent> | null>(null);
	const stepControllerRef = useRef<SheetStepController<string, unknown, SheetEvent> | null>(null);
	const contentHeightSource = useRef<ContentHeightSource>("content");
	const setContentHeightSource = useCallback((source: ContentHeightSource) => {
		contentHeightSource.current = source;
	}, []);
	const effectiveSnapPoints = stepOverride?.snapPoints ?? snapPoints;
	const effectiveDynamicSizing = stepOverride?.snapPoints === undefined ? dynamicSizing : false;
	const effectivePanDownToClose = stepOverride?.dismissible === false ? false : enablePanDownToClose;

	const config = useMemo<SheetWorkletConfig>(
		() => ({
			dynamicSizing: effectiveDynamicSizing,
			maxDynamicContentSize,
			hasFooter,
			bottomInset,
			detached: detachedOptions,
			enablePanDownToClose: effectivePanDownToClose,
			enableOverDrag,
			overDragResistanceFactor,
			initialIndex,
			animateOnMount,
			keyboardBehavior,
			keyboardBlurBehavior,
			keyboardScope,
			enableBlurKeyboardOnGesture,
		}),
		[
			effectiveDynamicSizing,
			maxDynamicContentSize,
			hasFooter,
			bottomInset,
			detachedOptions,
			effectivePanDownToClose,
			enableOverDrag,
			overDragResistanceFactor,
			initialIndex,
			animateOnMount,
			keyboardBehavior,
			keyboardBlurBehavior,
			keyboardScope,
			enableBlurKeyboardOnGesture,
		]
	);

	const state = useSheetState(effectiveSnapPoints, config);
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
	const { animateTo, jumpTo, settleAt } = useAnimateTo({
		state,
		geometry,
		animation,
		overrideReduceMotion,
		onSettle: listeners.onSettle,
		onAnimate: listeners.onAnimate,
	});
	const intents = useSheetIntents(state, geometry, animateTo, jumpTo);
	const { dispatch } = intents;
	const pans = useSheetPan(state, geometry, animateTo, settleAt, {
		enableHandlePanningGesture,
		enableContentPanningGesture,
		onDetentHaptic,
		onCloseHaptic,
		onOverDragHaptic,
	});
	const containerLayout = useContainerLayout(state);
	const keyboard = useSheetKeyboard({ state, geometry, animateTo, presented });

	// One scrollable at a time: the last to focus is the body the content pan
	// reasons about, and its withdrawal puts the offset back to the top.
	const scrollableRef = useRef<RefObject<ScrollableHandle | null> | null>(null);
	const setScrollableRef = useCallback(
		(ref: RefObject<ScrollableHandle | null>, type: ScrollableType) => {
			scrollableRef.current = ref;
			state.scrollableType.value = type;
		},
		[state]
	);
	const removeScrollableRef = useCallback(
		(ref: RefObject<ScrollableHandle | null>) => {
			if (scrollableRef.current !== ref) return;
			scrollableRef.current = null;
			state.scrollableType.value = SCROLLABLE_TYPE.NONE;
			state.scrollOffsetY.value = 0;
			state.scrollLockedAt.value = 0;
		},
		[state]
	);

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

	// The registry closes sheets it holds no ref to — `dismissAll`, a `replace`
	// open in the same host — through the same methods the ref exposes.
	const register = registry?.register;
	useEffect(() => {
		if (register === undefined) return;
		return register(sheetId, { close: methods.close, forceClose: methods.forceClose });
	}, [register, sheetId, methods]);

	// Android's back button closes the top sheet of its host and nothing else:
	// without a registry every sheet is its own top. Subscribed only while
	// presented, so a closed sheet never swallows a press.
	const registryTop = registry === null ? true : isTop(registry.state, sheetId);
	useEffect(() => {
		if (!presented || !closeOnBack || !registryTop) return;
		const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
			methods.close();
			return true;
		});
		return () => subscription.remove();
	}, [presented, closeOnBack, registryTop, methods]);

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
			bottomInset,
			hasOverlay,
			setHasOverlay,
			hasFooter,
			setHasFooter,
			keyboard,
			handleMounted,
			enableHandlePanningGesture,
			enableContentPanningGesture,
			setScrollableRef,
			removeScrollableRef,
			titleId,
			descriptionId,
			sheetId,
			stackBehavior,
			detached: detachedOptions,
			animation,
			overrideReduceMotion,
			contentHeightSource,
			setContentHeightSource,
			stepOverride,
			setStepOverride,
			stepControllerRef,
			stepController,
			setStepController,
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
			bottomInset,
			hasOverlay,
			hasFooter,
			keyboard,
			enableHandlePanningGesture,
			enableContentPanningGesture,
			setScrollableRef,
			removeScrollableRef,
			titleId,
			descriptionId,
			sheetId,
			stackBehavior,
			detachedOptions,
			animation,
			overrideReduceMotion,
			setContentHeightSource,
			stepOverride,
			stepController,
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
	Footer: BottomSheetFooter,
	TextInput: BottomSheetTextInput,
	ScrollView: BottomSheetScrollView,
	FlatList: BottomSheetFlatList,
	SectionList: BottomSheetSectionList,
	Host: BottomSheetHost,
	Provider: BottomSheetProvider,
	Steps: BottomSheetSteps,
	Step: BottomSheetStep,
	displayName: "DelacourBottomSheet.BottomSheet",
});
