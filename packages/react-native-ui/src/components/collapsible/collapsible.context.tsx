import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { SharedValue } from "react-native-reanimated";
import type { CollapsibleSize, CollapsibleVariant } from "./collapsible.variants";

export type CollapsibleContextValue = {
	variant: CollapsibleVariant;
	size: CollapsibleSize;
	/** The trigger is inert and the surface faded. An open section stays open. */
	isDisabled: boolean;
	/** Whether the panel is open, on the **JS thread** — what accessibility reads. */
	isOpen: boolean;
	/** Opens or closes the panel. Refused while disabled. Stable for the collapsible's lifetime. */
	toggle: () => void;
	/**
	 * How far open the panel is, on the **UI thread**: `0` closed, `1` open.
	 *
	 * The one value every animated style reads — the panel's height, its opacity
	 * and the indicator's rotation — so they cannot drift out of step by a frame.
	 */
	progress: SharedValue<number>;
	/** The panel's natural height in points, or {@link COLLAPSIBLE_UNMEASURED} until it has reported. */
	contentHeight: SharedValue<number>;
	/**
	 * Told by the panel that it has measured itself for the first time.
	 *
	 * Internal machinery: the root is the only owner of the spring, and this gives
	 * its effect a reason to re-run once there is a height to travel against. The
	 * panel cannot start the spring itself — `onLayout` lands either side of
	 * React's effects, and a spring started there is sometimes cancelled by the
	 * cleanup of the effect it raced. `Accordion.Item`'s `onMeasured`, verbatim.
	 */
	onMeasured: () => void;
};

const CollapsibleContext = createContext<CollapsibleContextValue | null>(null);

/**
 * Supplies one collapsible's axes, state and shared values to its parts.
 *
 * Lives in its own module, importing nothing but React and types, so a part can
 * read it without importing `./collapsible` — which would close a cycle.
 */
export function CollapsibleProvider({
	value,
	children,
}: {
	value: CollapsibleContextValue;
	children: ReactNode;
}): ReactElement {
	return <CollapsibleContext value={value}>{children}</CollapsibleContext>;
}
CollapsibleProvider.displayName = "DelacourUI.Collapsible.Provider";

/** The enclosing collapsible's state, or null outside a `<Collapsible>`. */
export function useCollapsibleContext(): CollapsibleContextValue | null {
	return use(CollapsibleContext);
}

/**
 * Reads the enclosing collapsible's state.
 *
 * What a custom child reaches for: `isOpen` to swap a glyph or a label,
 * `progress` to animate against exactly the travel the panel is running, or
 * `toggle` to open it from somewhere other than the trigger. Throws outside a
 * `<Collapsible>` — use {@link useCollapsibleContext} where one is optional.
 */
export function useCollapsible(): CollapsibleContextValue {
	const context = useCollapsibleContext();
	if (!context) {
		throw new Error("useCollapsible must be called inside a <Collapsible>.");
	}
	return context;
}

/**
 * The enclosing collapsible's state, for a compound part that cannot work without one.
 *
 * Internal: deliberately not re-exported from `index.ts`.
 */
export function useCollapsiblePart(component: string): CollapsibleContextValue {
	const context = useCollapsibleContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Collapsible>.`);
	}
	return context;
}
