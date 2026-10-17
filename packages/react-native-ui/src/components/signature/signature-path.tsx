import { type ReactElement, useMemo } from "react";
import { StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { smoothStroke } from "./signature.stroke";
import type { SignatureStroke } from "./signature.types";

export type SignaturePathProps = {
	strokes: readonly SignatureStroke[];
	color: string | undefined;
	strokeWidth: number;
};

/**
 * Every stroke's smoothed path, keyed by the stroke itself.
 *
 * Strokes are immutable — the history only ever appends, pops or replaces the
 * array — so a stroke that has been smoothed once never needs smoothing again,
 * and a commit costs one new path rather than a pass over the whole signature.
 * A `WeakMap` lets a stroke undone and dropped take its path with it.
 */
const PATH_CACHE = new WeakMap<SignatureStroke, string>();

function pathOf(stroke: SignatureStroke): string {
	const cached = PATH_CACHE.get(stroke);
	if (cached !== undefined) return cached;
	const path = smoothStroke(stroke);
	PATH_CACHE.set(stroke, path);
	return path;
}

/**
 * The finished strokes, as static SVG paths filling the pad.
 *
 * Internal. Re-renders once per committed stroke and never while a finger moves
 * — the stroke under the finger is {@link SignatureLivePath}'s.
 */
export function SignaturePath({ strokes, color, strokeWidth }: SignaturePathProps): ReactElement {
	const paths = useMemo(() => strokes.map(pathOf), [strokes]);

	return (
		<Svg height="100%" pointerEvents="none" style={StyleSheet.absoluteFill} width="100%">
			{paths.map((d, index) => (
				<Path
					d={d}
					fill="none"
					key={index}
					stroke={color}
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={strokeWidth}
				/>
			))}
		</Svg>
	);
}
SignaturePath.displayName = "DelacourUI.Signature.Path";
