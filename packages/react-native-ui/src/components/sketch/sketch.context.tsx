import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { SharedValue } from "react-native-reanimated";
import type { HapticFeedback } from "../pressable";
import type { SketchItem, SketchShape, SketchTool } from "./sketch.paths";
import type { SketchCanvasSize, SketchCommit, SketchHandle } from "./sketch.types";
import type { SketchSwatch } from "./sketch.variants";

/**
 * What the canvas's pan reads at touch-down, on the UI thread.
 *
 * Written by the root's setters as they run and synced from the resolved values
 * after each render, so a stroke begun the instant after a tap has the new tool
 * or ink, and a controlled value the parent overrides is put back. `ink` is `""`
 * when the colour resolves to nothing; `size` is already clamped.
 */
export type SketchBrush = {
	tool: SharedValue<SketchTool>;
	shape: SharedValue<SketchShape>;
	ink: SharedValue<string>;
	size: SharedValue<number>;
};

export type SketchContextValue = {
	/** Every committed mark, oldest first. */
	items: readonly SketchItem[];
	tool: SketchTool;
	shape: SketchShape;
	/** The shapes the toolbar offers, in order. */
	shapes: readonly SketchShape[];
	/** The swatches, resolved against the active theme. Unresolvable colours are already gone. */
	swatches: readonly SketchSwatch[];
	/** The selected colour, as given — a token or a literal. */
	color: string;
	/** The selected colour as ink: a literal, or `undefined` if it resolves to nothing. */
	ink: string | undefined;
	/** Stroke width in points. */
	size: number;
	/** The tool, shape, ink and width as the canvas's pan reads them. */
	brush: SketchBrush;
	minSize: number;
	maxSize: number;
	isDisabled: boolean;
	/** Played on a tool or colour change and on each undo. `false` silences it. */
	haptic: false | HapticFeedback;
	setTool: (tool: SketchTool) => void;
	setShape: (shape: SketchShape) => void;
	setColor: (color: string) => void;
	setSize: (size: number) => void;
	/** Appends a finished stroke. Called from the canvas's pan, on the JS thread. */
	commit: (stroke: SketchCommit) => void;
	/** Written by the canvas's `onLayout`; what the export's viewBox is. */
	setCanvasSize: (size: SketchCanvasSize) => void;
	canvasSize: SketchCanvasSize;
	/** The same object a `ref` on the root receives. */
	handle: SketchHandle;
};

const SketchContext = createContext<SketchContextValue | null>(null);

/**
 * Supplies one sketch's state to its parts.
 *
 * Its own module, importing nothing but React and types, so a part can read it
 * without importing `./sketch` — which would close a cycle Metro serves half
 * initialised.
 */
export function SketchProvider({ value, children }: { value: SketchContextValue; children: ReactNode }): ReactElement {
	return <SketchContext value={value}>{children}</SketchContext>;
}
SketchProvider.displayName = "DelacourUI.Sketch.Provider";

/** The enclosing sketch's state, or null outside a `<Sketch>`. */
export function useSketchContext(): SketchContextValue | null {
	return use(SketchContext);
}

/**
 * The enclosing sketch's state, setters and handle.
 *
 * For a custom tool, a custom readout ("3 marks") or a Done button inside the
 * sketch that exports without a ref. Throws outside one — use
 * {@link useSketchContext} where the sketch is optional.
 */
export function useSketch(): SketchContextValue {
	const context = useSketchContext();
	if (!context) {
		throw new Error("useSketch must be called inside a <Sketch>.");
	}
	return context;
}

/**
 * The enclosing sketch's state, for a part that cannot work without one.
 *
 * Internal: not re-exported from `index.ts`. Its error names the part.
 */
export function useSketchPart(component: string): SketchContextValue {
	const context = useSketchContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Sketch>.`);
	}
	return context;
}
