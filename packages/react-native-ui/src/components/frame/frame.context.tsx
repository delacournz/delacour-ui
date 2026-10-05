import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { SurfacePlane } from "../surface/surface.variants";
import type { FrameSize, FrameVariant } from "./frame.variants";

export type FrameContextValue = {
	/** The shell treatment: `default`, `plain` or `inset`. */
	variant: FrameVariant;
	/** Row metrics for the tray and the title's step on the type scale. */
	size: FrameSize;
	/**
	 * The fill the header and footer sit on — the shell's own, or for a plain
	 * frame the plane beneath it, `null` on the page.
	 */
	plane: SurfacePlane | null;
};

const FrameContext = createContext<FrameContextValue | null>(null);

/**
 * Supplies the enclosing frame's variant, size and plane to its subtree.
 *
 * Lives in its own module, importing nothing but types, so a part the frame
 * renders can read it without importing `./frame` and closing a cycle through
 * `frame.tsx`. See AGENTS.md rule 3.
 */
export function FrameProvider({ value, children }: { value: FrameContextValue; children: ReactNode }): ReactElement {
	return <FrameContext value={value}>{children}</FrameContext>;
}
FrameProvider.displayName = "DelacourUI.Frame.Provider";

/** The enclosing frame's context, or null outside a `<Frame>`. */
export function useFrameContext(): FrameContextValue | null {
	return use(FrameContext);
}

/**
 * Reads the enclosing frame's variant, size and plane.
 *
 * Lets a custom part match the frame without the frame passing props down.
 * Throws outside a `<Frame>`; use {@link useFrameContext} where the enclosing
 * frame is optional.
 */
export function useFrame(): FrameContextValue {
	const context = useFrameContext();
	if (!context) {
		throw new Error("useFrame must be called inside a <Frame>.");
	}
	return context;
}

/**
 * The enclosing frame's context, for a compound part that cannot work without one.
 *
 * Internal: deliberately not re-exported from `index.ts`. A caller outside the
 * library wants {@link useFrame}, whose error message names the hook rather than
 * a part.
 */
export function useFramePart(component: string): FrameContextValue {
	const context = useFrameContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Frame>.`);
	}
	return context;
}

const FrameTrayDividedContext = createContext(true);

/**
 * Tells a `Frame.Section` whether the tray it sits in divides its rows, so a
 * section's own rows follow the tray's `isDivided` without restating it.
 * Internal: a section is the only reader.
 */
export function FrameTrayDividedProvider({ value, children }: { value: boolean; children: ReactNode }): ReactElement {
	return <FrameTrayDividedContext value={value}>{children}</FrameTrayDividedContext>;
}
FrameTrayDividedProvider.displayName = "DelacourUI.Frame.Tray.Provider";

/** Whether the enclosing tray divides its rows. True outside a tray. */
export function useFrameTrayDivided(): boolean {
	return use(FrameTrayDividedContext);
}
