import { Children, isValidElement, type ReactNode } from "react";
import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";

export const GRID_ITEM_VARIANTS = ["default", "outline", "muted", "plain"] as const;

export const GRID_ITEM_SIZES = ["default", "sm"] as const;

export type GridItemVariant = (typeof GRID_ITEM_VARIANTS)[number];
export type GridItemSize = (typeof GRID_ITEM_SIZES)[number];

/** Theme token an icon in `GridItem.Media` inherits. */
export const GRID_ITEM_MEDIA_ICON_TOKEN = "foreground";

/** Theme token an icon in `GridItem.Actions` inherits — a control in the corner, not the tile's subject. */
export const GRID_ITEM_ACTIONS_ICON_TOKEN = "muted-foreground";

/** A tile's variant: its own, else its group's, else `default`. */
export function resolveGridItemVariant(
	variant: GridItemVariant | undefined,
	groupVariant: GridItemVariant | undefined
): GridItemVariant {
	return variant ?? groupVariant ?? "default";
}

/** A tile's size: its own, else its group's, else `default`. */
export function resolveGridItemSize(size: GridItemSize | undefined, groupSize: GridItemSize | undefined): GridItemSize {
	return size ?? groupSize ?? "default";
}

/**
 * What a tile renders as.
 *
 * - `pressable` — it has a handler: a `Pressable`, announced as a button.
 * - `static` — no handler: a plain view with no role and no gesture handler,
 *   so a tile that only shows a number never claims to be a control.
 */
export type GridItemRender = "pressable" | "static";

export function resolveGridItemRender(options: { onPress?: () => void; onLongPress?: () => void }): GridItemRender {
	return options.onPress !== undefined || options.onLongPress !== undefined ? "pressable" : "static";
}

/** The text a tile's parts registered, by part. */
export type GridItemLabelParts = { title?: string; value?: string; description?: string };

/**
 * One accessibility label for a whole tile — title, value, description, in that
 * order, joined with commas so VoiceOver pauses between them.
 *
 * Blank parts are skipped; nothing collected is `undefined`, so the caller's
 * own label or the platform's default stands.
 */
export function joinGridItemLabel(parts: GridItemLabelParts): string | undefined {
	const label = [parts.title, parts.value, parts.description]
		.map((part) => part?.trim())
		.filter((part): part is string => part !== undefined && part.length > 0)
		.join(", ");
	return label.length > 0 ? label : undefined;
}

/** The display name `GridItem.Background` carries, and the one thing a tile sorts its children by. */
export const GRID_ITEM_BACKGROUND_DISPLAY_NAME = "DelacourUI.GridItem.Background";

/**
 * Whether an element's type is `GridItem.Background`.
 *
 * Read from the display name rather than compared by identity: Metro's dev
 * bundle hands a tile its children with their types wrapped, so
 * `child.type === GridItemBackground` is false for every one of them there and
 * the background would draw over the content it sits behind.
 */
export function isGridItemBackgroundType(type: unknown): boolean {
	if ((typeof type !== "function" && typeof type !== "object") || type === null) return false;
	return "displayName" in type && type.displayName === GRID_ITEM_BACKGROUND_DISPLAY_NAME;
}

/**
 * Moves every `GridItem.Background` to the front of a tile's children, so it is
 * drawn first — behind the content — wherever the caller wrote it.
 *
 * A single child, or any children under `asChild`, comes back untouched: there
 * is nothing to reorder, and `Pressable` with `asChild` hands its children to
 * `Children.only`, which throws on any array — even one holding one element.
 */
export function orderGridItemChildren(children: ReactNode, { asChild = false }: { asChild?: boolean } = {}): ReactNode {
	if (asChild || !Array.isArray(children)) return children;
	const items = Children.toArray(children);
	const backgrounds = items.filter((child) => isValidElement(child) && isGridItemBackgroundType(child.type));
	if (backgrounds.length === 0) return items;
	return [...backgrounds, ...items.filter((child) => !backgrounds.includes(child))];
}

/**
 * The plain text inside a text part's children, for the tile's joined label.
 *
 * Strings and numbers are read; an array of them — JSX splits `{used} GB` into
 * two children — is joined. Anything else (an element, a boolean) contributes
 * nothing, and a part holding only elements collects no text at all; pass the
 * tile an `accessibilityLabel` then.
 */
export function readGridItemText(children: unknown): string | undefined {
	if (typeof children === "string") return children;
	if (typeof children === "number") return String(children);
	if (!Array.isArray(children)) return undefined;
	const text = children
		.filter((child): child is string | number => typeof child === "string" || typeof child === "number")
		.join("");
	return text.length > 0 ? text : undefined;
}

/**
 * Styling for every part of a grid tile.
 *
 * Every variant reserves the same one-point border, transparent where the
 * variant draws none, so switching variant never moves content by a point.
 * The root clips (`overflow-hidden`), which is what lets `Background` take the
 * corner, and is what makes content taller than its cell clip rather than
 * push the grid — tile heights are the cell's, by design.
 *
 * No slot casts a shadow: a tile sits on the page beside its neighbours, not
 * above them. No slot but the three text slots holds a `text-*` colour — a
 * React Native `View` does not cascade one to a `Text`.
 *
 * Free of React Native imports so it stays unit-testable. See AGENTS.md.
 */
export const gridItemVariants = tv({
	slots: {
		group: "relative w-full",
		root: "flex-1 flex-col overflow-hidden rounded-lg border border-continuous",
		background: "absolute inset-0",
		media: "items-start justify-center",
		/** Edge length an `Icon` in the media slot inherits. */
		mediaIcon: "",
		title: "font-medium text-foreground",
		value: "font-semibold text-foreground tabular-nums",
		description: "text-muted-foreground",
		footer: "mt-auto w-full flex-row items-center justify-between gap-2",
		actions: "absolute flex-row items-center gap-1",
		/** Edge length an `Icon` in the actions slot inherits. */
		actionsIcon: "",
	},
	variants: {
		variant: {
			default: { root: "border-border bg-card" },
			outline: { root: "border-border bg-transparent" },
			muted: { root: "border-transparent bg-muted" },
			plain: { root: "border-transparent bg-transparent" },
		},
		size: {
			default: {
				root: "gap-1 p-4",
				media: "mb-2",
				mediaIcon: "size-icon-md",
				title: "text-sm",
				value: "text-2xl",
				description: "text-sm",
				actions: "end-4 top-4",
				actionsIcon: "size-icon-sm",
			},
			sm: {
				root: "gap-0.5 p-3",
				media: "mb-1.5",
				mediaIcon: "size-icon-sm",
				title: "text-xs",
				value: "text-lg",
				description: "text-xs",
				actions: "end-3 top-3",
				actionsIcon: "size-icon-xs",
			},
		},
		// The empty `false` branch types the prop as `boolean` rather than `true`.
		// See the note in button.variants.ts.
		isDisabled: { true: { root: "opacity-50" }, false: {} },
	},
	defaultVariants: {
		variant: "default",
		size: "default",
		isDisabled: false,
	},
});

export type GridItemVariantProps = VariantProps<typeof gridItemVariants>;
