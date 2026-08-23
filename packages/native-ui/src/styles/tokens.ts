/**
 * Names of the semantic size tokens defined in `tokens.css`.
 *
 * These exist so `cn()` can teach tailwind-merge about them. Without that,
 * `h-button-md` is an unrecognised utility and twMerge will not drop it when a
 * caller passes `h-12` — both survive and the override silently stops working.
 * {@link ../lib/cn} registers every name here, and a test asserts this list
 * still matches `tokens.css`.
 *
 * Values live in the CSS, not here. A component references a token by writing
 * the class out in full (`size-icon-md`) — Tailwind scans source text, so a
 * name assembled at runtime would never be compiled.
 */

/** Suffixes in the `--spacing-*` namespace: `h-button-md`, `w-button-md`. */
export const BUTTON_SIZE_TOKENS = ["button-sm", "button-md", "button-lg"] as const;

/** Suffixes in the `--spacing-*` namespace: `size-icon-md`. */
export const ICON_SIZE_TOKENS = ["icon-xs", "icon-sm", "icon-md", "icon-lg", "icon-xl", "icon-2xl"] as const;

/**
 * Suffixes in the `--spacing-*` namespace: `h-navbar-row`, `px-screen-gutter`.
 *
 * Not a scale — two independent measurements of a screen's chrome — so unlike
 * the icon and button tokens their order carries no meaning.
 */
export const SCREEN_SIZE_TOKENS = ["navbar-row", "screen-gutter"] as const;

/** Suffixes in the `--text-*` namespace: `text-button-md`. */
export const BUTTON_TEXT_TOKENS = ["button-sm", "button-md", "button-lg"] as const;

/**
 * The tailwind-merge extension both mergers in this package are built from.
 *
 * There are two, and they are easy to forget: `cn()` merges a caller's
 * className, and `tv()` merges slots and variants using a tailwind-merge
 * instance of its own. Extending only one leaves the other treating
 * `text-button-md` as an unrecognised utility — which is how a size token ends
 * up colliding with a colour and silently dropping it. One config, read by
 * `lib/cn.ts` and `lib/tv.ts`, so they cannot drift apart.
 */
export const TW_MERGE_CONFIG = {
	extend: {
		theme: {
			spacing: [...BUTTON_SIZE_TOKENS, ...ICON_SIZE_TOKENS, ...SCREEN_SIZE_TOKENS],
			text: [...BUTTON_TEXT_TOKENS],
		},
	},
} as const;
