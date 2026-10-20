import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { LayoutChangeEvent } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import type { HapticFeedback } from "../pressable/pressable";
import type {
	SectionRailAlign,
	SectionRailBarLayout,
	SectionRailPlacement,
	SectionRailPlacementStyle,
} from "./section-rail.variants";

export type SectionRailContextValue = {
	/** The committed section — the one the reader is in. */
	value: string | undefined;
	/** The section drawn as active: the one under a scrubbing finger, else `value`. */
	activeValue: string | undefined;
	isOpen: boolean;
	setOpen: (isOpen: boolean) => void;
	/** Commits a section from a row tap or a scrub's release, then closes after `closeDelay`. */
	pick: (value: string) => void;
	/** Draws a section as active while a finger scrubs over it. `undefined` hands back to `value`. */
	highlight: (value: string | undefined) => void;
	/** Moves to the next or previous section, for an assistive increment or decrement. */
	step: (direction: 1 | -1) => void;
	placement: SectionRailPlacement;
	align: SectionRailAlign;
	/** The padding and alignment of the full-screen frame the trigger and the panel sit in. */
	frameStyle: SectionRailPlacementStyle;
	/** Ticked once per section crossed while scrubbing. */
	haptic: false | HapticFeedback;
	/** The bars in rail order, mirrored onto the UI thread for the scrub. */
	bars: SharedValue<SectionRailBarLayout[]>;
	/** Mounts a bar; returns its unmount. */
	mountBar: (value: string) => () => void;
	/** `onLayout` for a bar. Stable per value. */
	layoutBar: (value: string) => (event: LayoutChangeEvent) => void;
	/** Records a row's title, which the trigger speaks as its value; returns its removal. */
	registerItem: (value: string, label: string) => () => void;
	/** Each section's title, by value. */
	labels: Readonly<Record<string, string>>;
};

const SectionRailContext = createContext<SectionRailContextValue | null>(null);

/**
 * Supplies the rail's state to its trigger, bars, panel and rows.
 *
 * Its own module, importing nothing but React and types, so a part can read it
 * without importing `./section-rail` and closing a cycle. See AGENTS.md rule 3.
 */
export function SectionRailProvider({
	value,
	children,
}: {
	value: SectionRailContextValue;
	children: ReactNode;
}): ReactElement {
	return <SectionRailContext value={value}>{children}</SectionRailContext>;
}
SectionRailProvider.displayName = "DelacourUI.SectionRail.Provider";

/** The enclosing rail's context, or null outside a `<SectionRail>`. */
export function useSectionRailContext(): SectionRailContextValue | null {
	return use(SectionRailContext);
}

/**
 * Reads the enclosing rail's value, open state and placement — for a custom row
 * or a caption that follows the rail. Throws outside one.
 */
export function useSectionRail(): SectionRailContextValue {
	const context = useSectionRailContext();
	if (!context) {
		throw new Error("useSectionRail must be called inside a <SectionRail>.");
	}
	return context;
}

/** The enclosing rail, for a part that cannot work without one. Internal. */
export function useSectionRailPart(component: string): SectionRailContextValue {
	const context = useSectionRailContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <SectionRail>.`);
	}
	return context;
}
