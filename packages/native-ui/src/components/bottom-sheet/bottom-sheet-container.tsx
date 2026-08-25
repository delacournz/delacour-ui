import {
	type BottomSheetBackdropProps,
	BottomSheetModal,
	type BottomSheetModalProps,
	type BottomSheetBackgroundProps as GorhomBottomSheetBackgroundProps,
	type BottomSheetFooterProps as GorhomBottomSheetFooterProps,
	type BottomSheetHandleProps as GorhomBottomSheetHandleProps,
} from "@gorhom/bottom-sheet";
import {
	Children,
	cloneElement,
	isValidElement,
	type ReactElement,
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
} from "react";
import { useSharedValue } from "react-native-reanimated";
import { useKeyboardAnimationGuard } from "../../hooks/use-keyboard-state-sync";
import {
	BottomSheetContainerProvider,
	BottomSheetProvider,
	useBottomSheetPart,
	useBottomSheetPortalContext,
} from "./bottom-sheet.context";
import {
	BOTTOM_SHEET_KEYBOARD_DEFAULTS,
	type BottomSheetFooterFlag,
	type BottomSheetFooterPlacement,
	resolveFooterPlacement,
} from "./bottom-sheet.variants";
import { BottomSheetBackground } from "./bottom-sheet-background";
import { BottomSheetFooter, type BottomSheetFooterProps } from "./bottom-sheet-footer";
import { BottomSheetHandle } from "./bottom-sheet-handle";

export type BottomSheetContainerProps = Omit<
	BottomSheetModalProps,
	"backdropComponent" | "backgroundComponent" | "children" | "footerComponent" | "handleComponent" | "onDismiss" | "ref"
> & {
	children?: ReactNode;
	/** Classes for the sheet's surface — the box behind the handle and the content. */
	backgroundClassName?: string;
	/** Classes for the row the grabber sits in. */
	handleClassName?: string;
	/** Classes for the grabber itself. */
	handleIndicatorClassName?: string;
};

/**
 * The sheet itself: the surface that slides up, and everything inside it.
 *
 * Every gorhom prop passes through, so snap points, dynamic sizing, the pan
 * gestures and the animation configs are all reachable. Four are not, because
 * this component supplies them: the backdrop and the footer are cloned from the
 * parts a caller wrote, and the background and the handle are rendered as views
 * of this package's own so they can take a `className` rather than a style.
 *
 * **It takes no `className`.** gorhom's modal wears an animated style that the
 * sheet's own position writes to every frame, so there is nothing here for a
 * class to reach that `backgroundClassName` does not already reach better. The
 * same trade `Screen.Footer` makes — that file takes a `style` and never a
 * `className`, and so wraps nothing in `withUniwind`.
 *
 * **Presenting is driven by state, never by the ref.** `isOpen` on the root is
 * the one source, so a swipe-down, a backdrop press, `BottomSheet.Close` and a
 * programmatic close all arrive at the same `onOpenChange`. gorhom's own
 * `onDismiss` is therefore not forwarded: two callbacks for one event is two
 * things that can disagree. `useBottomSheet().sheetRef` is still there for the
 * imperative calls with no declarative form — `snapToIndex`, `expand`.
 *
 * **`accessible` defaults to `false`, and that is not a small thing.** gorhom
 * marks the sheet's content container `accessible` with the label "Bottom
 * Sheet" and the `adjustable` role. On iOS an `accessible` container collapses
 * its whole subtree into ONE element, so every field, button and line of copy in
 * the sheet becomes unreachable to VoiceOver — a form in a sheet cannot be
 * filled in at all. This is `Field`'s rule one component along: the row is
 * `accessible={false}` so the control stays the element a screen reader sees.
 * Pass `accessible` to opt back into gorhom's behaviour for a sheet whose body
 * really is one adjustable thing.
 *
 * Three defaults differ from gorhom's. `enablePanDownToClose` is on, because a
 * modal sheet has no collapsed resting state to pan down to. And the keyboard
 * trio comes from `BOTTOM_SHEET_KEYBOARD_DEFAULTS` — see that const for why
 * Android must not be left on `adjustPan`. Both are ordinary props, so either
 * can be turned back off.
 *
 * @example
 * <BottomSheet.Container>
 *   <BottomSheet.Content>{…}</BottomSheet.Content>
 * </BottomSheet.Container>
 *
 * @example
 * // A scrollable sheet needs a fixed height to scroll within.
 * <BottomSheet.Container enableDynamicSizing={false} snapPoints={["50%", "90%"]}>
 *   <BottomSheet.ScrollView>{rows}</BottomSheet.ScrollView>
 *   <BottomSheet.Footer sticky>{actions}</BottomSheet.Footer>
 * </BottomSheet.Container>
 */
export function BottomSheetContainer({
	accessible = false,
	backgroundClassName,
	children,
	enablePanDownToClose = true,
	handleClassName,
	handleIndicatorClassName,
	...props
}: BottomSheetContainerProps): ReactElement {
	const sheet = useBottomSheetPart("BottomSheet.Container");
	const { isOpen, setOpen, sheetRef } = sheet;
	const portal = useBottomSheetPortalContext();
	// A sheet that opens while `KeyboardProvider`'s shared values are pinned open
	// by a keyboard that vanished without a `will` event would size itself for a
	// keyboard that is not there. `Screen.Footer` runs the same repair on mount.
	useKeyboardAnimationGuard();

	// Whether this sheet has ever been presented. A JS ref rather than state:
	// nothing renders differently for it, and it has to be readable inside the
	// effect that sets it.
	const hasPresentedRef = useRef(false);

	const { content, footer, placement } = useMemo(() => hoistFooter(children), [children]);
	const hasStickyFooter = placement === "sticky";
	const overlay = portal?.overlay ?? null;

	// Written by the pinned footer's own onLayout, read by the body's spacer. It
	// lives here because the two are siblings in gorhom's tree and neither can see
	// the other — the footer is rendered outside the children this file wraps.
	const footerHeight = useSharedValue(0);

	const containerValue = useMemo(() => ({ footerHeight, hasStickyFooter }), [footerHeight, hasStickyFooter]);

	const backdropComponent = useMemo(
		() =>
			overlay === null ? undefined : (backdropProps: BottomSheetBackdropProps) => cloneElement(overlay, backdropProps),
		[overlay]
	);

	const footerComponent = useMemo(
		() =>
			footer === null
				? undefined
				: (footerProps: GorhomBottomSheetFooterProps) => cloneElement(footer, { ...footerProps, footerHeight }),
		[footer, footerHeight]
	);

	const backgroundComponent = useCallback(
		(backgroundProps: GorhomBottomSheetBackgroundProps) => (
			<BottomSheetBackground {...backgroundProps} className={backgroundClassName} />
		),
		[backgroundClassName]
	);

	const handleComponent = useCallback(
		(handleProps: GorhomBottomSheetHandleProps) => (
			<BottomSheetHandle {...handleProps} className={handleClassName} indicatorClassName={handleIndicatorClassName} />
		),
		[handleClassName, handleIndicatorClassName]
	);

	const handleDismiss = useCallback(() => {
		hasPresentedRef.current = false;
		setOpen(false);
	}, [setOpen]);

	useEffect(() => {
		if (isOpen) {
			hasPresentedRef.current = true;
			sheetRef.current?.present();
			return;
		}

		// Dismissing a modal that was never presented is NOT a no-op, and this is
		// the sharpest edge in the component. gorhom's modal starts at status
		// `INITIAL`; `dismiss()` reads that as a live sheet being closed and moves
		// it to `DISMISSING`, where it stays. The next `present()` then mounts the
		// portal and renders the sheet — and it never animates in, never lays out
		// its content, and never fires `onChange`. Nothing is logged, nothing
		// throws, and the screen simply does not change.
		if (!hasPresentedRef.current) return;
		hasPresentedRef.current = false;
		sheetRef.current?.dismiss();
	}, [isOpen, sheetRef]);

	return (
		<BottomSheetModal
			accessible={accessible}
			backdropComponent={backdropComponent}
			backgroundComponent={backgroundComponent}
			enablePanDownToClose={enablePanDownToClose}
			footerComponent={footerComponent}
			handleComponent={handleComponent}
			onDismiss={handleDismiss}
			ref={sheetRef}
			{...BOTTOM_SHEET_KEYBOARD_DEFAULTS}
			{...props}
		>
			<BottomSheetProvider value={sheet}>
				<BottomSheetContainerProvider value={containerValue}>{content}</BottomSheetContainerProvider>
			</BottomSheetProvider>
		</BottomSheetModal>
	);
}
BottomSheetContainer.displayName = "DelacourUI.BottomSheet.Container";

/**
 * Splits a container's children into the body and a footer to be pinned.
 *
 * gorhom takes a footer as a `footerComponent` render prop rather than as a
 * child, so a sticky one has to leave the tree it was written in; an inline one
 * stays put and is simply part of the body. {@link resolveFooterPlacement} is the
 * decision and is pure, so `bun test` reaches the whole matrix — this walk only
 * turns children into the flags it reads.
 *
 * Lives here rather than with the parts: it is the container that lifts its own
 * children, and importing it from `bottom-sheet-footer.tsx` would close a cycle.
 * See AGENTS.md.
 */
function hoistFooter(children: ReactNode): {
	content: ReactNode;
	footer: ReactElement<BottomSheetFooterProps> | null;
	placement: BottomSheetFooterPlacement;
} {
	const items = Children.toArray(children);
	const flags: BottomSheetFooterFlag[] = [];
	let footer: ReactElement<BottomSheetFooterProps> | null = null;

	for (const child of items) {
		if (!isValidElement(child) || child.type !== BottomSheetFooter) {
			flags.push({ isFooter: false, isSticky: false });
			continue;
		}

		const element = child as ReactElement<BottomSheetFooterProps>;
		const isSticky = element.props.sticky === true;
		flags.push({ isFooter: true, isSticky });
		if (isSticky) footer ??= element;
	}

	const placement = resolveFooterPlacement(flags);
	if (placement !== "sticky" || footer === null) return { content: items, footer: null, placement };

	return { content: items.filter((child) => child !== footer), footer, placement };
}
