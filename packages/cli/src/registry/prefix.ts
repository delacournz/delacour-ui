/**
 * The name a project gives the library, in place of `DelacourUI`.
 *
 * The library brands two things a consumer sees at runtime: every
 * `displayName` (`DelacourUI.Flow.Provider`, what React DevTools and a
 * warning print) and the tag on a thrown message (`[DelacourUI] …`). A copy is
 * the consumer's code, so `native-components.json`'s `prefix` swaps both —
 * `"UI"` gives `UI.Flow.Provider` — and renames the root provider to
 * `<prefix>Provider` to match.
 *
 * A string substitution, for the same reason `transform.ts` is one: the source
 * is ours, and both names are whole words that occur nowhere else.
 */

export const LIBRARY_PREFIX = "DelacourUI";
export const LIBRARY_PROVIDER = "DelacourProvider";

/** A prefix becomes the head of every display name and the start of an identifier. */
export const PREFIX_PATTERN = /^[A-Z][A-Za-z0-9]*$/;

const DISPLAY_NAME = new RegExp(`\\b${LIBRARY_PREFIX}\\b`, "g");

/** The provider and its props type — `DelacourProviderProps` is the one longer word it owns. */
const PROVIDER = new RegExp(`\\b${LIBRARY_PROVIDER}(Props)?\\b`, "g");

/** What the root provider is called in a project with this prefix. */
export function providerName(prefix: string | undefined): string {
	return prefix && prefix !== LIBRARY_PREFIX ? `${prefix}Provider` : LIBRARY_PROVIDER;
}

export function applyPrefix(content: string, prefix: string | undefined): string {
	if (!prefix || prefix === LIBRARY_PREFIX) return content;

	const provider = providerName(prefix);
	return content
		.replace(PROVIDER, (_match, props: string | undefined) => `${provider}${props ?? ""}`)
		.replace(DISPLAY_NAME, prefix);
}
