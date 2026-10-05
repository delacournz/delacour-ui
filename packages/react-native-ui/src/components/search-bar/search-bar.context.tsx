import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { SearchBarSize } from "./search-bar.variants";

export type SearchBarContextValue = {
	/** The text in the field. */
	value: string;
	/** Whether the field holds focus. */
	isFocused: boolean;
	/** Whether the bar is disabled, its own prop or an enclosing `Field`'s. */
	isDisabled: boolean;
	/** Whether a query is running. */
	isLoading: boolean;
	/** Size of the field, which the Cancel action and the token chips step from. */
	size: SearchBarSize;
	/** Whether the Cancel action is on screen right now. */
	isCancelVisible: boolean;
	/** Text the default Cancel action shows. */
	cancelLabel: string;
	/** Name a screen reader gives the clear button. */
	clearAccessibilityLabel: string;
	/** The field's `testID`, which the bar's own controls suffix theirs from. */
	testID: string | undefined;
	/** Empties the text, reports it immediately and keeps focus and the keyboard. */
	clear: () => void;
	/** Empties the text, blurs the field and dismisses the keyboard. */
	cancel: () => void;
};

const SearchBarContext = createContext<SearchBarContextValue | null>(null);

/**
 * Supplies the bar's text, focus and actions to its parts.
 *
 * Lives in its own module, importing nothing but React and a type, so a part
 * can read it without importing `./search-bar` and closing a cycle back
 * through the root. See AGENTS.md rule 3.
 */
export function SearchBarProvider({
	value,
	children,
}: {
	value: SearchBarContextValue;
	children: ReactNode;
}): ReactElement {
	return <SearchBarContext value={value}>{children}</SearchBarContext>;
}
SearchBarProvider.displayName = "DelacourUI.SearchBar.Provider";

/** The enclosing bar's context, or null outside one. */
export function useSearchBarContext(): SearchBarContextValue | null {
	return use(SearchBarContext);
}

/**
 * Reads the enclosing `SearchBar`'s text, focus and actions.
 *
 * For a custom Cancel or any child that has to act on the bar it sits in.
 * Throws outside one — use {@link useSearchBarContext} where the bar is optional.
 */
export function useSearchBar(): SearchBarContextValue {
	const context = useSearchBarContext();
	if (!context) {
		throw new Error("useSearchBar must be called inside a <SearchBar>.");
	}
	return context;
}

/**
 * The enclosing bar's context, for a part that cannot work without one.
 *
 * Internal: deliberately not re-exported from `index.ts`. A caller outside the
 * library wants {@link useSearchBar}, whose error names the hook.
 */
export function useSearchBarPart(component: string): SearchBarContextValue {
	const context = useSearchBarContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <SearchBar>.`);
	}
	return context;
}
