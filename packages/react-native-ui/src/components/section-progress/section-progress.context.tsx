import { type ComponentRef, createContext, type ReactElement, type ReactNode, type RefObject, use } from "react";
import type Animated from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import type { SectionProgressColor, SectionProgressPlacement } from "./section-progress.variants";

export type SectionProgressContextValue = {
	/** The active section, or null before any is. */
	value: string | null;
	/** What an item calls on press: emits the section and closes the panel. */
	select: (value: string) => void;
	/** Whether the panel is open. */
	isOpen: boolean;
	/** Opens or closes the panel. */
	setOpen: (isOpen: boolean) => void;
	placement: SectionProgressPlacement;
	/** The pill's label — the active section's title. */
	label: string;
	/** The ring's colour — the active section's. */
	color: SectionProgressColor;
	/** The ring's fill, 0–1, read on the UI thread. */
	progress: SharedValue<number>;
	/** The pill's accessible name. */
	accessibilityLabel: string;
	/** "Pricing, 42 percent". */
	accessibilityValue: string;
	/** The active item's view, so opening the panel can move screen-reader focus to it. */
	activeItemRef: RefObject<ComponentRef<typeof Animated.View> | null>;
};

const SectionProgressContext = createContext<SectionProgressContextValue | null>(null);

/**
 * Supplies the pill's state to the ring, the label, the panel and the items.
 *
 * Its own module, importing nothing but React and types, so a part can read it
 * without importing `./section-progress` — which would close a cycle. See
 * AGENTS.md rule 3.
 */
export function SectionProgressProvider({
	value,
	children,
}: {
	value: SectionProgressContextValue;
	children: ReactNode;
}): ReactElement {
	return <SectionProgressContext value={value}>{children}</SectionProgressContext>;
}
SectionProgressProvider.displayName = "DelacourUI.SectionProgress.Provider";

/** The enclosing pill's context, or null outside a `<SectionProgress>`. */
export function useSectionProgressContext(): SectionProgressContextValue | null {
	return use(SectionProgressContext);
}

/**
 * Reads the enclosing pill's state — the active section, whether the panel is
 * open, the ring's progress. For a custom item or a control beside it. Throws
 * outside one.
 */
export function useSectionProgress(): SectionProgressContextValue {
	const context = useSectionProgressContext();
	if (!context) {
		throw new Error("useSectionProgress must be called inside a <SectionProgress>.");
	}
	return context;
}

/** The enclosing pill, for a part that cannot work without one. Internal. */
export function useSectionProgressPart(component: string): SectionProgressContextValue {
	const context = useSectionProgressContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <SectionProgress>.`);
	}
	return context;
}
