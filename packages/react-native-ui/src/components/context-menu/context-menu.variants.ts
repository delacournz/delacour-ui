import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import type { MenuAlign, MenuAnchorRect, MenuPlacement } from "../menu/menu.variants";

export const CONTEXT_MENU_ANCHORS = ["point", "target"] as const;

/** What the panel hangs off: the finger's press point, or the held content's rect. */
export type ContextMenuAnchor = (typeof CONTEXT_MENU_ANCHORS)[number];

/** How the menu was asked for. A screen reader has no pointer coordinate. */
export type ContextMenuInvoker = "pointer" | "accessibility";

/** A press point in window coordinates. */
export type ContextMenuPoint = { x: number; y: number };

/**
 * The hold: `delay` ms before it is accepted, `slop` pt the finger may drift
 * meanwhile. `minDelay` is the floor — anything shorter is a tap.
 */
export const CONTEXT_MENU_HOLD = { delay: 350, minDelay: 150, slop: 12 } as const;

/**
 * `ContextMenu.Content`'s defaults, where they differ from `Menu.Content`'s: a
 * wider floor (a point anchor has no width to inherit), a little more gap from
 * the finger, and a scrim — the content behind is not the menu's control.
 */
export const CONTEXT_MENU_CONTENT_DEFAULTS: {
	placement: MenuPlacement;
	align: MenuAlign;
	offset: number;
	minWidth: number;
	hasScrim: boolean;
} = { align: "start", hasScrim: true, minWidth: 280, offset: 8, placement: "bottom" };

/** How far the lifted preview grows, 1 → this. */
export const CONTEXT_MENU_PREVIEW_SCALE = 1.03;

/** How long the preview takes to lift, in ms — Menu's enter, so the two arrive together. */
export const CONTEXT_MENU_PREVIEW_MS = 160;

/** The label a screen reader reads for the long-press action. */
export const CONTEXT_MENU_SHOW_LABEL = "Show menu";

export const CONTEXT_MENU_ACCESSIBILITY_ACTIONS: ReadonlyArray<{ name: string; label?: string }> = [
	{ name: "activate" },
	{ label: CONTEXT_MENU_SHOW_LABEL, name: "longpress" },
];

export type ContextAnchorInput = {
	mode: ContextMenuAnchor;
	/** The press point, or `null` when there was none — a screen-reader open. */
	point: ContextMenuPoint | null;
	/** The trigger's measured window rect. */
	targetRect: MenuAnchorRect;
	hasPreview: boolean;
	invokedBy: ContextMenuInvoker;
};

/**
 * The rect the panel is placed against.
 *
 * `point` mode gives a zero-size rect at the press, which Menu's placement
 * resolver handles with no special case. Three things force the target instead:
 * `target` mode; a `ContextMenu.Preview`, so the panel opens outside the lifted
 * copy rather than across it; and a screen-reader open, which has no point.
 */
export function resolveContextAnchor({
	mode,
	point,
	targetRect,
	hasPreview,
	invokedBy,
}: ContextAnchorInput): MenuAnchorRect {
	const isTarget = mode === "target" || hasPreview || invokedBy === "accessibility" || point === null;
	if (isTarget) return { height: targetRect.height, width: targetRect.width, x: targetRect.x, y: targetRect.y };
	return { height: 0, width: 0, x: point.x, y: point.y };
}

/**
 * The hold's timing: defaults of 350ms and 12pt, a 150ms floor on the delay so
 * a tap can never open the menu, and a zero floor on the slop. A non-finite
 * value takes the default.
 */
export function resolveHoldConfig({ delay, slop }: { delay?: number; slop?: number }): {
	delay: number;
	slop: number;
} {
	const d = delay !== undefined && Number.isFinite(delay) ? delay : CONTEXT_MENU_HOLD.delay;
	const s = slop !== undefined && Number.isFinite(slop) ? slop : CONTEXT_MENU_HOLD.slop;
	return { delay: Math.max(CONTEXT_MENU_HOLD.minDelay, d), slop: Math.max(0, s) };
}

/** What an accessibility action resolves to. */
export type ContextMenuActionOutcome = "press" | "open" | "none";

/**
 * The trigger's accessibility: a `button` when it has `onPress` (activating it
 * does something of its own), otherwise no role — the content inside speaks for
 * itself. `activate` runs `onPress`, or opens when there is none; `longpress`
 * ("Show menu") opens. Disabled, neither does anything.
 */
export function resolveContextMenuAccessibility({
	hasPress,
	isDisabled,
	isOpen,
}: {
	hasPress: boolean;
	isDisabled: boolean;
	isOpen: boolean;
}): {
	role: "button" | "none";
	state: { disabled: boolean; expanded: boolean };
	onAction: (name: string) => ContextMenuActionOutcome;
} {
	return {
		onAction: (name) => {
			if (isDisabled) return "none";
			if (name === "activate") return hasPress ? "press" : "open";
			if (name === "longpress") return "open";
			return "none";
		},
		role: hasPress ? "button" : "none",
		state: { disabled: isDisabled, expanded: isOpen },
	};
}

/**
 * Styling for ContextMenu's own parts. The rows and the panel are Menu's, and
 * wear `menuVariants`; this holds only what differs.
 *
 * - `trigger` lays out like a plain `View` — it neither shrinks to its child nor
 *   adds anything to it.
 * - `preview` is the lifted copy, absolutely placed at the trigger's window rect.
 * - `item` makes a row taller: content menus are reached by a held finger, and a
 *   48pt row is easier to land after the lift.
 *
 * Free of React Native imports so it stays reachable from `bun test`.
 */
export const contextMenuVariants = tv({
	slots: {
		trigger: "relative",
		preview: "absolute shadow-lg",
		item: "min-h-12",
	},
});

export type ContextMenuVariantProps = VariantProps<typeof contextMenuVariants>;
