import { type ReactElement, type ReactNode, useCallback, useMemo, useRef } from "react";
import { useControllableState } from "../../hooks/use-controllable-state";
import { type BottomSheetContextValue, type BottomSheetHandle, BottomSheetProvider } from "./bottom-sheet.context";
import { BottomSheetClose } from "./bottom-sheet-close";
import { BottomSheetContainer } from "./bottom-sheet-container";
import { BottomSheetContent } from "./bottom-sheet-content";
import { BottomSheetDescription } from "./bottom-sheet-description";
import { BottomSheetFooter } from "./bottom-sheet-footer";
import { BottomSheetOverlay } from "./bottom-sheet-overlay";
import { BottomSheetPortal } from "./bottom-sheet-portal";
import { BottomSheetScrollView } from "./bottom-sheet-scroll-view";
import { BottomSheetTitle } from "./bottom-sheet-title";
import { BottomSheetTrigger } from "./bottom-sheet-trigger";

export type BottomSheetProps = {
	children?: ReactNode;
	/** Controlled open state. Leave it off and the sheet holds its own. */
	isOpen?: boolean;
	/** Initial open state while uncontrolled. */
	defaultOpen?: boolean;
	/**
	 * Called whenever the sheet opens or closes — by a trigger, a swipe down, a
	 * press on the backdrop, `BottomSheet.Close`, or a controlled `isOpen`.
	 *
	 * One callback for every path, deliberately. gorhom's own `onClose` fires for
	 * the gesture alone, which is the shape that makes a caller wire three
	 * handlers and still miss one.
	 */
	onOpenChange?: (isOpen: boolean) => void;
};

function BottomSheetRoot({ children, defaultOpen = false, isOpen, onOpenChange }: BottomSheetProps): ReactElement {
	const sheetRef = useRef<BottomSheetHandle | null>(null);
	const [isSheetOpen, setOpen] = useControllableState<boolean>({
		defaultValue: defaultOpen,
		onChange: onOpenChange,
		value: isOpen,
	});

	const open = useCallback(() => setOpen(true), [setOpen]);
	const close = useCallback(() => setOpen(false), [setOpen]);

	const context = useMemo<BottomSheetContextValue>(
		() => ({ close, isOpen: isSheetOpen, open, setOpen, sheetRef }),
		[close, isSheetOpen, open, setOpen]
	);

	return <BottomSheetProvider value={context}>{children}</BottomSheetProvider>;
}

/**
 * A panel that slides up from the bottom of the screen, over everything.
 *
 * The library's first overlay, built on `@gorhom/bottom-sheet`'s modal. It
 * renders no view of its own — it owns the open state and hands it to the parts
 * through context, so a trigger anywhere inside can open a sheet declared
 * anywhere else in the same tree.
 *
 * **The app must mount `DelacourProvider` at its root.** The sheet hosts itself in
 * the `BottomSheetModalProvider` that provider's innermost layer supplies, and it
 * needs the gesture root above it for the pan.
 *
 * **Two parts are not drawn where they are written.** `BottomSheet.Overlay` and a
 * `BottomSheet.Footer sticky` are lifted out of the tree and handed to gorhom as
 * render props — see `BottomSheet.Portal` and `BottomSheet.Container` for why the
 * anatomy is worth that. Everything else renders in place.
 *
 * Controlled or not, from one hook: pass `isOpen` and `onOpenChange` to own the
 * state, or nothing at all and let the sheet hold it. Which mode is in play is
 * locked in on first render.
 *
 * @example
 * <BottomSheet>
 *   <BottomSheet.Trigger asChild>
 *     <Button variant="secondary">Open</Button>
 *   </BottomSheet.Trigger>
 *   <BottomSheet.Portal>
 *     <BottomSheet.Overlay />
 *     <BottomSheet.Container>
 *       <BottomSheet.Content>
 *         <BottomSheet.Close />
 *         <BottomSheet.Title>Keep yourself safe</BottomSheet.Title>
 *         <BottomSheet.Description>Update to the latest version.</BottomSheet.Description>
 *       </BottomSheet.Content>
 *       <BottomSheet.Footer sticky>
 *         <Button onPress={update}>Update now</Button>
 *       </BottomSheet.Footer>
 *     </BottomSheet.Container>
 *   </BottomSheet.Portal>
 * </BottomSheet>
 *
 * @example
 * // Controlled, and opened from somewhere other than a trigger.
 * <BottomSheet isOpen={isOpen} onOpenChange={setOpen}>
 *   <BottomSheet.Portal>
 *     <BottomSheet.Overlay />
 *     <BottomSheet.Container>
 *       <BottomSheet.Content>{…}</BottomSheet.Content>
 *     </BottomSheet.Container>
 *   </BottomSheet.Portal>
 * </BottomSheet>
 */
export const BottomSheet = Object.assign(BottomSheetRoot, {
	/** The control that opens the sheet. `asChild` to make a `Button` the trigger. */
	Trigger: BottomSheetTrigger,
	/** Everything drawn above the app. Lifts the overlay out to the container. */
	Portal: BottomSheetPortal,
	/** The scrim. Written beside the container, drawn as its backdrop. */
	Overlay: BottomSheetOverlay,
	/** The sheet itself. Every gorhom prop passes through it. */
	Container: BottomSheetContainer,
	/** The sheet's body, sized to itself under `enableDynamicSizing`. */
	Content: BottomSheetContent,
	/** A scrolling body. Needs `enableDynamicSizing={false}` and snap points. */
	ScrollView: BottomSheetScrollView,
	/** The dismiss control, positioned out of the content's flow. */
	Close: BottomSheetClose,
	/** The sheet's heading — a `Text.Header` with the close control's clearance. */
	Title: BottomSheetTitle,
	/** Supporting copy under the title — a muted `Text.Paragraph`. */
	Description: BottomSheetDescription,
	/** Controls at the bottom. `sticky` pins them above the keyboard. */
	Footer: BottomSheetFooter,
	displayName: "DelacourUI.BottomSheet",
});
