import { createContext, type ReactElement, type ReactNode, use, useCallback, useMemo, useState } from "react";
import { useMenuPart } from "../menu/menu.context";
import type { MenuAnchorRect } from "../menu/menu.variants";
import {
	type ContextMenuAnchor,
	type ContextMenuInvoker,
	type ContextMenuPoint,
	resolveContextAnchor,
} from "./context-menu.variants";

/** One hold (or screen-reader action) that opened the menu, as the trigger saw it. */
export type ContextMenuInvocation = {
	mode: ContextMenuAnchor;
	point: ContextMenuPoint | null;
	targetRect: MenuAnchorRect;
	invokedBy: ContextMenuInvoker;
	/**
	 * The very rect handed to Menu's `open()`. Menu keeps it by identity, so a
	 * mismatch means the menu was opened some other way — a parent flipping
	 * `isOpen` — and this invocation is stale.
	 */
	opened: MenuAnchorRect;
};

export type ContextMenuContextValue = {
	invocation: ContextMenuInvocation | null;
	invoke: (invocation: ContextMenuInvocation) => void;
	/** The trigger's children, which a bare `ContextMenu.Preview` lifts. */
	content: ReactNode;
	registerContent: (content: ReactNode) => void;
};

const ContextMenuContext = createContext<ContextMenuContextValue | null>(null);

export function ContextMenuProvider({
	value,
	children,
}: {
	value: ContextMenuContextValue;
	children: ReactNode;
}): ReactElement {
	return <ContextMenuContext value={value}>{children}</ContextMenuContext>;
}
ContextMenuProvider.displayName = "DelacourUI.ContextMenu.Provider";

/** The context-menu context, for its own parts. Throws with the part's name outside a `ContextMenu`. */
export function useContextMenuPart(part: string): ContextMenuContextValue {
	const context = use(ContextMenuContext);
	if (!context) throw new Error(`${part} must be used inside a <ContextMenu>.`);
	return context;
}

/** The root's state: the last invocation and the trigger's registered children. */
export function useContextMenuRootValue(): ContextMenuContextValue {
	const [invocation, setInvocation] = useState<ContextMenuInvocation | null>(null);
	const [content, setContent] = useState<ReactNode>(null);
	const invoke = useCallback((next: ContextMenuInvocation) => setInvocation(next), []);
	const registerContent = useCallback((next: ReactNode) => setContent(next), []);
	return useMemo(
		() => ({ content, invocation, invoke, registerContent }),
		[content, invocation, invoke, registerContent]
	);
}

/**
 * Where the panel anchors and where the lifted preview sits, for this visit.
 *
 * Read by both `ContextMenu.Content` and `ContextMenu.Preview`, so the two can
 * never disagree. A current invocation runs through `resolveContextAnchor`;
 * without one (a controlled open) both fall back to the trigger rect Menu
 * measured itself.
 */
export function useContextMenuTarget(
	part: string,
	hasPreview: boolean
): { anchor: MenuAnchorRect | null; targetRect: MenuAnchorRect | null } {
	const { anchor: menuAnchor } = useMenuPart(part);
	const { invocation } = useContextMenuPart(part);
	const current = invocation !== null && invocation.opened === menuAnchor ? invocation : null;
	if (!current) return { anchor: menuAnchor, targetRect: menuAnchor };
	return {
		anchor: resolveContextAnchor({
			hasPreview,
			invokedBy: current.invokedBy,
			mode: current.mode,
			point: current.point,
			targetRect: current.targetRect,
		}),
		targetRect: current.targetRect,
	};
}
