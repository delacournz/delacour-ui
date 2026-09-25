import type { AnimationSource, SheetAnimationConfig } from "../core";

/** The `animation` prop — a spring or a timing, every field optional. */
export type SheetAnimation = SheetAnimationConfig;

/**
 * Moves `base` to a height. A hook-scope worklet: callable from a gesture
 * callback, a reaction or the intent resolver, all on the UI thread.
 *
 * `velocity` is in height space per second — upward positive — and only a
 * spring reads it.
 */
export type AnimateTo = (target: number, source: AnimationSource, velocity: number) => void;

/** Puts `base` at a height with no animation and settles immediately. */
export type JumpTo = (target: number, source: AnimationSource) => void;

/** What the JS thread hears when an animation lands — `count` is how many detents there were, for the handle's accessibility value. */
export type SettleListener = (index: number, height: number, source: AnimationSource, count: number) => void;

/** What the JS thread hears when an animation starts. */
export type AnimateListener = (
	fromIndex: number,
	toIndex: number,
	fromHeight: number,
	toHeight: number,
	source: AnimationSource
) => void;
