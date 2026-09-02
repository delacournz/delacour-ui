import { Skia, type SkPath } from "@shopify/react-native-skia";

/** A path with nothing in it — what an empty series draws. */
export function emptyPath(): SkPath {
	return Skia.Path.Make();
}

/**
 * An SVG path string as a Skia path.
 *
 * The string comes from `d3-shape` in `core/curve`, which is the one place
 * this package pays for taking d3: the geometry is serialised to text and
 * parsed straight back. It happens once per data change, not per frame.
 *
 * A string Skia cannot parse yields an empty path rather than `null`. Every
 * caller renders it, and an empty path draws nothing — which is a chart with a
 * missing series, not a crash.
 */
export function toSkPath(svg: string): SkPath {
	if (svg === "") return Skia.Path.Make();
	return Skia.Path.MakeFromSVGString(svg) ?? Skia.Path.Make();
}
