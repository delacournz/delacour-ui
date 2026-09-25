/**
 * An easing by name. `src/animation` maps each to a Reanimated `Easing`; the
 * core never imports one, so the defaults stay plain data and testable.
 */
export type EasingName = "linear" | "outExp" | "outCubic" | "inOutCubic";

/** Reanimated's `ReduceMotion`, by name for the same reason. */
export type ReduceMotionMode = "system" | "always" | "never";

/** `Platform.OS`, widened so the core does not import it. */
export type PlatformName = "ios" | "android" | "web" | "windows" | "macos" | (string & {});

/** The `animation` prop: a spring or a timing, every field optional. */
export type SheetAnimationConfig =
	| {
			type: "spring";
			damping?: number;
			stiffness?: number;
			mass?: number;
			overshootClamping?: boolean;
			restDisplacementThreshold?: number;
			restSpeedThreshold?: number;
			reduceMotion?: ReduceMotionMode;
	  }
	| {
			type: "timing";
			duration?: number;
			easing?: EasingName;
			reduceMotion?: ReduceMotionMode;
	  };

/** A config with every field filled, ready for `withSpring` / `withTiming`. */
export type ResolvedAnimation =
	| {
			type: "spring";
			damping: number;
			stiffness: number;
			mass: number;
			overshootClamping: boolean;
			restDisplacementThreshold: number;
			restSpeedThreshold: number;
			reduceMotion: ReduceMotionMode;
	  }
	| {
			type: "timing";
			duration: number;
			easing: EasingName;
			reduceMotion: ReduceMotionMode;
	  };

/** The iOS default — a stiff, over-damped spring that settles in about a frame's worth of frames. */
export const IOS_SPRING = {
	type: "spring",
	damping: 500,
	stiffness: 1000,
	mass: 3,
	overshootClamping: true,
	restDisplacementThreshold: 10,
	restSpeedThreshold: 10,
} as const satisfies Omit<Extract<ResolvedAnimation, { type: "spring" }>, "reduceMotion">;

/** The Android default — 250ms with an exponential ease-out. */
export const ANDROID_TIMING = {
	type: "timing",
	duration: 250,
	easing: "outExp",
} as const satisfies Omit<Extract<ResolvedAnimation, { type: "timing" }>, "reduceMotion">;

/**
 * The animation a sheet moves with: the consumer's config over the platform
 * default, every field filled in, reduce motion resolved.
 *
 * iOS gets the spring and everything else the timing — a spring is the worse
 * guess wherever there is no native driver tuned for it. `overrideReduceMotion`
 * beats the config's own `reduceMotion`, which beats `"system"`. Returns a new
 * object each call so the caller may write a velocity into it.
 */
export function selectAnimation(
	config: SheetAnimationConfig | undefined,
	platform: PlatformName,
	overrideReduceMotion: ReduceMotionMode | undefined
): ResolvedAnimation {
	const reduceMotion = overrideReduceMotion ?? config?.reduceMotion ?? "system";
	const resolved: SheetAnimationConfig = config ?? (platform === "ios" ? IOS_SPRING : ANDROID_TIMING);

	if (resolved.type === "spring") {
		return {
			type: "spring",
			damping: resolved.damping ?? IOS_SPRING.damping,
			stiffness: resolved.stiffness ?? IOS_SPRING.stiffness,
			mass: resolved.mass ?? IOS_SPRING.mass,
			overshootClamping: resolved.overshootClamping ?? IOS_SPRING.overshootClamping,
			restDisplacementThreshold: resolved.restDisplacementThreshold ?? IOS_SPRING.restDisplacementThreshold,
			restSpeedThreshold: resolved.restSpeedThreshold ?? IOS_SPRING.restSpeedThreshold,
			reduceMotion,
		};
	}
	return {
		type: "timing",
		duration: resolved.duration ?? ANDROID_TIMING.duration,
		easing: resolved.easing ?? ANDROID_TIMING.easing,
		reduceMotion,
	};
}
