import {
	Easing,
	type EasingFunction,
	ReduceMotion,
	type WithSpringConfig,
	type WithTimingConfig,
} from "react-native-reanimated";
import type { EasingName, ReduceMotionMode, ResolvedAnimation } from "../core";

/**
 * A core easing name to Reanimated's function. The core keeps its defaults as
 * data so `bun test` can read them; this is the one place the name becomes a
 * function, and it happens on the JS thread before any worklet runs.
 */
export function easingFor(name: EasingName): EasingFunction {
	switch (name) {
		case "linear":
			return Easing.linear;
		case "outCubic":
			return Easing.out(Easing.cubic);
		case "inOutCubic":
			return Easing.inOut(Easing.cubic);
		default:
			return Easing.out(Easing.exp);
	}
}

export function reduceMotionFor(mode: ReduceMotionMode): ReduceMotion {
	switch (mode) {
		case "always":
			return ReduceMotion.Always;
		case "never":
			return ReduceMotion.Never;
		default:
			return ReduceMotion.System;
	}
}

/** A resolved animation as the Reanimated config `withSpring` / `withTiming` takes. */
export type ReanimatedAnimation =
	| { type: "spring"; config: WithSpringConfig }
	| { type: "timing"; config: WithTimingConfig };

/**
 * Turns the core's plain-data resolution into a Reanimated config, once, on
 * the JS thread.
 *
 * Reanimated 4 replaced `restDisplacementThreshold` / `restSpeedThreshold`
 * with a single relative `energyThreshold`, so the two rest thresholds the
 * core carries — the previous engine's defaults, kept as data for a future runtime that
 * reads them — are not forwarded. With `overshootClamping` and a stiff spring
 * the default energy threshold settles within a frame or two of them anyway.
 */
export function toReanimated(resolved: ResolvedAnimation): ReanimatedAnimation {
	if (resolved.type === "spring") {
		return {
			type: "spring",
			config: {
				damping: resolved.damping,
				stiffness: resolved.stiffness,
				mass: resolved.mass,
				overshootClamping: resolved.overshootClamping,
				reduceMotion: reduceMotionFor(resolved.reduceMotion),
			},
		};
	}
	return {
		type: "timing",
		config: {
			duration: resolved.duration,
			easing: easingFor(resolved.easing),
			reduceMotion: reduceMotionFor(resolved.reduceMotion),
		},
	};
}
