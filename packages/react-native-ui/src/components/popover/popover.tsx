import { type ReactElement, type ReactNode, useCallback, useMemo, useState } from "react";
import { useControllableState } from "../../hooks/use-controllable-state";
import { PopoverContext, type PopoverContextValue } from "./popover.context";
import type { PopoverPlacement } from "./popover.position";
import { POPOVER_DEFAULTS } from "./popover.variants";
import { PopoverAnchor } from "./popover-anchor";
import { PopoverArrow } from "./popover-arrow";
import { PopoverClose } from "./popover-close";
import { PopoverContent } from "./popover-content";
import { PopoverDescription } from "./popover-description";
import { PopoverTitle } from "./popover-title";
import { PopoverTrigger } from "./popover-trigger";
import { useAnchorMeasure } from "./use-anchor-measure";

export type PopoverProps = {
	isOpen?: boolean;
	/** Default false. */
	defaultOpen?: boolean;
	onOpenChange?: (isOpen: boolean) => void;
	/** An outside tap, Android back and the escape gesture close it. Default true. */
	isDismissible?: boolean;
	children: ReactNode;
};

function PopoverRoot({
	isOpen: isOpenProp,
	defaultOpen = false,
	onOpenChange,
	isDismissible = true,
	children,
}: PopoverProps): ReactElement {
	const [isOpen, setOpen] = useControllableState({
		value: isOpenProp,
		defaultValue: defaultOpen,
		onChange: onOpenChange,
	});
	const [anchorCount, setAnchorCount] = useState(0);
	const [placement, setPlacement] = useState<PopoverPlacement>(POPOVER_DEFAULTS.placement);
	const hasAnchor = anchorCount > 0;

	const trigger = useAnchorMeasure({ isEnabled: isOpen && !hasAnchor });
	const anchor = useAnchorMeasure({ isEnabled: isOpen && hasAnchor });

	const close = useCallback(() => setOpen(false), [setOpen]);

	const registerAnchor = useCallback(() => {
		setAnchorCount((count) => count + 1);
		return () => setAnchorCount((count) => count - 1);
	}, []);

	const value = useMemo<PopoverContextValue>(
		() => ({
			isOpen,
			setOpen,
			close,
			isDismissible,
			placement,
			onPlaced: setPlacement,
			anchorRect: hasAnchor ? anchor.rect : trigger.rect,
			triggerRef: trigger.ref,
			triggerNode: trigger.node,
			anchorRef: anchor.ref,
			registerAnchor,
		}),
		[
			isOpen,
			setOpen,
			close,
			isDismissible,
			placement,
			hasAnchor,
			anchor.rect,
			anchor.ref,
			trigger.rect,
			trigger.ref,
			trigger.node,
			registerAnchor,
		]
	);

	return <PopoverContext.Provider value={value}>{children}</PopoverContext.Provider>;
}

/**
 * A small panel anchored to the control that opened it, with the screen around
 * it still visible — a rename field beside a title, a note on a badge, a short
 * list of options.
 *
 * The placement is a preference: the panel flips across its anchor and slides
 * along it to stay inside the safe area and above the keyboard. It draws in the
 * overlay layer — over sheets, dialogs and the navigator header — so it needs
 * `OverlayProvider` at the app root. An outside tap, Android back and the
 * escape gesture close it unless `isDismissible` is false.
 *
 * Open state is `isOpen` / `defaultOpen` / `onOpenChange`, controlled or not.
 *
 * @example
 * <Popover>
 *   <Popover.Trigger asChild><Button variant="secondary">Rename</Button></Popover.Trigger>
 *   <Popover.Content align="start" width="trigger" minWidth={260}>
 *     <Popover.Arrow />
 *     <Popover.Title>Rename</Popover.Title>
 *     <Input value={name} onChangeText={setName} />
 *   </Popover.Content>
 * </Popover>
 */
export const Popover = Object.assign(PopoverRoot, {
	/** Opens the popover; the panel anchors to it unless a `Popover.Anchor` is written. */
	Trigger: PopoverTrigger,
	/** Anchors the panel to a different view than the trigger. */
	Anchor: PopoverAnchor,
	/** The panel — teleported, measured, placed and animated. */
	Content: PopoverContent,
	/** The arrow pointing from the panel at the anchor. */
	Arrow: PopoverArrow,
	/** The panel's heading, which labels it. */
	Title: PopoverTitle,
	/** Muted supporting copy under the title. */
	Description: PopoverDescription,
	/** Closes the popover — the corner ✕, or `asChild` around a button. */
	Close: PopoverClose,
	displayName: "DelacourUI.Popover",
});
