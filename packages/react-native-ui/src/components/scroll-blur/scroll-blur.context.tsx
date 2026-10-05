import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { BlurLayerComponent } from "./scroll-blur.types";

const BlurLayerContext = createContext<BlurLayerComponent | null>(null);

export type ScrollBlurLayerProviderProps = {
	/**
	 * The engine every `ScrollBlur` beneath draws its strips with. `null` turns
	 * the blur off for a subtree — every band beneath draws the gradient wash.
	 */
	layer: BlurLayerComponent | null;
	children: ReactNode;
};

/**
 * Hands a blur engine to every `ScrollBlur` beneath it, so the app names the
 * engine once, at its root, and no call site repeats it.
 *
 * The engine is injected rather than imported because it is an optional native
 * peer: an app that never mounts this, and never passes `layer`, never resolves
 * `expo-blur` at all, and gets the gradient wash instead.
 */
export function ScrollBlurLayerProvider({ layer, children }: ScrollBlurLayerProviderProps): ReactElement {
	return <BlurLayerContext value={layer}>{children}</BlurLayerContext>;
}
ScrollBlurLayerProvider.displayName = "DelacourUI.ScrollBlur.LayerProvider";

/** The nearest provider's blur engine, or null when none is mounted. */
export function useBlurLayer(): BlurLayerComponent | null {
	return use(BlurLayerContext);
}
