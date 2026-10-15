import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { SharedValue } from "react-native-reanimated";
import type { HapticFeedback } from "../pressable/pressable";
import type { CompareColor, CompareOrientation, ComparePosition, CompareSide, CompareSize } from "./compare.variants";

export type CompareContextValue = {
	/**
	 * The seam's live position, 0–1, on the **UI thread**.
	 *
	 * What every transform reads. The root writes it from the pan; React state
	 * mirrors it only at the percent — see {@link CompareContextValue.current}.
	 */
	position: SharedValue<number>;
	/**
	 * The seam's position on the **JS thread**, as last committed.
	 *
	 * What the accessibility value and the covered-layer rule read. It agrees with
	 * {@link CompareContextValue.position} at rest and trails it by a mirror hop
	 * during a drag.
	 */
	current: ComparePosition;
	/** The frame's length along the axis, from its `onLayout`. `0` until it has been measured. */
	frameSize: SharedValue<number>;
	/** `1` while the handle is grabbed, `0` otherwise. Drives the capsule's scale. */
	grabbed: SharedValue<number>;
	orientation: CompareOrientation;
	/** Whether Before sits on the right — `I18nManager.isRTL`, read once by the root. */
	isRtl: boolean;
	color: CompareColor;
	/** The handle's size. */
	size: CompareSize;
	isDisabled: boolean;
	/** Whether decorative motion holds still — no spring, no grab scale. */
	isCalm: boolean;
	/** The assistive increment. */
	step: number;
	minPosition: ComparePosition;
	maxPosition: ComparePosition;
	/** The name the handle's adjustable announces, from the root or an enclosing `Field.Label`. */
	accessibilityLabel: string | undefined;
	/** The two sides' names, as their `Compare.Label`s registered them. */
	labels: { before?: string; after?: string };
	/** A `Compare.Label` offers its plain-string text here; `null` on unmount. */
	registerLabel: (side: CompareSide, text: string | null) => void;
	/** Steps the seam from the **JS thread** — the assistive path, with no gesture behind it. */
	stepBy: (direction: 1 | -1) => void;
	haptic: false | HapticFeedback;
};

const CompareContext = createContext<CompareContextValue | null>(null);

/**
 * Supplies one comparison's state to its parts.
 *
 * Lives in its own module, importing nothing but React and types, so a part can
 * read it without importing `./compare` and closing a cycle (AGENTS.md rule 3).
 */
export function CompareProvider({
	value,
	children,
}: {
	value: CompareContextValue;
	children: ReactNode;
}): ReactElement {
	return <CompareContext value={value}>{children}</CompareContext>;
}
CompareProvider.displayName = "DelacourUI.Compare.Provider";

/** The enclosing comparison's state, or null outside a `<Compare>`. */
export function useCompareContext(): CompareContextValue | null {
	return use(CompareContext);
}

/**
 * Reads the enclosing comparison's state — for a custom handle or overlay that
 * has to follow the seam. Throws outside one.
 */
export function useCompare(): CompareContextValue {
	const context = useCompareContext();
	if (!context) {
		throw new Error("useCompare must be called inside a <Compare>.");
	}
	return context;
}

/**
 * The enclosing comparison's state, for a part that cannot work without one.
 *
 * Internal: not re-exported from `index.ts`.
 */
export function useComparePart(component: string): CompareContextValue {
	const context = useCompareContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Compare>.`);
	}
	return context;
}
