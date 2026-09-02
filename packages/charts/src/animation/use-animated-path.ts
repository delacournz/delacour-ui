import { type SkPath, usePathInterpolation } from "@shopify/react-native-skia";
import { useEffect, useRef, useState } from "react";
import { type SharedValue, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { type ChartAnimation, DEFAULT_CHART_ANIMATION } from "./animation.types";

export type AnimatedPathOptions = {
	/**
	 * The path the very first animation starts from. Read on mount only.
	 *
	 * Without it a mark appears fully drawn, because there is no earlier path
	 * to morph from. A pie slice hands over the same slice at radius zero and
	 * scales out of the centre; a bar could hand over itself at the baseline.
	 * It must share the target's verb sequence, or the mount snaps like any
	 * other non-interpolatable change.
	 */
	readonly enterFrom?: SkPath;
};

/**
 * A path that morphs to `path` whenever it changes.
 *
 * Interpolation is Skia's own `usePathInterpolation` — one native
 * `Path.Interpolate` per frame, with no path allocated on the JS side. The
 * alternative, building a path inside a `useDerivedValue`, is the shape behind
 * a long-standing crash with Skia host objects in shared values.
 *
 * It never has to fall back to snapping, because point counts are matched in
 * data space before either path is built — see `core/animation`. The
 * development-only warning below exists to say so: if it ever fires, the morph
 * strategy has a bug, and silently snapping is how that bug would survive a
 * release.
 */
export function useAnimatedPath(
	path: SkPath,
	animation: ChartAnimation = DEFAULT_CHART_ANIMATION,
	options?: AnimatedPathOptions
): SharedValue<SkPath> {
	// `enterFrom` is consulted by the initialisers alone, so a later change to
	// it does nothing: the entrance has already happened. Seeding the range and
	// the progress with it, rather than only the ref, is what stops the first
	// frame showing the finished path before the effect below starts the morph.
	const entrance = options?.enterFrom ?? path;
	const progress = useSharedValue(entrance === path ? 1 : 0);
	const previous = useRef<SkPath>(entrance);
	const config = useRef<ChartAnimation>(animation);
	config.current = animation;

	const [range, setRange] = useState<SkPath[]>(() => [entrance, path]);

	useEffect(() => {
		const from = previous.current;
		previous.current = path;

		const current = config.current;
		if (current.type === "none" || !from.isInterpolatable(path)) {
			if (__DEV__ && current.type !== "none" && !from.isInterpolatable(path)) {
				console.warn(
					"[@delacour/charts] two paths were not interpolatable, so the change snapped. " +
						"Point counts are supposed to be matched in data space before the paths are built — " +
						"this means chooseMorphStrategy or matchPointCounts got it wrong."
				);
			}
			setRange([path, path]);
			progress.value = 1;
			return;
		}

		setRange([from, path]);
		progress.value = 0;
		progress.value = current.type === "spring" ? withSpring(1, current) : withTiming(1, current);
	}, [path, progress]);

	return usePathInterpolation(progress, [0, 1], range);
}
