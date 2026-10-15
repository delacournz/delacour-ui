import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { SharedValue } from "react-native-reanimated";
import type { MarqueePause } from "./marquee.variants";

export type MarqueeGroupContextValue = {
	/** The speed every strip inside takes unless it names its own, in points per second. */
	speed: number | undefined;
	/** The one pause every strip inside follows. Unset, each strip keeps its own. */
	pause: MarqueePause | undefined;
	/** Whether a finger is down on any strip in the group — written by every strip, read by all of them. */
	isPressed: SharedValue<boolean>;
};

const MarqueeGroupContext = createContext<MarqueeGroupContextValue | null>(null);

/**
 * Supplies a `Marquee.Group`'s speed and pause to every strip inside it.
 *
 * Lives in its own module, importing nothing but React and types, so the root
 * and the group can both read it without importing each other. See AGENTS.md
 * rule 3.
 */
export function MarqueeGroupProvider({
	value,
	children,
}: {
	value: MarqueeGroupContextValue;
	children: ReactNode;
}): ReactElement {
	return <MarqueeGroupContext value={value}>{children}</MarqueeGroupContext>;
}
MarqueeGroupProvider.displayName = "DelacourUI.Marquee.Group.Provider";

/**
 * The enclosing `Marquee.Group`, or null outside one.
 *
 * Optional by design: a strip is complete on its own, and a group only keeps
 * the strips it holds in step.
 */
export function useMarqueeGroup(): MarqueeGroupContextValue | null {
	return use(MarqueeGroupContext);
}
