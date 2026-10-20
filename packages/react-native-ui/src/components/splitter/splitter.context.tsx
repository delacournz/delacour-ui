import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { SharedValue } from "react-native-reanimated";
import type { HapticFeedback } from "../pressable";
import type {
	SplitterLayout,
	SplitterOrientation,
	SplitterPaneConstraints,
	SplitterVariant,
} from "./splitter.variants";

/** What `useSplitter()` hands a custom child: the settled state and the three ways to change it. */
export type SplitterContextValue = {
	orientation: SplitterOrientation;
	variant: SplitterVariant;
	isDisabled: boolean;
	/** One entry per pane, settled — on the JS thread, never the live drag. */
	layout: SplitterLayout;
	/** Sets a whole layout programmatically, fitted to every pane's bounds like a drag. */
	setLayout: (next: SplitterLayout) => void;
	/** Collapses or restores pane `index`. Does nothing for a pane that is not collapsible. */
	togglePane: (index: number) => void;
	/** Back to the layout the splitter started from. */
	reset: () => void;
};

/**
 * What the parts read on top of the public state. Internal: never re-exported
 * from `index.ts`, so the live shared values stay out of the public surface.
 */
export type SplitterPartContextValue = SplitterContextValue & {
	/**
	 * Every pane's live size, on the **UI thread**.
	 *
	 * One shared value for the whole array, because a pane count is data and hooks
	 * cannot be called in a loop. Reassign it — never write an element in place:
	 * an array element has no setter behind it, and the write is silently lost.
	 */
	sizes: SharedValue<number[]>;
	/** The box's length along the axis, in points, from its `onLayout`. `0` until measured. */
	extent: SharedValue<number>;
	/** Each pane's limits, read off its props in render. */
	constraints: readonly SplitterPaneConstraints[];
	/** Points between two panes — `0` for `seam`. */
	gap: number;
	/** Percent. What an assistive increment moves by and what a release rounds to. */
	step: number;
	haptic: false | HapticFeedback;
	/** Stops a settle in flight, from a worklet, so a drag starts from where the panes really are. */
	interrupt: () => void;
	/** Animates `sizes` to `next` from a worklet — or jumps there under Reduce Motion. */
	settle: (next: SplitterLayout) => void;
	/** Reports the layout a drag settled on. Called once per release, never per frame. */
	commitDrag: (next: SplitterLayout) => void;
	/** Settles on `next` and reports it — the path an assistive action takes. */
	apply: (next: SplitterLayout) => void;
};

const SplitterContext = createContext<SplitterPartContextValue | null>(null);
const SplitterIndexContext = createContext<number>(-1);

/**
 * Supplies one splitter's state to its own parts.
 *
 * Lives in its own module, importing nothing but React and types, so a part can
 * read it without importing `./splitter` — which would close a cycle, and Metro
 * serves a partially initialised module for one.
 */
export function SplitterProvider({
	value,
	children,
}: {
	value: SplitterPartContextValue;
	children: ReactNode;
}): ReactElement {
	return <SplitterContext value={value}>{children}</SplitterContext>;
}
SplitterProvider.displayName = "DelacourUI.Splitter.Provider";

/**
 * Tells one child of the root which pane it is, or which seam.
 *
 * A pane reads its own index; a handle reads the index of the pane **before**
 * it, so handle `i` is the seam between pane `i` and pane `i + 1`. The root
 * wraps every child in one, which is why a pane never has to be told its
 * position by the caller.
 */
export function SplitterIndexProvider({ value, children }: { value: number; children: ReactNode }): ReactElement {
	return <SplitterIndexContext value={value}>{children}</SplitterIndexContext>;
}
SplitterIndexProvider.displayName = "DelacourUI.Splitter.IndexProvider";

/** The enclosing splitter's state, or null outside a `<Splitter>`. */
export function useSplitterContext(): SplitterContextValue | null {
	return use(SplitterContext);
}

/**
 * Reads the enclosing splitter's settled layout, and the setters that change it.
 *
 * For a button that collapses the sidebar, a readout of the sizes, a reset in a
 * menu. Throws outside a `<Splitter>`.
 */
export function useSplitter(): SplitterContextValue {
	const context = use(SplitterContext);
	if (!context) {
		throw new Error("useSplitter must be called inside a <Splitter>.");
	}
	return context;
}

/** Internal: the live state, for a part that cannot work without its root. */
export function useSplitterPart(component: string): SplitterPartContextValue {
	const context = use(SplitterContext);
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Splitter>.`);
	}
	return context;
}

/** Internal: which pane, or which seam, the calling part is. */
export function useSplitterIndex(): number {
	return use(SplitterIndexContext);
}
