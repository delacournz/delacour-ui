import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";

/** The card's widths, narrowest first. */
export const DIALOG_SIZES = ["sm", "md", "lg", "full"] as const;
export type DialogSize = (typeof DIALOG_SIZES)[number];

/** How `Dialog.Footer` sits in the card: a row inside the padding, or a muted band bled to the edges. */
export const DIALOG_FOOTER_VARIANTS = ["plain", "panel"] as const;
export type DialogFooterVariant = (typeof DIALOG_FOOTER_VARIANTS)[number];

/** Which way `Dialog.Footer` lays out its actions. */
export type DialogFooterDirection = "row" | "column";

/** The accessibility role the card announces. */
export type DialogRole = "dialog" | "alertdialog";

/**
 * Each size's cap on the card's width.
 *
 * Classes, not numbers: the card is `w-full` and the cap is a `max-w-*`, so a
 * narrow phone shrinks every size to the gutter and a tablet stops it at the
 * cap. The arbitrary values are written out in full because Tailwind's scanner
 * is static — a width computed at runtime would compile to nothing.
 */
export const DIALOG_SIZE_CLASS = {
	sm: "max-w-[320px]",
	md: "max-w-[400px]",
	lg: "max-w-[520px]",
	full: "max-w-full",
} as const satisfies Record<DialogSize, string>;

/** The scrim's token — the foundation's, named here so the test can pin it. */
export const DIALOG_SCRIM_TOKEN = "overlay";

/** Slop around the corner ✕ — a bare glyph has no capsule to bring it toward 44pt. */
export const DIALOG_CLOSE_HIT_SLOP = 8;

/** The scale the card grows from on enter. */
export const DIALOG_ENTER_SCALE = 0.96;

/** How far below its resting place the card starts on enter, in points. */
export const DIALOG_ENTER_TRANSLATE_Y = 8;

/** The clearance kept between the card's bottom edge and the keyboard's top, in points. */
export const DIALOG_KEYBOARD_MARGIN = 16;

export const dialogVariants = tv({
	slots: {
		/** The foundation's scrim token. The fade is `Overlay.Scrim`'s own. */
		scrim: "bg-overlay",
		/**
		 * The window-sized frame the card is centred in. The gutter is the
		 * screen's, so a `full` card lines up with the content behind it.
		 */
		positioner: "absolute inset-0 items-center justify-center px-screen-gutter",
		/**
		 * The card. `popover` because a dialog is a layer over the app — the
		 * token `BottomSheet` paints with too — and `rounded-lg` because that is
		 * the card corner (see the package's Sizing section).
		 */
		content: "w-full gap-4 rounded-lg border border-border bg-popover p-5",
		close: "absolute top-4 right-4 z-10",
		header: "gap-1.5",
		/**
		 * Clearance for `Dialog.Close`, and nothing else — reserved on every
		 * dialog so adding a close never reflows the title. The type is
		 * `Text.Header`'s; a size here would be a second definition of it.
		 */
		title: "pr-8",
		body: "gap-3",
		footer: "gap-2",
	},
	variants: {
		size: {
			sm: { content: DIALOG_SIZE_CLASS.sm },
			md: { content: DIALOG_SIZE_CLASS.md },
			lg: { content: DIALOG_SIZE_CLASS.lg },
			full: { content: DIALOG_SIZE_CLASS.full },
		},
		footer: {
			plain: {},
			/**
			 * Bleeds out of the card's `p-5` on three sides, then restores it as
			 * its own padding, so the band reaches the edges and the hairline runs
			 * corner to corner. Only the bottom corners round: the top edge meets
			 * the card's own fill.
			 */
			panel: { footer: "-mx-5 -mb-5 mt-1 rounded-b-lg border-border border-t bg-muted px-5 py-4" },
		},
		footerDirection: {
			row: { footer: "flex-row items-center justify-end" },
			/** Stacked full width, in written order — so the primary action, written last, sits last. */
			column: { footer: "flex-col" },
		},
	},
	defaultVariants: {
		size: "md",
		footer: "plain",
		footerDirection: "row",
	},
});

/**
 * There is no `description` slot. A description is a muted `Text.Paragraph` in
 * the header's gap column with no layout of its own, and `tv` emits `undefined`
 * for an empty class string — a slot no test could assert against. The part
 * merges the caller's `className` with `cn()` instead, as `BottomSheet`'s does.
 */
export type DialogVariantProps = VariantProps<typeof dialogVariants>;

/**
 * Whether a footer's actions sit side by side or stack.
 *
 * Only the `sm` card stacks: two labelled buttons in a row on a 320pt card
 * leave each label a few characters before it truncates. Pure so the rule is
 * reachable from `bun test`.
 */
export function resolveDialogFooterDirection(size: DialogSize): DialogFooterDirection {
	return size === "sm" ? "column" : "row";
}

/**
 * The role the card announces. A dialog the user cannot dismiss is an alert
 * dialog: assistive technology tells them only an action will close it.
 */
export function resolveDialogRole(isDismissible: boolean): DialogRole {
	return isDismissible ? "dialog" : "alertdialog";
}

export type DialogKeyboardLiftInput = {
	/** The keyboard's height. Either sign — the keyboard controller reports it negative while open. */
	keyboardHeight: number;
	/** The card's top edge in window coordinates, before any lift. */
	cardTop: number;
	/** The card's bottom edge in window coordinates, before any lift. */
	cardBottom: number;
	windowHeight: number;
	/** The top safe-area inset — the card's top never rises past it. */
	topInset: number;
	/** The clearance to keep between the card and the keyboard. */
	margin: number;
};

/**
 * How far to lift the card so the keyboard does not cover it.
 *
 * The smallest lift that keeps the card's bottom `margin` above the keyboard's
 * top — zero when the keyboard is closed or already clear — capped so the
 * card's top never rises under the top safe-area inset, and never negative. A
 * card too tall to fit both ways keeps its top on screen: the title and the
 * field being typed into matter more than the footer.
 *
 * A worklet, because it runs inside the card's animated style on every frame
 * of the keyboard's own animation.
 */
export function resolveDialogKeyboardLift({
	keyboardHeight,
	cardTop,
	cardBottom,
	windowHeight,
	topInset,
	margin,
}: DialogKeyboardLiftInput): number {
	"worklet";
	const keyboard = Math.abs(keyboardHeight);
	if (keyboard === 0 || cardBottom <= 0) return 0;

	const needed = cardBottom + margin - (windowHeight - keyboard);
	const room = cardTop - topInset;

	return Math.max(0, Math.min(needed, room));
}
