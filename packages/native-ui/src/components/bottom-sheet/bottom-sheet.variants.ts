import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";

/**
 * The scrim token, named here so a test can pin it against `theme.css`.
 *
 * A token rather than a `bg-black/50` written at a call site: the two theme
 * variants carry different alphas, because a pure-black scrim over a near-black
 * dark theme is nearly invisible.
 */
export const BOTTOM_SHEET_OVERLAY_TOKEN = "overlay";

/**
 * The backdrop's opacity at full appearance.
 *
 * **1, not gorhom's 0.5.** The alpha lives in `--color-overlay`, so leaving the
 * library default in place would multiply the two and land the scrim at roughly
 * a fifth of what the theme asked for. One source for the alpha, and it is the
 * token — which is also what lets the two theme variants differ.
 */
export const BOTTOM_SHEET_OVERLAY_OPACITY = 1;

/**
 * The snap indices the scrim appears and disappears on.
 *
 * gorhom defaults to `{ appearsOnIndex: 1, disappearsOnIndex: 0 }`, which suits
 * a persistent sheet that rests collapsed on the screen and only dims the app
 * once it is expanded. A modal sheet has no resting state: it is either
 * presented or gone, so the scrim belongs from the FIRST snap point (`0`) and
 * is only absent when the sheet is closed (`-1`).
 */
export const BOTTOM_SHEET_BACKDROP_INDICES = { appearsOnIndex: 0, disappearsOnIndex: -1 } as const;

/**
 * Keyboard behaviour every `BottomSheet.Container` starts from.
 *
 * A const rather than three defaults spelled inline, so `bun test` pins them and
 * a retune is one edit rather than three.
 *
 * - `interactive` — the sheet grows to keep its content above the keyboard,
 *   following it frame by frame rather than snapping once it has settled.
 * - `restore` — blurring returns the sheet to the snap point it was on. Without
 *   it a sheet that grew for the keyboard stays grown over empty screen.
 * - `adjustResize` — gorhom's own default is `adjustPan`, which leaves the
 *   Android window height alone and slides the whole view up, so a sheet's
 *   footer lands off-screen. `resize` is already what Expo configures and what
 *   `KeyboardProvider` requires, so this is the value that matches the window.
 */
export const BOTTOM_SHEET_KEYBOARD_DEFAULTS = {
	keyboardBehavior: "interactive",
	keyboardBlurBehavior: "restore",
	android_keyboardInputMode: "adjustResize",
} as const;

/**
 * Slop around `BottomSheet.Close`.
 *
 * The glyph is a bare icon in a corner with no padded capsule to absorb the
 * difference against the 44pt minimum — the case `Checkbox` mints slop for and
 * `Badge.CloseButton` does not need.
 */
export const BOTTOM_SHEET_CLOSE_HIT_SLOP = 8;

/**
 * The padding a pinned footer keeps whatever the keyboard is doing.
 *
 * A number rather than a `p-4`, and for `SCREEN_FOOTER_PADDING`'s reason: the
 * footer's bottom padding is an animated value — the safe-area band collapses
 * into it as the keyboard arrives — and a class cannot carry one. Its top
 * padding is written the same way so the two cannot drift.
 */
export const BOTTOM_SHEET_FOOTER_PADDING = 16;

/**
 * The gap between the last of the content and a pinned footer.
 *
 * Also a number, because the reserve it belongs to is computed at runtime from
 * the footer's measured height. Without it the last row of a list sits flush
 * against the footer's hairline, which reads as content clipped rather than
 * content ended.
 */
export const BOTTOM_SHEET_FOOTER_GAP = 16;

export const bottomSheetVariants = tv({
	slots: {
		/**
		 * The scrim. Carries the colour and nothing else — the fade is an animated
		 * opacity gorhom drives off the sheet's own position.
		 */
		overlay: "bg-overlay",
		/**
		 * The sheet's surface. `popover` rather than `card`: a sheet is a layer
		 * over the app, which is what that token already means, and it is the one
		 * surface token nothing else in the package had claimed.
		 *
		 * Only the top corners round. The bottom edge runs off the screen, and a
		 * radius there shows as two notches of the app behind it.
		 */
		background: "rounded-t-2xl bg-popover",
		handle: "items-center justify-center pt-3 pb-1",
		handleIndicator: "h-1 w-9 rounded-full bg-muted-foreground/40",
		content: "gap-4 px-screen-gutter pt-2",
		/** A scrollable body's content container. Same treatment as `content`. */
		scrollContent: "gap-4 px-screen-gutter pt-2",
		footer: "gap-3 px-screen-gutter pt-4",
		/**
		 * A pinned footer draws OVER the content, so unlike the inline one it has
		 * to bring a surface and a line of its own — otherwise the content scrolls
		 * straight through it and its buttons are legible only where they happen
		 * to overlap blank space. The same reason `Screen.Footer`'s backing lives
		 * inside its sticky view.
		 *
		 * It carries no vertical padding: that is an animated style, because the
		 * safe-area band inside it collapses as the keyboard arrives. See
		 * {@link BOTTOM_SHEET_FOOTER_PADDING}.
		 */
		stickyFooter: "gap-3 border-border border-t bg-popover px-screen-gutter",
		close: "absolute top-4 right-4 z-10",
		/**
		 * Clearance for `BottomSheet.Close`, and nothing else.
		 *
		 * The close control is absolutely positioned, so it is out of the flow and
		 * a long title runs straight under it. The gutter is reserved on every
		 * sheet rather than only where a close is written, for the reason `Badge`
		 * reserves its border on every variant: declaring it conditionally makes
		 * the title reflow the moment someone adds one.
		 *
		 * No type. That comes from the `Text` preset the part renders, the way
		 * `Field.Label` *is* a `Text.Label` — a `text-lg font-semibold` here would
		 * be a second definition of `Text.Header` that can drift from it.
		 */
		title: "pr-8",
	},
});

/**
 * There is no `description` or `scrollView` slot.
 *
 * Neither has any layout of its own — a description is a `Text.Paragraph` in a
 * gap column and a scroll view fills whatever it is given — and `tv` emits
 * `undefined` for a slot whose class string is empty, so a slot that says
 * nothing is a slot no test can assert against. Those two parts merge the
 * caller's `className` with `cn()` instead.
 */
export type BottomSheetVariantProps = VariantProps<typeof bottomSheetVariants>;

/** Where a `BottomSheet.Footer` among a container's children has to be rendered. */
export type BottomSheetFooterPlacement = "sticky" | "inline" | "none";

/** One child of a `BottomSheet.Container`, reduced to what the placement turns on. */
export type BottomSheetFooterFlag = {
	isFooter: boolean;
	isSticky: boolean;
};

/**
 * Whether a container's children hold a footer, and where it has to go.
 *
 * gorhom takes a footer as a `footerComponent` render prop rather than as a
 * child, so a sticky one has to be lifted out of the tree it was written in and
 * handed over; an inline one simply stays put. This is the decision, kept pure
 * so `bun test` reaches the whole matrix — the walk over `Children.toArray` that
 * produces the flags lives with its caller, the way `withIndicator` does in
 * `radio.tsx`.
 *
 * A single sticky footer anywhere in the children wins, because two footers is
 * not a state worth expressing and the pinned one is the one a caller meant.
 */
export function resolveFooterPlacement(flags: readonly BottomSheetFooterFlag[]): BottomSheetFooterPlacement {
	let hasFooter = false;

	for (const flag of flags) {
		if (!flag.isFooter) continue;
		if (flag.isSticky) return "sticky";
		hasFooter = true;
	}

	return hasFooter ? "inline" : "none";
}

/**
 * The safe-area band `BottomSheet.Content` and `BottomSheet.ScrollView` reserve.
 *
 * Exactly one thing in the sheet pays for the home indicator. A pinned footer is
 * the bottom-most thing there is, and its own box carries the band so its surface
 * reaches the bottom of the screen — gorhom then adds that whole measured height
 * to the content's reserve, so the content asking for the band as well would
 * count it twice and leave a gap the height of the indicator above the footer.
 * With no pinned footer the content IS the bottom-most thing and takes it.
 */
export function resolveSheetBottomInset({
	hasStickyFooter,
	bottom,
}: {
	hasStickyFooter: boolean;
	bottom: number;
}): number {
	return hasStickyFooter ? 0 : bottom;
}
