import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { SharedValue } from "react-native-reanimated";
import type { AccordionSize, AccordionVariant } from "./accordion.variants";

export type AccordionContextValue = {
	variant: AccordionVariant;
	size: AccordionSize;
	/** Every item is inert. An item's own `isDisabled` still overrides it, either way. */
	isDisabled: boolean;
	/** Which items are open, on the **JS thread**. */
	expanded: readonly string[];
	/** Opens or closes one item. Stable for the accordion's lifetime. */
	toggle: (value: string) => void;
};

export type AccordionItemContextValue = {
	/** What this item is called in the accordion's expanded set. */
	value: string;
	isDisabled: boolean;
	/** Whether this item is open, on the **JS thread** — what accessibility reads. */
	isExpanded: boolean;
	/**
	 * How far open this item is, on the **UI thread**: `0` closed, `1` open.
	 *
	 * The one value every animated style on this item reads — the panel's height,
	 * the panel's opacity and the indicator's rotation. One source rather than
	 * three, so they cannot drift out of step by a frame.
	 *
	 * It agrees with {@link AccordionItemContextValue.isExpanded} at rest and
	 * disagrees for the whole of a spring, which is what keeps the animation off
	 * the JS thread entirely.
	 */
	progress: SharedValue<number>;
	/**
	 * The panel's natural height in points, from its own `onLayout`.
	 *
	 * Holds {@link ACCORDION_UNMEASURED} until a panel has reported, which is not
	 * the same as a panel that measured zero. Read on the UI runtime only — by the
	 * height style — and written from the panel's `onLayout`; nothing on the JS
	 * thread reads it, because a JS read can lag a JS write. See {@link onMeasured}.
	 */
	contentHeight: SharedValue<number>;
	/**
	 * Told by the panel that it has measured itself for the first time.
	 *
	 * Internal machinery, and the reason the item is the **only** owner of the
	 * spring. The panel cannot start the travel itself: `onLayout` is dispatched
	 * from the native side and can land either side of React's effects, so a panel
	 * that started its own spring would sometimes have it cancelled a moment later
	 * by the cleanup of the effect it raced. This flips the item's own
	 * `isMeasured` state instead, which is what re-runs the item's effect.
	 *
	 * That state, not a JS-thread read of {@link contentHeight}, is how the item
	 * knows a panel has measured. The panel's write is queued onto the UI runtime
	 * and a read straight after it can still see `ACCORDION_UNMEASURED` — a Release
	 * build does, every time, and the panel stayed shut. See
	 * `accordionTravelTarget`.
	 */
	onMeasured: () => void;
};

const AccordionContext = createContext<AccordionContextValue | null>(null);
const AccordionItemContext = createContext<AccordionItemContextValue | null>(null);

/**
 * Supplies one accordion's axes and its selection to every item beneath it.
 *
 * Lives in its own module, importing nothing but React and types, so a part can
 * read it without importing `./accordion`. That import would close a cycle, and
 * Metro serves a partially initialised module for a cycle — leaving the context
 * `undefined` at import time and red-boxing the app on a cold start.
 */
export function AccordionProvider({
	value,
	children,
}: {
	value: AccordionContextValue;
	children: ReactNode;
}): ReactElement {
	return <AccordionContext value={value}>{children}</AccordionContext>;
}
AccordionProvider.displayName = "DelacourUI.Accordion.Provider";

/** Supplies one item's own state and shared values to its trigger, indicator and panel. */
export function AccordionItemProvider({
	value,
	children,
}: {
	value: AccordionItemContextValue;
	children: ReactNode;
}): ReactElement {
	return <AccordionItemContext value={value}>{children}</AccordionItemContext>;
}
AccordionItemProvider.displayName = "DelacourUI.Accordion.ItemProvider";

/** The enclosing accordion's state, or null outside an `<Accordion>`. */
export function useAccordionContext(): AccordionContextValue | null {
	return use(AccordionContext);
}

/**
 * Reads the enclosing accordion's axes and selection.
 *
 * Lets a custom child style itself to match, or drive the selection, without the
 * accordion having to pass props down through every item. Throws outside an
 * `<Accordion>` — use {@link useAccordionContext} where the enclosing accordion is
 * optional.
 */
export function useAccordion(): AccordionContextValue {
	const context = useAccordionContext();
	if (!context) {
		throw new Error("useAccordion must be called inside an <Accordion>.");
	}
	return context;
}

/** The enclosing item's state, or null outside an `<Accordion.Item>`. */
export function useAccordionItemContext(): AccordionItemContextValue | null {
	return use(AccordionItemContext);
}

/**
 * Reads the enclosing item's state.
 *
 * This is what a custom indicator reaches for: `isExpanded` to swap a glyph, or
 * `progress` to animate against exactly the travel the panel is running. Throws
 * outside an `<Accordion.Item>`.
 */
export function useAccordionItem(): AccordionItemContextValue {
	const context = useAccordionItemContext();
	if (!context) {
		throw new Error("useAccordionItem must be called inside an <Accordion.Item>.");
	}
	return context;
}

/**
 * The enclosing accordion's state, for a compound part that cannot work without one.
 *
 * Internal: deliberately not re-exported from `index.ts`. A caller outside the
 * library wants {@link useAccordion}, whose error message names the hook rather
 * than a part.
 */
export function useAccordionPart(component: string): AccordionContextValue {
	const context = useAccordionContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside an <Accordion>.`);
	}
	return context;
}

/** The enclosing item's state, for a compound part that cannot work without one. */
export function useAccordionItemPart(component: string): AccordionItemContextValue {
	const context = useAccordionItemContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside an <Accordion.Item>.`);
	}
	return context;
}
