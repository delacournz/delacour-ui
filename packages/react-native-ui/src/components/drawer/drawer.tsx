import { type ReactElement, type ReactNode, useCallback, useId, useMemo, useRef } from "react";
import { useControllableState } from "../../hooks/use-controllable-state";
import { type DrawerFocusTarget, DrawerProvider, type DrawerRootValue } from "./drawer.context";
import { DrawerBody } from "./drawer-body";
import { DrawerClose } from "./drawer-close";
import { DrawerContent } from "./drawer-content";
import { DrawerDescription } from "./drawer-description";
import { DrawerFooter } from "./drawer-footer";
import { DrawerHeader } from "./drawer-header";
import { DrawerTitle } from "./drawer-title";
import { DrawerTrigger } from "./drawer-trigger";

export type DrawerProps = {
	/** Whether the drawer is open. Pass it to control the drawer; omit it and the drawer holds its own state. */
	isOpen?: boolean;
	/** Whether an uncontrolled drawer starts open. Default false. */
	defaultOpen?: boolean;
	/** Called with the new value whenever the drawer opens or closes, from any path. */
	onOpenChange?: (isOpen: boolean) => void;
	/** Whether a scrim tap, Android back and the iOS escape gesture close it. Default true. */
	isDismissible?: boolean;
	children: ReactNode;
};

function DrawerRoot({
	isOpen,
	defaultOpen = false,
	onOpenChange,
	isDismissible = true,
	children,
}: DrawerProps): ReactElement {
	const [open, setControllableOpen] = useControllableState({
		defaultValue: defaultOpen,
		onChange: onOpenChange,
		value: isOpen,
	});

	// Every path — trigger, close, scrim, back, escape, swipe — lands here, and
	// a second close while the first is still exiting would report twice.
	const setOpen = useCallback(
		(next: boolean) => {
			if (next !== open) setControllableOpen(next);
		},
		[open, setControllableOpen]
	);
	const close = useCallback(() => setOpen(false), [setOpen]);

	const titleId = useId();
	const descriptionId = useId();
	const triggerRef = useRef<DrawerFocusTarget | null>(null);
	const titleRef = useRef<DrawerFocusTarget | null>(null);

	const value = useMemo<DrawerRootValue>(
		() => ({ close, descriptionId, isDismissible, isOpen: open, setOpen, titleId, titleRef, triggerRef }),
		[close, descriptionId, isDismissible, open, setOpen, titleId]
	);

	return <DrawerProvider value={value}>{children}</DrawerProvider>;
}

/**
 * A panel that slides in from an edge and covers the app until dismissed — a
 * navigation menu from the start edge, a filter panel from the end, a
 * notifications tray from the top.
 *
 * It covers the app rather than pushing it aside, and it can be swiped back
 * toward its edge. `start` and `end` follow the layout direction. A bottom
 * drawer is for short, fixed content: anything with snap points, a keyboard or
 * a long list is a `BottomSheet`.
 *
 * Draws through `Overlay.Portal`, so the app needs `OverlayProvider` mounted
 * once at its root.
 *
 * @example
 * <Drawer>
 *   <Drawer.Trigger asChild>
 *     <Button accessibilityLabel="Menu" size="icon-md" variant="ghost">
 *       <Icon icon={IconMenu} />
 *     </Button>
 *   </Drawer.Trigger>
 *   <Drawer.Content side="start">
 *     <Drawer.Header>
 *       <Drawer.Title>Menu</Drawer.Title>
 *       <Drawer.Description>Signed in as aria@harbour.studio</Drawer.Description>
 *     </Drawer.Header>
 *     <Drawer.Body>…rows…</Drawer.Body>
 *     <Drawer.Footer>
 *       <Drawer.Close asChild>
 *         <Button variant="secondary">Sign out</Button>
 *       </Drawer.Close>
 *     </Drawer.Footer>
 *   </Drawer.Content>
 * </Drawer>
 *
 * @example
 * // Controlled, from the end edge.
 * <Drawer isOpen={isOpen} onOpenChange={setIsOpen}>
 *   <Drawer.Content side="end" size="lg">…</Drawer.Content>
 * </Drawer>
 */
export const Drawer = Object.assign(DrawerRoot, {
	/** The control that opens it. `asChild` donates the press to a `Button`. */
	Trigger: DrawerTrigger,
	/** The portal, scrim and sliding panel. Renders nothing while closed. */
	Content: DrawerContent,
	/** The title block, with a ✕ at its trailing edge. */
	Header: DrawerHeader,
	/** The heading — a `Text.Header` the panel is labelled by. */
	Title: DrawerTitle,
	/** Muted supporting copy — a `Text.Paragraph`. */
	Description: DrawerDescription,
	/** The panel's content, scrolling by default. */
	Body: DrawerBody,
	/** Actions pinned to the panel's end, under a hairline. */
	Footer: DrawerFooter,
	/** A ✕, or — with `asChild` — any control that closes it. */
	Close: DrawerClose,
	displayName: "DelacourUI.Drawer",
});
