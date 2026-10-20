import { type BlurTint, BlurView } from "expo-blur";
import type { ReactElement } from "react";
import { Platform } from "react-native";
import type { BlurLayerProps, BlurMaterial } from "../components/scroll-blur/scroll-blur.types";

/** The `expo-blur` tint each engine-agnostic material maps onto. */
const TINTS: Record<BlurMaterial, BlurTint> = {
	default: "default",
	light: "light",
	dark: "dark",
	chrome: "systemChromeMaterial",
	thick: "systemThickMaterial",
};

/**
 * `expo-blur`'s `BlurView` as a `ScrollBlur` engine — the only file in the
 * package that imports `expo-blur`, which is an optional peer: an app that
 * never imports this subpath never resolves it.
 *
 * Mount it once at the root:
 *
 * ```tsx
 * <ScrollBlurLayerProvider layer={ExpoBlurLayer}>{app}</ScrollBlurLayerProvider>
 * ```
 *
 * **It draws nothing on Android.** `expo-blur`'s Android path blurs only a
 * registered `BlurTargetView`, not whatever happens to sit behind it, so a
 * strip over a list would blur nothing and cost a view. Rendering `null` there
 * leaves the band's wash alone — the gradient fallback — until that path is
 * verified.
 *
 * `BlurView` takes `style`, `intensity` and `tint` and nothing it needs a
 * className for, so it is not wrapped with `withUniwind`.
 */
export function ExpoBlurLayer({ intensity, material, style }: BlurLayerProps): ReactElement | null {
	if (Platform.OS === "android") return null;

	return <BlurView intensity={intensity} style={style} tint={TINTS[material]} />;
}
ExpoBlurLayer.displayName = "DelacourUI.ExpoBlurLayer";
