import { SkiaViewNativeId } from "react-native-skia/src/views/SkiaViewNativeId";

/** Skia's counter starts at 1000; anything at or above this has been seeded. */
export const SKIA_NATIVE_ID_FLOOR = 10_000;

/** Ids a runtime may hand out before it reaches the next runtime's range. */
const SKIA_NATIVE_ID_SPAN = 10_000;

/** How many ranges a runtime can land in — 1e9 at the top, inside a signed 32-bit int. */
const SKIA_NATIVE_ID_SLOTS = 100_000;

/**
 * Where a JS runtime's Skia canvas ids should start, given the counter as it stands and a number
 * in `[0, 1)`. A counter already at or above the floor is returned as it is, so every copy of this
 * module in an app can run it and only the first moves anything.
 */
export function resolveSkiaNativeId(current: number, random: number): number {
	if (current >= SKIA_NATIVE_ID_FLOOR) return current;
	const slot = Math.floor(random * SKIA_NATIVE_ID_SLOTS);
	return SKIA_NATIVE_ID_FLOOR + slot * SKIA_NATIVE_ID_SPAN + (current - 1000);
}

/**
 * Starts this runtime's canvas ids somewhere the last runtime's never were.
 *
 * **A canvas mounted after a JS reload drew nothing until it re-rendered.** Skia numbers canvases
 * from a module-level counter that restarts at 1000 in every runtime, while its native
 * `ViewRegistry` is a process-wide singleton that outlives the reload. The old runtime's views are
 * torn down after the new one has started, and each leaves a tombstone for its id; the new
 * runtime's first canvases reuse those ids, their pictures are handed to a throwaway entry, and the
 * view registers to an empty one. Nothing draws until the next React commit sends the picture again.
 * A dev-menu reload hits it, and so does `Updates.reloadAsync` after an OTA update.
 * Reported upstream as wcandillon/react-native-skia#4312; drop this once a release fixes it.
 *
 * Evaluated once per runtime, on import, before any canvas has asked for an id. `SkiaViewNativeId`
 * is not exported from the package root, so this reaches it by path — the same file Metro resolves
 * `Canvas` from through the package's `react-native` field.
 *
 * `@delacour/react-native-charts` keeps an identical copy in `src/skia/native-id.ts` for its own
 * canvases, since `Chart` draws through it; change both together.
 */
SkiaViewNativeId.current = resolveSkiaNativeId(SkiaViewNativeId.current, Math.random());
